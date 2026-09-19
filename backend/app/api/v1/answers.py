"""Answers API endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.repositories.document_repository import DocumentRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.answer import AnswerResponse, AnswerListResponse
from app.utils.exceptions import DocumentNotFoundError, QuestionNotFoundError, ForbiddenError

router = APIRouter(tags=["Answers"])


@router.get(
    "/documents/{document_id}/answers",
    response_model=AnswerListResponse,
    summary="List answers for a document",
    description="Get all answer mappings for a document's extracted questions.",
)
async def list_answers(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id, user_id)
    if not doc:
        raise DocumentNotFoundError()

    q_repo = QuestionRepository(db)
    questions, _ = await q_repo.list_by_document(document_id, page=1, page_size=1000)

    data = [
        {
            "question_id": str(q.id),
            "question_number": q.question_number,
            "answer": q.answer,
            "answer_status": q.answer_status,
            "answer_confidence": q.answer_confidence,
            "source_page": None,
        }
        for q in questions
    ]

    return {"success": True, "data": data}


@router.get(
    "/questions/{question_id}/answer",
    response_model=AnswerResponse,
    summary="Get answer for a question",
    description="Get the answer details for a specific question.",
)
async def get_answer(
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    q_repo = QuestionRepository(db)
    question = await q_repo.get_by_id(question_id)
    if not question:
        raise QuestionNotFoundError()

    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(question.document_id, user_id)
    if not doc:
        raise ForbiddenError("You do not have access to this question")

    return {
        "question_id": str(question.id),
        "question_number": question.question_number,
        "answer": question.answer,
        "answer_status": question.answer_status,
        "answer_confidence": question.answer_confidence,
        "source_page": None,
    }
