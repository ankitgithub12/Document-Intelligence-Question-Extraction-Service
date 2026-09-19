"""Package init for models — imports all models for Alembic discovery."""

from app.models.user import User
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.question_source import QuestionSource
from app.models.answer_key import AnswerKey
from app.models.review_item import ReviewItem
from app.models.document_relationship import DocumentRelationship

__all__ = [
    "User",
    "Document",
    "DocumentPage",
    "Question",
    "QuestionOption",
    "QuestionSource",
    "AnswerKey",
    "ReviewItem",
    "DocumentRelationship",
]
