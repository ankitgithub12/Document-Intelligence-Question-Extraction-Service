"""Document service — upload, listing, status, and deletion."""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.document_repository import DocumentRepository
from app.services.storage_service import get_storage_provider
from app.utils.helpers import safe_filename
from app.utils.constants import DocumentStatus
from app.utils.exceptions import DocumentNotFoundError, ForbiddenError


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.repo = DocumentRepository(db)
        self.storage = get_storage_provider()

    async def upload_document(
        self, user_id: UUID, original_filename: str, file_type: str,
        content: bytes
    ) -> dict:
        """Save file, create DB record, return document info."""
        filename = safe_filename(original_filename)
        storage_path = f"documents/{filename}"

        # Save to storage
        self.storage.save(content, storage_path)

        # Create database record
        doc = await self.repo.create(
            user_id=user_id,
            filename=filename,
            original_filename=original_filename,
            file_type=file_type,
            file_size=len(content),
            storage_path=storage_path,
            status=DocumentStatus.QUEUED,
        )

        return {
            "document_id": str(doc.id),
            "filename": original_filename,
            "status": DocumentStatus.QUEUED,
        }

    async def get_document(self, doc_id: UUID, user_id: UUID) -> dict:
        """Get document details with question/review counts."""
        doc = await self.repo.get_by_id(doc_id, user_id)
        if not doc:
            raise DocumentNotFoundError()

        question_count = await self.repo.get_question_count(doc_id)
        review_count = await self.repo.get_review_count(doc_id)

        return {
            "id": str(doc.id),
            "filename": doc.filename,
            "original_filename": doc.original_filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "status": doc.status,
            "total_pages": doc.total_pages,
            "processed_pages": doc.processed_pages,
            "processing_error": doc.processing_error,
            "question_count": question_count,
            "review_count": review_count,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
        }

    async def list_documents(
        self, user_id: UUID, page: int = 1, page_size: int = 20,
        status_filter: str | None = None
    ) -> tuple[list[dict], int]:
        """List user's documents with counts."""
        documents, total = await self.repo.list_by_user(
            user_id, page, page_size, status_filter
        )
        result = []
        for doc in documents:
            q_count = await self.repo.get_question_count(doc.id)
            r_count = await self.repo.get_review_count(doc.id)
            result.append({
                "id": str(doc.id),
                "filename": doc.filename,
                "original_filename": doc.original_filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "status": doc.status,
                "total_pages": doc.total_pages,
                "processed_pages": doc.processed_pages,
                "processing_error": doc.processing_error,
                "question_count": q_count,
                "review_count": r_count,
                "created_at": doc.created_at,
                "updated_at": doc.updated_at,
            })
        return result, total

    async def get_status(self, doc_id: UUID, user_id: UUID) -> dict:
        """Get processing status with progress information."""
        doc = await self.repo.get_by_id(doc_id, user_id)
        if not doc:
            raise DocumentNotFoundError()

        question_count = await self.repo.get_question_count(doc_id)
        review_count = await self.repo.get_review_count(doc_id)

        progress = None
        if doc.total_pages and doc.total_pages > 0:
            processed = doc.processed_pages or 0
            progress = {
                "total_pages": doc.total_pages,
                "processed_pages": processed,
                "percentage": round((processed / doc.total_pages) * 100),
            }

        return {
            "document_id": str(doc.id),
            "status": doc.status,
            "progress": progress,
            "question_count": question_count,
            "review_count": review_count,
            "error": doc.processing_error,
        }

    async def delete_document(self, doc_id: UUID, user_id: UUID) -> bool:
        """Delete document, its file, and all associated data (via CASCADE)."""
        doc = await self.repo.get_by_id(doc_id, user_id)
        if not doc:
            raise DocumentNotFoundError()

        # Delete file from storage
        try:
            self.storage.delete(doc.storage_path)
        except Exception:
            pass  # File may already be gone

        return await self.repo.delete(doc_id, user_id)
