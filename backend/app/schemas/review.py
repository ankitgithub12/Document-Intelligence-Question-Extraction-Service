"""Review item schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReviewItemResponse(BaseModel):
    id: str
    document_id: str
    question_id: Optional[str] = None
    issue_type: str
    reason: str
    confidence: Optional[float] = None
    source_page: Optional[int] = None
    resolved: bool
    created_at: datetime
    updated_at: datetime


class ReviewListResponse(BaseModel):
    success: bool = True
    data: list[ReviewItemResponse]
    total: int
    page: int
    page_size: int


class ReviewDetailResponse(BaseModel):
    success: bool = True
    data: ReviewItemResponse
