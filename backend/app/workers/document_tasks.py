"""Document processing Celery task — the full extraction pipeline."""

import os
import uuid
from pathlib import Path
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.workers.celery_app import celery_app
from app.core.config import settings
from app.core.logging import get_logger

from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.question_source import QuestionSource
from app.models.answer_key import AnswerKey
from app.models.review_item import ReviewItem

from app.services.storage_service import get_storage_provider
from app.services.pdf_service import PDFService
from app.services.image_service import ImageService
from app.services.ocr_service import get_ocr_provider
from app.services.ai_service import get_ai_provider
from app.services.question_extractor import QuestionExtractor
from app.services.question_merger import QuestionMerger
from app.services.answer_key_service import AnswerKeyService
from app.services.answer_matcher import AnswerMatcher
from app.services.confidence_service import ConfidenceService
from app.services.validation_service import ValidationService
from app.services.review_service import ReviewService
from app.utils.constants import DocumentStatus, QuestionStatus, AnswerStatus

logger = get_logger(__name__)

# Synchronous engine for Celery workers (Celery doesn't use asyncio)
sync_engine = create_engine(
    settings.DATABASE_URL_SYNC,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)
SyncSessionFactory = sessionmaker(bind=sync_engine)


@celery_app.task(
    bind=True,
    name="process_document",
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
)
def process_document(self, document_id: str):
    """Main document processing task.

    Pipeline:
    1. Load document metadata
    2. Determine file type
    3. Extract pages / text
    4. OCR scanned/poor pages
    5. Extract questions (AI/heuristic)
    6. Merge cross-page questions
    7. Detect answer keys
    8. Match answers
    9. Calculate confidence
    10. Create review items
    11. Persist results
    12. Update status
    """
    session = SyncSessionFactory()
    storage = get_storage_provider()

    try:
        # 1. Load document
        doc = session.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error("document_not_found", document_id=document_id)
            return {"error": "Document not found"}

        logger.info("processing_started", document_id=document_id, file_type=doc.file_type)

        # Update status to PROCESSING
        doc.status = DocumentStatus.PROCESSING
        session.commit()

        # Clean up any previous processing results (for retry safety)
        _cleanup_previous_results(session, document_id)

        # Get file path
        file_path = storage.get_full_path(doc.storage_path)

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Document file not found at {file_path}")

        # 2. Determine file type and process accordingly
        if doc.file_type == "pdf":
            pages_data = _process_pdf(session, doc, file_path)
        else:
            pages_data = _process_image(session, doc, file_path)

        # 3. Extract questions from all pages
        ai_provider = get_ai_provider()
        extractor = QuestionExtractor(ai_provider)
        raw_questions = extractor.extract_from_pages(pages_data)

        logger.info("raw_questions_extracted", count=len(raw_questions))

        # 4. Merge cross-page questions
        merger = QuestionMerger(ai_provider)
        merged_questions = merger.merge_cross_page_questions(raw_questions)

        logger.info("questions_merged", count=len(merged_questions))

        # 5. Detect answer keys
        ak_service = AnswerKeyService(ai_provider)
        answer_keys = ak_service.detect_answer_keys(pages_data)

        # 6. Match answers to questions
        matcher = AnswerMatcher()
        matches = matcher.match_answers(merged_questions, answer_keys)

        # Build match lookup
        match_lookup = {m["question_index"]: m for m in matches}

        # 7. Calculate confidence and persist
        confidence_svc = ConfidenceService()
        validation_svc = ValidationService()
        review_svc = ReviewService()

        total_review_items = 0

        for idx, eq in enumerate(merged_questions):
            # Get OCR confidence for source pages
            ocr_confs = []
            for page_data in pages_data:
                if page_data["page_number"] in eq.source_pages:
                    ocr_confs.append(page_data.get("ocr_confidence", 1.0))
            avg_ocr_conf = sum(ocr_confs) / len(ocr_confs) if ocr_confs else 1.0

            # Check answer match
            match = match_lookup.get(idx)
            answer_matched = match and match["status"] == "MATCHED"
            is_cross_page = len(eq.source_pages) > 1

            # Calculate confidence
            confidence = confidence_svc.calculate_question_confidence(
                eq, avg_ocr_conf, answer_matched, is_cross_page
            )
            status = confidence_svc.classify_confidence(confidence)
            review_required = confidence_svc.needs_review(confidence)

            # Determine answer info
            if match and match["status"] == "MATCHED":
                answer_value = match["answer"]
                answer_status = match["status"]
                answer_confidence = match["confidence"]
                answer_source_page = match.get("source_page")
            elif getattr(eq, "answer", None):
                answer_value = eq.answer
                answer_status = AnswerStatus.MATCHED
                answer_confidence = 0.95
                answer_source_page = eq.source_pages[0] if eq.source_pages else None
            else:
                answer_value = None
                answer_status = match["status"] if match else AnswerStatus.NOT_AVAILABLE
                answer_confidence = match["confidence"] if match else None
                answer_source_page = match.get("source_page") if match else None

            # Validate
            validation_issues = validation_svc.validate_question(eq)
            validation_issues += validation_svc.validate_options(eq)

            # Create question record
            question = Question(
                id=uuid.uuid4(),
                document_id=uuid.UUID(document_id),
                question_number=eq.question_number,
                question_text=eq.question_text,
                question_type=eq.question_type,
                answer=answer_value,
                answer_status=answer_status,
                answer_confidence=answer_confidence,
                confidence=confidence,
                status=status,
                review_required=review_required,
            )
            session.add(question)
            session.flush()

            # Create options
            for opt in eq.options:
                session.add(QuestionOption(
                    question_id=question.id,
                    option_key=opt.key,
                    option_text=opt.text,
                ))

            # Create source records
            for page_num in eq.source_pages:
                session.add(QuestionSource(
                    question_id=question.id,
                    document_id=uuid.UUID(document_id),
                    page_number=page_num,
                ))

            # Create review items
            review_items = review_svc.create_review_items_for_question(
                document_id=uuid.UUID(document_id),
                question_id=question.id,
                confidence=confidence,
                question_number=eq.question_number,
                validation_issues=validation_issues,
                is_cross_page=is_cross_page,
                answer_status=answer_status,
                source_pages=eq.source_pages,
            )
            for ri_data in review_items:
                session.add(ReviewItem(**ri_data))
                total_review_items += 1

        # Persist answer keys
        for ak in answer_keys:
            matched = any(
                m["status"] == "MATCHED" and
                str(merged_questions[m["question_index"]].question_number) == str(ak.question_number)
                for m in matches if m["question_index"] < len(merged_questions)
            )
            session.add(AnswerKey(
                document_id=uuid.UUID(document_id),
                question_number=ak.question_number,
                answer=ak.answer,
                confidence=ak.confidence,
                source_page=ak.source_page,
                matched=matched,
            ))

        # 8. Update document status
        final_status = DocumentStatus.COMPLETED
        if total_review_items > 0:
            final_status = DocumentStatus.REVIEW_REQUIRED

        doc.status = final_status
        doc.processed_pages = doc.total_pages
        session.commit()

        logger.info(
            "processing_completed",
            document_id=document_id,
            questions=len(merged_questions),
            answer_keys=len(answer_keys),
            review_items=total_review_items,
            status=final_status,
        )

        return {
            "document_id": document_id,
            "status": final_status,
            "questions": len(merged_questions),
            "answer_keys": len(answer_keys),
            "review_items": total_review_items,
        }

    except Exception as exc:
        session.rollback()
        logger.error("processing_failed", document_id=document_id, error=str(exc))

        # Update document status to FAILED
        try:
            doc = session.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = DocumentStatus.FAILED
                doc.processing_error = str(exc)[:500]
                session.commit()
        except Exception:
            pass

        # Retry if retries remaining
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc)

        return {"error": str(exc)}

    finally:
        session.close()


def _process_pdf(session: Session, doc: Document, file_path: str) -> list[dict]:
    """Process a PDF document — extract text, OCR if needed."""
    pdf_svc = PDFService()
    image_svc = ImageService()
    ocr_provider = get_ocr_provider()
    storage = get_storage_provider()

    if not pdf_svc.is_valid_pdf(file_path):
        raise ValueError("Invalid or corrupted PDF file")

    page_count = pdf_svc.get_page_count(file_path)
    doc.total_pages = page_count
    session.commit()

    pages_data = []

    for i in range(page_count):
        page_num = i + 1  # 1-indexed

        # Extract direct text
        raw_text = pdf_svc.extract_text_from_page(file_path, i)
        needs_ocr = pdf_svc.needs_ocr(raw_text)

        ocr_text = None
        ocr_confidence = None
        image_path = None
        rotation = 0.0

        if needs_ocr:
            # Render page to image
            img_filename = f"{doc.id}_page_{page_num}.png"
            img_storage_path = f"pages/{img_filename}"
            img_full_path = storage.get_local_path(img_storage_path)


            Path(img_full_path).parent.mkdir(parents=True, exist_ok=True)
            pdf_svc.render_page_to_image(file_path, i, img_full_path)

            # Preprocess image
            try:
                image_svc.preprocess_for_ocr(img_full_path)
                rotation = image_svc.detect_rotation(img_full_path)
            except Exception as e:
                logger.warning("image_preprocessing_failed", page=page_num, error=str(e))

            # OCR
            try:
                ocr_result = ocr_provider.extract_text(img_full_path)
                ocr_text = ocr_result.text
                ocr_confidence = ocr_result.confidence
            except Exception as e:
                logger.error("ocr_failed", page=page_num, error=str(e))
                ocr_text = ""
                ocr_confidence = 0.0

            image_path = img_storage_path

        # Best available text
        best_text = ocr_text if needs_ocr and ocr_text else raw_text

        # Save page record
        page_record = DocumentPage(
            document_id=doc.id,
            page_number=page_num,
            image_path=image_path,
            raw_text=raw_text,
            ocr_text=ocr_text,
            ocr_confidence=ocr_confidence,
            rotation=rotation,
        )
        session.add(page_record)

        # Update progress
        doc.processed_pages = page_num
        session.commit()

        pages_data.append({
            "page_number": page_num,
            "text": best_text,
            "ocr_confidence": ocr_confidence if ocr_confidence is not None else 1.0,
        })

        logger.info(
            "page_processed",
            page=page_num,
            needs_ocr=needs_ocr,
            text_length=len(best_text) if best_text else 0,
        )

    return pages_data


def _process_image(session: Session, doc: Document, file_path: str) -> list[dict]:
    """Process a single image document — OCR and extract."""
    image_svc = ImageService()
    ocr_provider = get_ocr_provider()

    doc.total_pages = 1
    session.commit()

    # Preprocess image
    try:
        image_svc.resize_if_needed(file_path)
        image_svc.preprocess_for_ocr(file_path)
        rotation = image_svc.detect_rotation(file_path)
    except Exception as e:
        logger.warning("image_preprocessing_failed", error=str(e))
        rotation = 0.0

    # OCR
    try:
        ocr_result = ocr_provider.extract_text(file_path)
        ocr_text = ocr_result.text
        ocr_confidence = ocr_result.confidence
    except Exception as e:
        logger.error("ocr_failed", error=str(e))
        ocr_text = ""
        ocr_confidence = 0.0

    # Save page record
    page_record = DocumentPage(
        document_id=doc.id,
        page_number=1,
        image_path=doc.storage_path,
        raw_text=None,
        ocr_text=ocr_text,
        ocr_confidence=ocr_confidence,
        rotation=rotation,
    )
    session.add(page_record)
    doc.processed_pages = 1
    session.commit()

    return [{
        "page_number": 1,
        "text": ocr_text,
        "ocr_confidence": ocr_confidence,
    }]


def _cleanup_previous_results(session: Session, document_id: str):
    """Remove previous extraction results for retry safety."""
    doc_uuid = uuid.UUID(document_id)

    # Delete in order to respect FK constraints
    session.query(ReviewItem).filter(ReviewItem.document_id == doc_uuid).delete()
    session.query(QuestionSource).filter(QuestionSource.document_id == doc_uuid).delete()

    # Need to get question IDs first for options
    question_ids = [
        q.id for q in session.query(Question.id).filter(Question.document_id == doc_uuid).all()
    ]
    if question_ids:
        session.query(QuestionOption).filter(QuestionOption.question_id.in_(question_ids)).delete(
            synchronize_session=False
        )

    session.query(Question).filter(Question.document_id == doc_uuid).delete()
    session.query(AnswerKey).filter(AnswerKey.document_id == doc_uuid).delete()
    session.query(DocumentPage).filter(DocumentPage.document_id == doc_uuid).delete()
    session.commit()
