"""Validation service — validates extraction results before persistence."""

from app.services.ai_service import ExtractedQuestion
from app.core.logging import get_logger

logger = get_logger(__name__)


class ValidationService:
    """Validates extracted data integrity before database persistence."""

    def validate_question(self, question: ExtractedQuestion) -> list[str]:
        """Validate an extracted question. Returns list of issue descriptions."""
        issues = []

        if not question.question_text or len(question.question_text.strip()) < 5:
            issues.append("Question text is too short or empty")

        if not question.question_number:
            issues.append("Missing question number")

        if question.question_type == "MCQ" and len(question.options) < 2:
            issues.append("MCQ question has fewer than 2 options")

        if question.question_type == "MCQ" and len(question.options) > 0:
            keys = [o.key.upper() for o in question.options]
            expected = [chr(65 + i) for i in range(len(keys))]
            if keys != expected:
                issues.append(f"Option keys are not sequential: {keys}")

        # Check for likely garbage text
        if question.question_text:
            alpha_ratio = sum(1 for c in question.question_text if c.isalpha()) / max(
                len(question.question_text), 1
            )
            if alpha_ratio < 0.3:
                issues.append("Question text has very low alphabetic character ratio (possible OCR error)")

        return issues

    def validate_options(self, question: ExtractedQuestion) -> list[str]:
        """Validate options for an extracted question."""
        issues = []

        for opt in question.options:
            if not opt.text or len(opt.text.strip()) < 1:
                issues.append(f"Option {opt.key} has empty text")
            if not opt.key:
                issues.append("Option has empty key")

        return issues
