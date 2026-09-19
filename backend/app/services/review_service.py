"""Review service — creates review items for questionable extractions."""

from typing import Optional
from uuid import UUID
from app.utils.constants import ReviewIssueType
from app.core.logging import get_logger

logger = get_logger(__name__)


class ReviewService:
    """Generates review items for questionable extractions."""

    def create_review_items_for_question(
        self,
        document_id: UUID,
        question_id: UUID,
        confidence: float,
        question_number: Optional[str],
        validation_issues: list[str],
        is_cross_page: bool = False,
        answer_status: str = "NOT_AVAILABLE",
        source_pages: list[int] = None,
    ) -> list[dict]:
        """Generate review items based on extraction analysis.

        Returns list of review item dicts ready for database insertion.
        """
        items = []

        # Low confidence
        if confidence < 0.6:
            items.append({
                "document_id": document_id,
                "question_id": question_id,
                "issue_type": ReviewIssueType.LOW_CONFIDENCE,
                "reason": f"Extraction confidence is {confidence:.2f}, below threshold",
                "confidence": confidence,
                "source_page": source_pages[0] if source_pages else None,
            })

        # Missing question number
        if not question_number:
            items.append({
                "document_id": document_id,
                "question_id": question_id,
                "issue_type": ReviewIssueType.MISSING_QUESTION_NUMBER,
                "reason": "Question number could not be determined",
                "confidence": confidence,
                "source_page": source_pages[0] if source_pages else None,
            })

        # Cross-page merge
        if is_cross_page:
            items.append({
                "document_id": document_id,
                "question_id": question_id,
                "issue_type": ReviewIssueType.CROSS_PAGE_MERGE,
                "reason": f"Question spans pages {source_pages} — verify merge correctness",
                "confidence": confidence,
                "source_page": source_pages[0] if source_pages else None,
            })

        # Uncertain answer
        if answer_status == "UNCERTAIN":
            items.append({
                "document_id": document_id,
                "question_id": question_id,
                "issue_type": ReviewIssueType.UNCERTAIN_ANSWER,
                "reason": "Answer match is uncertain — verify manually",
                "confidence": confidence,
                "source_page": source_pages[0] if source_pages else None,
            })

        # Unmatched answer
        if answer_status == "UNMATCHED":
            items.append({
                "document_id": document_id,
                "question_id": question_id,
                "issue_type": ReviewIssueType.UNMATCHED_ANSWER,
                "reason": "No matching answer key entry found for this question",
                "confidence": confidence,
                "source_page": source_pages[0] if source_pages else None,
            })

        # Validation issues
        for issue in validation_issues:
            issue_type = self._classify_validation_issue(issue)
            items.append({
                "document_id": document_id,
                "question_id": question_id,
                "issue_type": issue_type,
                "reason": issue,
                "confidence": confidence,
                "source_page": source_pages[0] if source_pages else None,
            })

        if items:
            logger.info(
                "review_items_created",
                document_id=str(document_id),
                question_id=str(question_id),
                count=len(items),
            )

        return items

    def _classify_validation_issue(self, issue: str) -> str:
        """Map a validation issue description to a ReviewIssueType."""
        issue_lower = issue.lower()
        if "ocr" in issue_lower:
            return ReviewIssueType.OCR_ERROR
        if "option" in issue_lower:
            return ReviewIssueType.UNCERTAIN_OPTIONS
        if "short" in issue_lower or "empty" in issue_lower:
            return ReviewIssueType.INCOMPLETE_QUESTION
        return ReviewIssueType.LOW_CONFIDENCE
