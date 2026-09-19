"""Document relationship schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class CreateRelationshipRequest(BaseModel):
    related_document_id: str
    relationship_type: str = Field(
        ..., pattern="^(ANSWER_KEY|QUESTION_PAPER|RELATED_DOCUMENT)$"
    )


class RelationshipResponse(BaseModel):
    id: str
    source_document_id: str
    related_document_id: str
    relationship_type: str
    created_at: datetime


class RelationshipListResponse(BaseModel):
    success: bool = True
    data: list[RelationshipResponse]
