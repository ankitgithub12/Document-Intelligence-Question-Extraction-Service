"""Confidence service — calculates and classifies extraction confidence."""

from app.core.config import settings
from app.services.ai_service import ExtractedQuestion
from app.utils.constants import QuestionStatus


class ConfidenceService:
    """Calculates multi-signal confidence scores and classifies extraction quality."""

    def __init__(self):
        self.extracted_threshold = settings.CONFIDENCE_EXTRACTED_THRESHOLD
        self.partial_threshold = settings.CONFIDENCE_PARTIAL_THRESHOLD

    def classify_confidence(self, confidence: float) -> str:
        """Classify confidence into status categories."""
        if confidence >= self.extracted_threshold:
            return QuestionStatus.EXTRACTED
        elif confidence >= self.partial_threshold:
            return QuestionStatus.PARTIAL
        else:
            return QuestionStatus.REVIEW_REQUIRED

    def calculate_question_confidence(
        self,
        question: ExtractedQuestion,
        ocr_confidence: float = 1.0,
        answer_matched: bool = False,
        is_cross_page: bool = False,
    ) -> float:
        """Calculate overall confidence from multiple signals.

        Signals:
        - Base extraction confidence (from AI/heuristic)
        - OCR confidence (quality of source text)
        - Question structure (number, text length, options)
        - Answer matching
        - Cross-page merge penalty
        """
        signals = []

        # Base extraction confidence (weight: 0.3)
        signals.append(("extraction", question.confidence, 0.3))

        # OCR confidence (weight: 0.2)
        signals.append(("ocr", ocr_confidence, 0.2))

        # Structure confidence (weight: 0.25)
        structure_score = self._structure_score(question)
        signals.append(("structure", structure_score, 0.25))

        # Answer match bonus (weight: 0.15)
        answer_score = 1.0 if answer_matched else 0.5
        signals.append(("answer", answer_score, 0.15))

        # Completeness (weight: 0.1)
        complete_score = 1.0 if question.is_complete else 0.6
        signals.append(("completeness", complete_score, 0.1))

        # Weighted average
        total = sum(score * weight for _, score, weight in signals)
        total_weight = sum(weight for _, _, weight in signals)
        confidence = total / total_weight

        # Cross-page merge penalty
        if is_cross_page:
            confidence *= 0.95

        return round(min(max(confidence, 0.0), 1.0), 3)

    def _structure_score(self, question: ExtractedQuestion) -> float:
        """Score the structural quality of the extraction."""
        score = 0.3  # Base

        if question.question_number:
            score += 0.2
        if len(question.question_text) > 20:
            score += 0.2
        if question.options and len(question.options) >= 2:
            score += 0.2
        if question.question_type != "UNKNOWN":
            score += 0.1

        return min(score, 1.0)

    def needs_review(self, confidence: float) -> bool:
        """Determine if a question needs human review."""
        return confidence < self.extracted_threshold
