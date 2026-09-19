"""Answer matcher — associates extracted answers with questions."""

from typing import Optional
from app.services.ai_service import ExtractedQuestion, ExtractedAnswerKey
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnswerMatcher:
    """Matches answer key entries to extracted questions."""

    def match_answers(
        self,
        questions: list[ExtractedQuestion],
        answer_keys: list[ExtractedAnswerKey],
    ) -> list[dict]:
        """Match answer keys to questions by normalized question number.

        Returns list of match results: {question_index, answer, confidence, status}
        """
        if not answer_keys:
            return []

        # Build answer lookup by normalized question number
        answer_map: dict[str, ExtractedAnswerKey] = {}
        for ak in answer_keys:
            normalized = self._normalize_number(ak.question_number)
            if normalized:
                answer_map[normalized] = ak

        matches = []
        for idx, question in enumerate(questions):
            q_num = self._normalize_number(question.question_number)

            if q_num and q_num in answer_map:
                ak = answer_map[q_num]
                matches.append({
                    "question_index": idx,
                    "answer": ak.answer,
                    "confidence": ak.confidence,
                    "status": "MATCHED",
                    "source_page": ak.source_page,
                })
                logger.info(
                    "answer_matched",
                    question=q_num,
                    answer=ak.answer,
                )
            elif q_num:
                matches.append({
                    "question_index": idx,
                    "answer": None,
                    "confidence": 0.0,
                    "status": "UNMATCHED",
                    "source_page": None,
                })

        # Check for unmatched answer keys
        matched_numbers = {
            self._normalize_number(questions[m["question_index"]].question_number)
            for m in matches if m["status"] == "MATCHED"
        }
        for ak_num, ak in answer_map.items():
            if ak_num not in matched_numbers:
                logger.warning(
                    "unmatched_answer_key",
                    question_number=ak_num,
                    answer=ak.answer,
                )

        return matches

    def _normalize_number(self, number: Optional[str]) -> Optional[str]:
        """Normalize question number for matching (strip leading zeros, etc.)."""
        if not number:
            return None
        # Strip non-digit characters and leading zeros
        digits = "".join(c for c in str(number) if c.isdigit())
        return digits.lstrip("0") or digits if digits else None
