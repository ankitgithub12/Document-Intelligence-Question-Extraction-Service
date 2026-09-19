"""Question model — stores extracted questions with confidence and answer status."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="UNKNOWN"
    )
    answer: Mapped[str | None] = mapped_column(String(50), nullable=True)
    answer_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="NOT_AVAILABLE"
    )
    answer_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="EXTRACTED"
    )
    review_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    document = relationship("Document", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    sources = relationship("QuestionSource", back_populates="question", cascade="all, delete-orphan")
    review_items = relationship("ReviewItem", back_populates="question", cascade="all, delete-orphan")
