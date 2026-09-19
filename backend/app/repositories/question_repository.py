"""Question repository — database operations for questions, options, sources, answers, reviews."""

from typing import Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.question_source import QuestionSource
from app.models.answer_key import AnswerKey
from app.models.review_item import ReviewItem


class QuestionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> Question:
        q = Question(**kwargs)
        self.db.add(q)
        await self.db.flush()
        return q

    async def create_option(self, **kwargs) -> QuestionOption:
        opt = QuestionOption(**kwargs)
        self.db.add(opt)
        await self.db.flush()
        return opt

    async def create_source(self, **kwargs) -> QuestionSource:
        src = QuestionSource(**kwargs)
        self.db.add(src)
        await self.db.flush()
        return src

    async def create_answer_key(self, **kwargs) -> AnswerKey:
        ak = AnswerKey(**kwargs)
        self.db.add(ak)
        await self.db.flush()
        return ak

    async def create_review_item(self, **kwargs) -> ReviewItem:
        ri = ReviewItem(**kwargs)
        self.db.add(ri)
        await self.db.flush()
        return ri

    async def get_by_id(self, question_id: UUID) -> Optional[Question]:
        result = await self.db.execute(
            select(Question)
            .options(selectinload(Question.options), selectinload(Question.sources))
            .where(Question.id == question_id)
        )
        return result.scalar_one_or_none()

    async def list_by_document(
        self, doc_id: UUID, page: int = 1, page_size: int = 50,
        question_type: Optional[str] = None,
        status_filter: Optional[str] = None,
        review_required: Optional[bool] = None,
        min_confidence: Optional[float] = None,
        max_confidence: Optional[float] = None,
    ) -> tuple[list[Question], int]:
        query = (
            select(Question)
            .options(selectinload(Question.options), selectinload(Question.sources))
            .where(Question.document_id == doc_id)
        )
        count_query = select(func.count(Question.id)).where(Question.document_id == doc_id)

        if question_type:
            query = query.where(Question.question_type == question_type)
            count_query = count_query.where(Question.question_type == question_type)
        if status_filter:
            query = query.where(Question.status == status_filter)
            count_query = count_query.where(Question.status == status_filter)
        if review_required is not None:
            query = query.where(Question.review_required == review_required)
            count_query = count_query.where(Question.review_required == review_required)
        if min_confidence is not None:
            query = query.where(Question.confidence >= min_confidence)
            count_query = count_query.where(Question.confidence >= min_confidence)
        if max_confidence is not None:
            query = query.where(Question.confidence <= max_confidence)
            count_query = count_query.where(Question.confidence <= max_confidence)

        query = query.order_by(Question.question_number.asc().nulls_last(), Question.created_at)
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        questions = list(result.scalars().unique().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return questions, total

    async def get_answer_keys(self, doc_id: UUID) -> list[AnswerKey]:
        result = await self.db.execute(
            select(AnswerKey).where(AnswerKey.document_id == doc_id)
        )
        return list(result.scalars().all())

    async def get_review_items(
        self, doc_id: UUID, page: int = 1, page_size: int = 50,
        resolved: Optional[bool] = None
    ) -> tuple[list[ReviewItem], int]:
        query = select(ReviewItem).where(ReviewItem.document_id == doc_id)
        count_query = select(func.count(ReviewItem.id)).where(ReviewItem.document_id == doc_id)

        if resolved is not None:
            query = query.where(ReviewItem.resolved == resolved)
            count_query = count_query.where(ReviewItem.resolved == resolved)

        query = query.order_by(ReviewItem.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return items, total

    async def get_user_review_items(
        self, user_id: UUID, page: int = 1, page_size: int = 50,
        resolved: Optional[bool] = None, doc_id: Optional[UUID] = None,
    ) -> tuple[list[ReviewItem], int]:
        from app.models.document import Document
        query = (
            select(ReviewItem)
            .join(Document, ReviewItem.document_id == Document.id)
            .where(Document.user_id == user_id)
        )
        count_query = (
            select(func.count(ReviewItem.id))
            .join(Document, ReviewItem.document_id == Document.id)
            .where(Document.user_id == user_id)
        )

        if doc_id is not None:
            query = query.where(ReviewItem.document_id == doc_id)
            count_query = count_query.where(ReviewItem.document_id == doc_id)

        if resolved is not None:
            query = query.where(ReviewItem.resolved == resolved)
            count_query = count_query.where(ReviewItem.resolved == resolved)

        query = query.order_by(ReviewItem.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return items, total

    async def update_review_item_status(self, review_id: UUID, resolved: bool) -> Optional[ReviewItem]:
        item = await self.get_review_item_by_id(review_id)
        if item:
            item.resolved = resolved
            await self.db.flush()
        return item

    async def get_review_item_by_id(self, review_id: UUID) -> Optional[ReviewItem]:
        result = await self.db.execute(
            select(ReviewItem).where(ReviewItem.id == review_id)
        )
        return result.scalar_one_or_none()

    async def delete_questions_by_document(self, doc_id: UUID) -> None:
        """Delete all questions for a document — used before re-processing."""
        result = await self.db.execute(
            select(Question).where(Question.document_id == doc_id)
        )
        for q in result.scalars().all():
            await self.db.delete(q)
        await self.db.flush()

    async def delete_answer_keys_by_document(self, doc_id: UUID) -> None:
        result = await self.db.execute(
            select(AnswerKey).where(AnswerKey.document_id == doc_id)
        )
        for ak in result.scalars().all():
            await self.db.delete(ak)
        await self.db.flush()

    async def delete_review_items_by_document(self, doc_id: UUID) -> None:
        result = await self.db.execute(
            select(ReviewItem).where(ReviewItem.document_id == doc_id)
        )
        for ri in result.scalars().all():
            await self.db.delete(ri)
        await self.db.flush()
