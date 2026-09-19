"""Answer schemas."""

from typing import Optional
from pydantic import BaseModel


class AnswerResponse(BaseModel):
    question_id: str
    question_number: Optional[str] = None
    answer: Optional[str] = None
    answer_status: str
    answer_confidence: Optional[float] = None
    source_page: Optional[int] = None


class AnswerListResponse(BaseModel):
    success: bool = True
    data: list[AnswerResponse]
