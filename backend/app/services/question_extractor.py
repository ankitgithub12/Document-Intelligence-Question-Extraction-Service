"""Question extractor — orchestrates extraction from processed page text."""

from app.services.ai_service import AIProvider, ExtractedQuestion, get_ai_provider
from app.core.logging import get_logger

logger = get_logger(__name__)


class QuestionExtractor:
    """Orchestrates question extraction from page-level text using an AI provider."""

    def __init__(self, ai_provider: AIProvider = None):
        self.ai = ai_provider or get_ai_provider()

    def extract_from_pages(self, pages: list[dict]) -> list[ExtractedQuestion]:
        """Extract questions from all pages.

        Args:
            pages: list of {"page_number": int, "text": str}

        Returns:
            list of ExtractedQuestion with source page information
        """
        all_questions = []

        for page in pages:
            page_num = page["page_number"]
            text = page.get("text", "")

            if not text or len(text.strip()) < 10:
                continue

            questions = self.ai.extract_questions(text, page_num)
            all_questions.extend(questions)

        logger.info("extraction_complete", total_questions=len(all_questions))
        return all_questions

    def extract_from_single_page(self, text: str, page_number: int) -> list[ExtractedQuestion]:
        """Extract questions from a single page of text."""
        if not text or len(text.strip()) < 10:
            return []
        return self.ai.extract_questions(text, page_number)
