"""AI service — abstract provider + heuristic fallback + OpenAI implementation.

The heuristic provider uses regex and structural analysis to extract questions
without requiring any paid API key. The OpenAI provider activates when
AI_PROVIDER=openai and AI_API_KEY is set.
"""

import re
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ExtractedOption:
    key: str
    text: str


@dataclass
class ExtractedQuestion:
    question_number: Optional[str] = None
    question_text: str = ""
    question_type: str = "UNKNOWN"
    options: list[ExtractedOption] = field(default_factory=list)
    confidence: float = 0.0
    source_pages: list[int] = field(default_factory=list)
    is_complete: bool = True


@dataclass
class ExtractedAnswerKey:
    question_number: str = ""
    answer: str = ""
    confidence: float = 1.0
    source_page: Optional[int] = None


class AIProvider(ABC):
    """Abstract AI provider interface."""

    @abstractmethod
    def extract_questions(self, text: str, page_number: int) -> list[ExtractedQuestion]:
        """Extract questions from page text."""
        ...

    @abstractmethod
    def extract_answer_key(self, text: str, page_number: int) -> list[ExtractedAnswerKey]:
        """Extract answer key entries from text."""
        ...

    @abstractmethod
    def analyze_page(self, text: str, page_number: int) -> dict:
        """Analyze a page for content type (questions, answer key, etc.)."""
        ...

    @abstractmethod
    def merge_question(self, partial_text: str, continuation_text: str) -> str:
        """Merge a question that spans two pages."""
        ...


class HeuristicAIProvider(AIProvider):
    """Regex and structural analysis based question extraction.
    Works without any external API — the default fallback provider.
    """

    # Patterns for detecting question starts
    QUESTION_PATTERNS = [
        # Q1. or Q.1 or Q 1. or Q1) or Q.1)
        r'(?:Q|Que|Question)\s*\.?\s*(\d+)\s*[.):]?\s*(.*)',
        # 1. text or 1) text or 1: text (at start of line)
        r'^(\d{1,3})\s*[.):\-]\s+(.*)',
        # (1) text
        r'^\((\d{1,3})\)\s*(.*)',
        # Roman numerals: i. ii. iii. etc.
        r'^([ivxlIVXL]+)\s*[.)]\s+(.*)',
    ]

    # Patterns for detecting options
    OPTION_PATTERNS = [
        # (a) text or (A) text
        r'^\s*\(([a-dA-D])\)\s*(.*)',
        # a) text or A) text
        r'^\s*([a-dA-D])\)\s*(.*)',
        # A. text or a. text
        r'^\s*([a-dA-D])\.\s*(.*)',
        # ① ② ③ ④ style (numbered circles)
        r'^\s*([①②③④])\s*(.*)',
    ]

    # Answer key patterns
    ANSWER_KEY_PATTERNS = [
        # 1-A or 1 - A
        r'(\d+)\s*[-–—]\s*([A-Da-d])',
        # 1. A or 1.A
        r'(\d+)\s*\.\s*([A-Da-d])\b',
        # Q1 -> A or Q1→A
        r'[Qq]?\s*(\d+)\s*(?:->|→|=>)\s*([A-Da-d])',
        # 1:A or 1 : A
        r'(\d+)\s*:\s*([A-Da-d])\b',
        # Just answer letter per line (detected as block)
        r'^([A-Da-d])$',
    ]

    def extract_questions(self, text: str, page_number: int) -> list[ExtractedQuestion]:
        """Extract questions using regex patterns and structural analysis."""
        if not text or len(text.strip()) < 10:
            return []

        lines = text.split("\n")
        questions = []
        current_question = None
        current_options = []
        collecting_options = False

        for line_idx, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                continue

            # Check if this line starts a new question
            q_match = self._match_question(stripped)
            if q_match:
                # Save previous question
                if current_question:
                    current_question.options = current_options
                    current_question.question_type = self._detect_type(current_question)
                    current_question.confidence = self._score_confidence(current_question)
                    questions.append(current_question)

                q_num, q_text = q_match
                current_question = ExtractedQuestion(
                    question_number=q_num,
                    question_text=q_text,
                    source_pages=[page_number],
                )
                current_options = []
                collecting_options = False
                continue

            # Check if this line is an option
            opt_match = self._match_option(stripped)
            if opt_match and current_question:
                key, text_val = opt_match
                current_options.append(ExtractedOption(key=key.upper(), text=text_val))
                collecting_options = True
                continue

            # If we have a current question and this is continuation text
            if current_question and not collecting_options:
                current_question.question_text += " " + stripped

        # Save last question
        if current_question:
            current_question.options = current_options
            current_question.question_type = self._detect_type(current_question)
            current_question.confidence = self._score_confidence(current_question)
            questions.append(current_question)

        logger.info(
            "heuristic_extraction",
            page=page_number,
            questions_found=len(questions),
        )
        return questions

    def extract_answer_key(self, text: str, page_number: int) -> list[ExtractedAnswerKey]:
        """Extract answer key entries from text."""
        if not text:
            return []

        answers = []
        lines = text.split("\n")

        # Try structured patterns first
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            for pattern in self.ANSWER_KEY_PATTERNS[:-1]:  # Skip single-letter pattern
                match = re.match(pattern, stripped)
                if match:
                    groups = match.groups()
                    if len(groups) >= 2:
                        answers.append(ExtractedAnswerKey(
                            question_number=groups[0],
                            answer=groups[1].upper(),
                            source_page=page_number,
                        ))
                    break

        # If we found structured answers, check for block of single letters
        if not answers:
            letter_lines = []
            for line in lines:
                stripped = line.strip()
                if re.match(r'^[A-Da-d]$', stripped):
                    letter_lines.append(stripped.upper())
                elif letter_lines and stripped:
                    break  # Stop if we hit non-letter content

            if len(letter_lines) >= 3:  # At least 3 sequential answers
                for i, letter in enumerate(letter_lines, 1):
                    answers.append(ExtractedAnswerKey(
                        question_number=str(i),
                        answer=letter,
                        source_page=page_number,
                        confidence=0.7,  # Lower confidence for positional matching
                    ))

        if answers:
            logger.info("answer_key_detected", page=page_number, count=len(answers))
        return answers

    def analyze_page(self, text: str, page_number: int) -> dict:
        """Analyze page content type."""
        if not text:
            return {"type": "empty", "page": page_number}

        answer_keys = self.extract_answer_key(text, page_number)
        if len(answer_keys) >= 3:
            return {"type": "answer_key", "page": page_number, "count": len(answer_keys)}

        questions = self.extract_questions(text, page_number)
        if questions:
            return {"type": "questions", "page": page_number, "count": len(questions)}

        return {"type": "text", "page": page_number}

    def merge_question(self, partial_text: str, continuation_text: str) -> str:
        """Merge text from two pages for a split question."""
        partial = partial_text.rstrip()
        continuation = continuation_text.lstrip()

        # Check if partial ends mid-sentence
        if partial and partial[-1] not in ".?!":
            return partial + " " + continuation
        return partial + "\n" + continuation

    def _match_question(self, line: str) -> Optional[tuple[str, str]]:
        """Try to match a question pattern. Returns (number, text) or None."""
        for pattern in self.QUESTION_PATTERNS:
            match = re.match(pattern, line, re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) >= 2:
                    return (groups[0].strip(), groups[1].strip())
        return None

    def _match_option(self, line: str) -> Optional[tuple[str, str]]:
        """Try to match an option pattern. Returns (key, text) or None."""
        for pattern in self.OPTION_PATTERNS:
            match = re.match(pattern, line)
            if match:
                return (match.group(1), match.group(2).strip())
        return None

    def _detect_type(self, q: ExtractedQuestion) -> str:
        """Detect question type based on content analysis."""
        text_lower = q.question_text.lower()

        # MCQ: has options
        if len(q.options) >= 2:
            return "MCQ"

        # True/False
        tf_keywords = ["true or false", "true/false", "t/f", "state true or false",
                        "mark true or false"]
        if any(kw in text_lower for kw in tf_keywords):
            return "TRUE_FALSE"

        if len(q.options) == 2:
            opts = {o.text.lower().strip() for o in q.options}
            if opts == {"true", "false"} or opts == {"t", "f"}:
                return "TRUE_FALSE"

        # Short answer indicators
        short_keywords = ["fill in", "write the", "name the", "define",
                          "what is", "explain", "describe", "state the"]
        if any(kw in text_lower for kw in short_keywords) and not q.options:
            return "SHORT_ANSWER"

        return "UNKNOWN"

    def _score_confidence(self, q: ExtractedQuestion) -> float:
        """Score extraction confidence based on multiple signals."""
        score = 0.5  # Base

        # Has question number
        if q.question_number:
            score += 0.15

        # Has meaningful text
        if len(q.question_text) > 20:
            score += 0.1

        # Has options (for MCQ)
        if q.options:
            score += 0.1
            if len(q.options) == 4:
                score += 0.05
            # Sequential option keys (A,B,C,D)
            keys = [o.key.upper() for o in q.options]
            expected = [chr(65 + i) for i in range(len(keys))]
            if keys == expected:
                score += 0.05

        # Known question type
        if q.question_type != "UNKNOWN":
            score += 0.05

        return min(round(score, 3), 1.0)


class OpenAIProvider(AIProvider):
    """OpenAI vision/chat model based extraction.
    Activated when AI_PROVIDER=openai and AI_API_KEY is set.
    """

    def __init__(self):
        import openai
        base_url = settings.AI_BASE_URL
        headers = {}
        if (settings.AI_PROVIDER or "").lower() == "openrouter" or (base_url and "openrouter" in base_url):
            if not base_url:
                base_url = "https://openrouter.ai/api/v1"
            referer = (
                settings.APP_URL
                or settings.FRONTEND_URL
                or (settings.cors_origins_list[0] if settings.cors_origins_list and settings.cors_origins_list[0] != "*" else "https://docintel.io")
            )
            headers = {"HTTP-Referer": referer, "X-Title": "DocIntel"}

        self.client = openai.OpenAI(
            api_key=settings.AI_API_KEY,
            base_url=base_url or None,
            default_headers=headers or None,
        )
        self.model = settings.AI_MODEL or "gpt-4o-mini"


    def extract_questions(self, text: str, page_number: int) -> list[ExtractedQuestion]:
        """Use OpenAI to extract questions from text."""
        prompt = f"""Extract all questions from this exam page text. Return a JSON array where each item has:
- question_number: string or null
- question_text: string
- question_type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "UNKNOWN"
- options: array of {{"key": "A", "text": "..."}} or empty array
- is_complete: boolean (false if question text seems cut off / continues on next page)

Text from page {page_number}:
---
{text}
---

Return ONLY valid JSON array. Do not invent content not present in the text."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            data = json.loads(content)

            questions_data = data if isinstance(data, list) else data.get("questions", [])
            questions = []
            for q in questions_data:
                options = [
                    ExtractedOption(key=o.get("key", ""), text=o.get("text", ""))
                    for o in q.get("options", [])
                ]
                questions.append(ExtractedQuestion(
                    question_number=q.get("question_number"),
                    question_text=q.get("question_text", ""),
                    question_type=q.get("question_type", "UNKNOWN"),
                    options=options,
                    confidence=0.9,
                    source_pages=[page_number],
                    is_complete=q.get("is_complete", True),
                ))
            return questions
        except Exception as e:
            logger.error("openai_extraction_failed", error=str(e))
            # Fall back to heuristic
            fallback = HeuristicAIProvider()
            return fallback.extract_questions(text, page_number)

    def extract_answer_key(self, text: str, page_number: int) -> list[ExtractedAnswerKey]:
        prompt = f"""Extract answer key entries from this text. Return a JSON array where each item has:
- question_number: string
- answer: string (the answer letter/value)

Text:
---
{text}
---

Return ONLY valid JSON array. If no answer key is found, return empty array."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            items = data if isinstance(data, list) else data.get("answers", [])
            return [
                ExtractedAnswerKey(
                    question_number=str(a.get("question_number", "")),
                    answer=str(a.get("answer", "")).upper(),
                    source_page=page_number,
                    confidence=0.95,
                )
                for a in items
            ]
        except Exception as e:
            logger.error("openai_answer_key_failed", error=str(e))
            fallback = HeuristicAIProvider()
            return fallback.extract_answer_key(text, page_number)

    def analyze_page(self, text: str, page_number: int) -> dict:
        fallback = HeuristicAIProvider()
        return fallback.analyze_page(text, page_number)

    def merge_question(self, partial_text: str, continuation_text: str) -> str:
        fallback = HeuristicAIProvider()
        return fallback.merge_question(partial_text, continuation_text)


def get_ai_provider() -> AIProvider:
    """Factory to get the configured AI provider."""
    provider = (settings.AI_PROVIDER or "").lower().strip()

    if provider in ("openai", "openrouter") and settings.AI_API_KEY:
        try:
            return OpenAIProvider()
        except Exception as e:
            logger.warning("ai_provider_init_failed", error=str(e))


    # Default: heuristic fallback (no API key needed)
    return HeuristicAIProvider()
