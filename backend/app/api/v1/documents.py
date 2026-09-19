"""Document API endpoints."""

from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.document import (
    DocumentUploadResponse, DocumentListResponse,
    DocumentDetailResponse, DocumentStatusResponse,
)
from app.services.document_service import DocumentService
from app.utils.file_validation import validate_upload
from app.workers.document_tasks import process_document

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "",
    response_model=DocumentUploadResponse,
    status_code=201,
    summary="Upload a document",
    description="Upload a PDF, JPG, JPEG, or PNG document for processing. "
    "The file is validated, stored, and queued for asynchronous processing.",
)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    content = await file.read()
    detected_type = validate_upload(file.filename, file.content_type, content)

    service = DocumentService(db)
    result = await service.upload_document(
        user_id=user_id,
        original_filename=file.filename,
        file_type=detected_type.value,
        content=content,
    )

    # Queue async processing
    process_document.delay(result["document_id"])

    return {"success": True, "data": result}


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List documents",
    description="List all documents for the authenticated user with pagination and optional status filter.",
)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DocumentService(db)
    documents, total = await service.list_documents(user_id, page, page_size, status)
    return {
        "success": True,
        "data": documents,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/{document_id}",
    response_model=DocumentDetailResponse,
    summary="Get document details",
    description="Get full details for a specific document including question and review counts.",
)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DocumentService(db)
    data = await service.get_document(document_id, user_id)
    return {"success": True, "data": data}


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
    summary="Get processing status",
    description="Get the current processing status and progress for a document.",
)
async def get_document_status(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DocumentService(db)
    return await service.get_status(document_id, user_id)


@router.delete(
    "/{document_id}",
    status_code=200,
    summary="Delete a document",
    description="Delete a document and all associated data (questions, answers, review items).",
)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    service = DocumentService(db)
    await service.delete_document(document_id, user_id)
    return {"success": True, "message": "Document deleted"}
