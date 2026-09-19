"""Answer key service — detects answer key sections in documents."""

from app.services.ai_service import AIProvider, ExtractedAnswerKey, get_ai_provider
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnswerKeyService:
    """Detects and extracts answer key sections from document pages."""

    def __init__(self, ai_provider: AIProvider = None):
        self.ai = ai_provider or get_ai_provider()

    def detect_answer_keys(self, pages: list[dict]) -> list[ExtractedAnswerKey]:
        """Scan all pages for answer key sections.

        Checks end pages first (answer keys are often at the end),
        then scans from the beginning.
        """
        all_answers = []
        checked_pages = set()

        # Check pages in reverse order (answer keys often at end)
        for page in reversed(pages):
            page_num = page["page_number"]
            text = page.get("text", "")
            if not text:
                continue

            # Check if this page contains answer key content
            analysis = self.ai.analyze_page(text, page_num)
            if analysis.get("type") == "answer_key":
                answers = self.ai.extract_answer_key(text, page_num)
                all_answers.extend(answers)
                checked_pages.add(page_num)
                logger.info("answer_key_page_found", page=page_num, count=len(answers))

        # Also check beginning pages not yet checked
        for page in pages[:3]:
            page_num = page["page_number"]
            if page_num in checked_pages:
                continue
            text = page.get("text", "")
            if not text:
                continue

            analysis = self.ai.analyze_page(text, page_num)
            if analysis.get("type") == "answer_key":
                answers = self.ai.extract_answer_key(text, page_num)
                all_answers.extend(answers)

        logger.info("answer_key_detection_complete", total=len(all_answers))
        return all_answers

    def extract_from_text(self, text: str, page_number: int) -> list[ExtractedAnswerKey]:
        """Extract answer key from specific text."""
        return self.ai.extract_answer_key(text, page_number)
