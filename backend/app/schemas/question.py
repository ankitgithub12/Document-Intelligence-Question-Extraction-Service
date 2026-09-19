"""Question schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class OptionResponse(BaseModel):
    key: str
    text: str


class AnswerDetail(BaseModel):
    value: Optional[str] = None
    confidence: Optional[float] = None
    source_page: Optional[int] = None
    status: str = "NOT_AVAILABLE"


class SourceDetail(BaseModel):
    document: str
    pages: list[int]


class QuestionResponse(BaseModel):
    id: str
    document_id: str
    question_number: Optional[str] = None
    question: str
    question_type: str
    options: list[OptionResponse] = []
    answer: AnswerDetail
    source: SourceDetail
    confidence: float
    status: str
    review_required: bool
    created_at: datetime


class QuestionListResponse(BaseModel):
    success: bool = True
    data: list[QuestionResponse]
    total: int
    page: int
    page_size: int


class QuestionDetailResponse(BaseModel):
    success: bool = True
    data: QuestionResponse
