"""Application-wide constants and enumerations."""

from enum import Enum


class DocumentStatus(str, Enum):
    """Document processing status."""
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    FAILED = "FAILED"


class QuestionType(str, Enum):
    """Detected question type."""
    MCQ = "MCQ"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"
    UNKNOWN = "UNKNOWN"


class AnswerStatus(str, Enum):
    """Answer matching status."""
    MATCHED = "MATCHED"
    UNCERTAIN = "UNCERTAIN"
    UNMATCHED = "UNMATCHED"
    NOT_AVAILABLE = "NOT_AVAILABLE"


class QuestionStatus(str, Enum):
    """Question extraction status."""
    EXTRACTED = "EXTRACTED"
    PARTIAL = "PARTIAL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class ReviewIssueType(str, Enum):
    """Types of review issues."""
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    MISSING_QUESTION_NUMBER = "MISSING_QUESTION_NUMBER"
    INCOMPLETE_QUESTION = "INCOMPLETE_QUESTION"
    OCR_ERROR = "OCR_ERROR"
    UNCERTAIN_OPTIONS = "UNCERTAIN_OPTIONS"
    UNCERTAIN_ANSWER = "UNCERTAIN_ANSWER"
    UNMATCHED_ANSWER = "UNMATCHED_ANSWER"
    CROSS_PAGE_MERGE = "CROSS_PAGE_MERGE"
    AI_EXTRACTION_ERROR = "AI_EXTRACTION_ERROR"


class RelationshipType(str, Enum):
    """Document relationship types."""
    ANSWER_KEY = "ANSWER_KEY"
    QUESTION_PAPER = "QUESTION_PAPER"
    RELATED_DOCUMENT = "RELATED_DOCUMENT"


class FileType(str, Enum):
    """Supported file types."""
    PDF = "pdf"
    JPG = "jpg"
    JPEG = "jpeg"
    PNG = "png"


# MIME type mappings
ALLOWED_MIME_TYPES = {
    "application/pdf": FileType.PDF,
    "image/jpeg": FileType.JPG,
    "image/png": FileType.PNG,
}

# File signature (magic bytes) mappings
FILE_SIGNATURES = {
    b"%PDF": FileType.PDF,
    b"\xff\xd8\xff": FileType.JPG,
    b"\x89PNG": FileType.PNG,
}
