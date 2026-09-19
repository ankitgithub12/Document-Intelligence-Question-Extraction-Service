"""Question merger — handles cross-page question detection and merging."""

from app.services.ai_service import ExtractedQuestion, AIProvider, get_ai_provider
from app.core.logging import get_logger

logger = get_logger(__name__)


class QuestionMerger:
    """Detects and merges questions that span multiple pages."""

    def __init__(self, ai_provider: AIProvider = None):
        self.ai = ai_provider or get_ai_provider()

    def merge_cross_page_questions(
        self, questions: list[ExtractedQuestion]
    ) -> list[ExtractedQuestion]:
        """Detect and merge questions that span page boundaries.

        Signals for cross-page continuation:
        1. Question is marked as incomplete by AI
        2. Question text ends mid-sentence (no terminal punctuation, no options)
        3. Next item has no question number and no question start pattern
        """
        if len(questions) <= 1:
            return questions

        merged = []
        i = 0

        while i < len(questions):
            current = questions[i]

            # Look ahead to check if next item should be merged
            if i + 1 < len(questions):
                next_q = questions[i + 1]

                should_merge = self._should_merge(current, next_q)

                if should_merge:
                    # Merge questions
                    merged_text = self.ai.merge_question(
                        current.question_text, next_q.question_text
                    )
                    merged_q = ExtractedQuestion(
                        question_number=current.question_number or next_q.question_number,
                        question_text=merged_text,
                        question_type=current.question_type if current.question_type != "UNKNOWN" else next_q.question_type,
                        options=current.options if current.options else next_q.options,
                        confidence=min(current.confidence, next_q.confidence) * 0.95,
                        source_pages=sorted(set(current.source_pages + next_q.source_pages)),
                        is_complete=next_q.is_complete,
                    )

                    # Could be a 3+ page question — keep checking
                    merged.append(merged_q)
                    i += 2

                    logger.info(
                        "cross_page_merge",
                        question_number=merged_q.question_number,
                        pages=merged_q.source_pages,
                    )
                    continue

            merged.append(current)
            i += 1

        return merged

    def _should_merge(self, current: ExtractedQuestion, next_q: ExtractedQuestion) -> bool:
        """Determine if two sequential questions should be merged."""
        # If current is explicitly marked incomplete
        if not current.is_complete:
            return True

        # If current has no options and text ends mid-sentence
        if not current.options and self._ends_mid_sentence(current.question_text):
            # And next has no question number (it's continuation, not a new question)
            if not next_q.question_number:
                return True

        # If pages are sequential and next has no question number
        if current.source_pages and next_q.source_pages:
            current_last = max(current.source_pages)
            next_first = min(next_q.source_pages)
            if next_first == current_last + 1 and not next_q.question_number:
                if self._ends_mid_sentence(current.question_text):
                    return True

        return False

    def _ends_mid_sentence(self, text: str) -> bool:
        """Check if text appears to end mid-sentence."""
        text = text.rstrip()
        if not text:
            return False

        # Ends with terminal punctuation
        if text[-1] in ".?!:":
            return False

        # Ends with a common sentence-ending word pattern
        last_word = text.split()[-1].lower() if text.split() else ""
        continuation_words = {"is", "are", "the", "a", "an", "of", "in", "to", "and",
                              "or", "that", "which", "following", "given", "below"}
        if last_word in continuation_words:
            return True

        # Short text without options likely continues
        if len(text) < 50:
            return True

        return False
