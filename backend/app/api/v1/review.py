"""Review items API endpoints."""

from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.repositories.document_repository import DocumentRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.review import ReviewItemResponse, ReviewListResponse, ReviewDetailResponse
from app.utils.exceptions import DocumentNotFoundError, ReviewItemNotFoundError, ForbiddenError

router = APIRouter(tags=["Review Items"])


@router.get(
    "/documents/{document_id}/review-items",
    response_model=ReviewListResponse,
    summary="List review items for a document",
    description="List all review items flagged during extraction for a document.",
)
async def list_review_items(
    document_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id, user_id)
    if not doc:
        raise DocumentNotFoundError()

    q_repo = QuestionRepository(db)
    items, total = await q_repo.get_review_items(document_id, page, page_size, resolved)

    data = [
        {
            "id": str(item.id),
            "document_id": str(item.document_id),
            "question_id": str(item.question_id) if item.question_id else None,
            "issue_type": item.issue_type,
            "reason": item.reason,
            "confidence": item.confidence,
            "source_page": item.source_page,
            "resolved": item.resolved,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in items
    ]

    return {
        "success": True,
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/review-items/{review_item_id}",
    response_model=ReviewDetailResponse,
    summary="Get review item details",
    description="Get details for a specific review item.",
)
async def get_review_item(
    review_item_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    q_repo = QuestionRepository(db)
    item = await q_repo.get_review_item_by_id(review_item_id)
    if not item:
        raise ReviewItemNotFoundError()

    # Verify ownership
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(item.document_id, user_id)
    if not doc:
        raise ForbiddenError("You do not have access to this review item")

    return {
        "success": True,
        "data": {
            "id": str(item.id),
            "document_id": str(item.document_id),
            "question_id": str(item.question_id) if item.question_id else None,
            "issue_type": item.issue_type,
            "reason": item.reason,
            "confidence": item.confidence,
            "source_page": item.source_page,
            "resolved": item.resolved,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        },
    }


@router.get(
    "/review-items",
    response_model=ReviewListResponse,
    summary="List all review items for current user",
    description="List all review items across user documents with optional document_id and resolved filters.",
)
async def list_all_user_review_items(
    document_id: Optional[UUID] = Query(None, description="Filter by document ID"),
    resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    q_repo = QuestionRepository(db)
    items, total = await q_repo.get_user_review_items(
        user_id=user_id,
        page=page,
        page_size=page_size,
        resolved=resolved,
        doc_id=document_id,
    )

    data = [
        {
            "id": str(item.id),
            "document_id": str(item.document_id),
            "question_id": str(item.question_id) if item.question_id else None,
            "issue_type": item.issue_type,
            "reason": item.reason,
            "confidence": item.confidence,
            "source_page": item.source_page,
            "resolved": item.resolved,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in items
    ]

    return {
        "success": True,
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch(
    "/review-items/{review_item_id}/resolve",
    response_model=ReviewDetailResponse,
    summary="Resolve or reopen review item",
    description="Toggle resolved state for a Human-In-The-Loop review item.",
)
async def resolve_review_item(
    review_item_id: UUID,
    resolved: bool = Query(True, description="Mark as resolved (True) or reopen (False)"),
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    q_repo = QuestionRepository(db)
    item = await q_repo.get_review_item_by_id(review_item_id)
    if not item:
        raise ReviewItemNotFoundError()

    # Verify ownership
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(item.document_id, user_id)
    if not doc:
        raise ForbiddenError("You do not have access to this review item")

    updated = await q_repo.update_review_item_status(review_item_id, resolved)
    return {
        "success": True,
        "data": {
            "id": str(updated.id),
            "document_id": str(updated.document_id),
            "question_id": str(updated.question_id) if updated.question_id else None,
            "issue_type": updated.issue_type,
            "reason": updated.reason,
            "confidence": updated.confidence,
            "source_page": updated.source_page,
            "resolved": updated.resolved,
            "created_at": updated.created_at,
            "updated_at": updated.updated_at,
        },
    }
