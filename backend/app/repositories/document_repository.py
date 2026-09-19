"""Document repository — database operations for documents and related entities."""

from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.question_source import QuestionSource
from app.models.answer_key import AnswerKey
from app.models.review_item import ReviewItem
from app.models.document_relationship import DocumentRelationship


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> Document:
        doc = Document(**kwargs)
        self.db.add(doc)
        await self.db.flush()
        return doc

    async def get_by_id(self, doc_id: UUID, user_id: UUID) -> Optional[Document]:
        result = await self.db.execute(
            select(Document).where(Document.id == doc_id, Document.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_any_user(self, doc_id: UUID) -> Optional[Document]:
        """Get document regardless of user — for internal/worker use only."""
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: UUID, page: int = 1, page_size: int = 20,
        status_filter: Optional[str] = None
    ) -> tuple[list[Document], int]:
        query = select(Document).where(Document.user_id == user_id)
        count_query = select(func.count(Document.id)).where(Document.user_id == user_id)

        if status_filter:
            query = query.where(Document.status == status_filter)
            count_query = count_query.where(Document.status == status_filter)

        query = query.order_by(Document.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        documents = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return documents, total

    async def update_status(self, doc_id: UUID, status: str, **kwargs) -> None:
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if doc:
            doc.status = status
            for key, value in kwargs.items():
                setattr(doc, key, value)
            await self.db.flush()

    async def delete(self, doc_id: UUID, user_id: UUID) -> bool:
        result = await self.db.execute(
            select(Document).where(Document.id == doc_id, Document.user_id == user_id)
        )
        doc = result.scalar_one_or_none()
        if doc:
            await self.db.delete(doc)
            await self.db.flush()
            return True
        return False

    async def get_question_count(self, doc_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Question.id)).where(Question.document_id == doc_id)
        )
        return result.scalar() or 0

    async def get_review_count(self, doc_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(ReviewItem.id)).where(
                ReviewItem.document_id == doc_id, ReviewItem.resolved == False
            )
        )
        return result.scalar() or 0

    # Page operations
    async def create_page(self, **kwargs) -> DocumentPage:
        page = DocumentPage(**kwargs)
        self.db.add(page)
        await self.db.flush()
        return page

    async def get_pages(self, doc_id: UUID) -> list[DocumentPage]:
        result = await self.db.execute(
            select(DocumentPage)
            .where(DocumentPage.document_id == doc_id)
            .order_by(DocumentPage.page_number)
        )
        return list(result.scalars().all())

    # Relationship operations
    async def create_relationship(self, **kwargs) -> DocumentRelationship:
        rel = DocumentRelationship(**kwargs)
        self.db.add(rel)
        await self.db.flush()
        return rel

    async def get_relationships(self, doc_id: UUID) -> list[DocumentRelationship]:
        result = await self.db.execute(
            select(DocumentRelationship).where(
                (DocumentRelationship.source_document_id == doc_id) |
                (DocumentRelationship.related_document_id == doc_id)
            )
        )
        return list(result.scalars().all())

    async def relationship_exists(
        self, source_id: UUID, related_id: UUID, rel_type: str
    ) -> bool:
        result = await self.db.execute(
            select(func.count(DocumentRelationship.id)).where(
                DocumentRelationship.source_document_id == source_id,
                DocumentRelationship.related_document_id == related_id,
                DocumentRelationship.relationship_type == rel_type,
            )
        )
        return (result.scalar() or 0) > 0
