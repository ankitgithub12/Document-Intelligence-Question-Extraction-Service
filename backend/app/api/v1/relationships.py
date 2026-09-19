"""Document relationships API endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.repositories.document_repository import DocumentRepository
from app.schemas.relationship import (
    CreateRelationshipRequest, RelationshipResponse, RelationshipListResponse,
)
from app.utils.exceptions import DocumentNotFoundError, RelationshipExistsError

router = APIRouter(tags=["Document Relationships"])


@router.post(
    "/documents/{document_id}/relationships",
    status_code=201,
    summary="Create a document relationship",
    description="Link two documents (e.g., question paper ↔ answer key).",
)
async def create_relationship(
    document_id: UUID,
    request: CreateRelationshipRequest,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    doc_repo = DocumentRepository(db)

    # Verify source document ownership
    source_doc = await doc_repo.get_by_id(document_id, user_id)
    if not source_doc:
        raise DocumentNotFoundError()

    # Verify related document ownership
    related_id = UUID(request.related_document_id)
    related_doc = await doc_repo.get_by_id(related_id, user_id)
    if not related_doc:
        raise DocumentNotFoundError()

    # Check duplicate
    exists = await doc_repo.relationship_exists(
        document_id, related_id, request.relationship_type
    )
    if exists:
        raise RelationshipExistsError()

    rel = await doc_repo.create_relationship(
        source_document_id=document_id,
        related_document_id=related_id,
        relationship_type=request.relationship_type,
    )

    return {
        "success": True,
        "data": {
            "id": str(rel.id),
            "source_document_id": str(rel.source_document_id),
            "related_document_id": str(rel.related_document_id),
            "relationship_type": rel.relationship_type,
            "created_at": rel.created_at,
        },
    }


@router.get(
    "/documents/{document_id}/relationships",
    response_model=RelationshipListResponse,
    summary="List document relationships",
    description="List all relationships for a document.",
)
async def list_relationships(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id, user_id)
    if not doc:
        raise DocumentNotFoundError()

    relationships = await doc_repo.get_relationships(document_id)
    data = [
        {
            "id": str(r.id),
            "source_document_id": str(r.source_document_id),
            "related_document_id": str(r.related_document_id),
            "relationship_type": r.relationship_type,
            "created_at": r.created_at,
        }
        for r in relationships
    ]

    return {"success": True, "data": data}
