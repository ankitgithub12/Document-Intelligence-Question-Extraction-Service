"""Document schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    success: bool = True
    data: dict


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    total_pages: Optional[int] = None
    processed_pages: Optional[int] = None
    processing_error: Optional[str] = None
    question_count: int = 0
    review_count: int = 0
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    success: bool = True
    data: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class DocumentStatusResponse(BaseModel):
    document_id: str
    status: str
    progress: Optional[dict] = None
    question_count: int = 0
    review_count: int = 0
    error: Optional[str] = None


class DocumentDetailResponse(BaseModel):
    success: bool = True
    data: DocumentResponse
