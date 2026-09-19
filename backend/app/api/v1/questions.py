"""Questions API endpoints."""

from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.repositories.document_repository import DocumentRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.question import (
    QuestionResponse, QuestionListResponse, QuestionDetailResponse,
    OptionResponse, AnswerDetail, SourceDetail,
)
from app.utils.exceptions import DocumentNotFoundError, QuestionNotFoundError, ForbiddenError

router = APIRouter(tags=["Questions"])


def _build_question_response(q, doc_filename: str) -> dict:
    """Build a QuestionResponse dict from a Question model."""
    options = [{"key": o.option_key, "text": o.option_text} for o in q.options]
    source_pages = sorted(set(s.page_number for s in q.sources))

    return {
        "id": str(q.id),
        "document_id": str(q.document_id),
        "question_number": q.question_number,
        "question": q.question_text,
        "question_type": q.question_type,
        "options": options,
        "answer": {
            "value": q.answer,
            "confidence": q.answer_confidence,
            "source_page": None,  # Could be enhanced with answer key source page
            "status": q.answer_status,
        },
        "source": {
            "document": doc_filename,
            "pages": source_pages,
        },
        "confidence": q.confidence,
        "status": q.status,
        "review_required": q.review_required,
        "created_at": q.created_at,
    }


@router.get(
    "/documents/{document_id}/questions",
    response_model=QuestionListResponse,
    summary="List questions for a document",
    description="List all extracted questions for a document with pagination and filters.",
)
async def list_questions(
    document_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    question_type: Optional[str] = Query(None, description="Filter by question type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    review_required: Optional[bool] = Query(None, description="Filter by review required"),
    min_confidence: Optional[float] = Query(None, description="Filter by minimum confidence"),
    max_confidence: Optional[float] = Query(None, description="Filter by maximum confidence"),
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id, user_id)
    if not doc:
        raise DocumentNotFoundError()

    q_repo = QuestionRepository(db)
    questions, total = await q_repo.list_by_document(
        document_id,
        page,
        page_size,
        question_type,
        status,
        review_required,
        min_confidence,
        max_confidence,
    )

    data = [_build_question_response(q, doc.original_filename) for q in questions]

    return {
        "success": True,
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/questions/{question_id}",
    response_model=QuestionDetailResponse,
    summary="Get question details",
    description="Get full details for a specific question including options, answer, and source pages.",
)
async def get_question(
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    q_repo = QuestionRepository(db)
    question = await q_repo.get_by_id(question_id)
    if not question:
        raise QuestionNotFoundError()

    # Verify ownership
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(question.document_id, user_id)
    if not doc:
        raise ForbiddenError("You do not have access to this question")

    data = _build_question_response(question, doc.original_filename)
    return {"success": True, "data": data}
