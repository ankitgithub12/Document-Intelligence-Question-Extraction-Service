"""Question extractor — orchestrates extraction across document pages with multi-page continuity."""

import re
from typing import Optional
from app.services.ai_service import AIProvider, ExtractedQuestion, ExtractedOption, get_ai_provider
from app.core.logging import get_logger

logger = get_logger(__name__)


class QuestionExtractor:
    """Orchestrates question extraction across document pages with multi-page continuity."""

    QUESTION_PATTERNS = [
        r'^(?:Q|Que|Question)\s*\.?\s*(\d+)\s*[.):]?\s*(.*)',
        r'^(\d{1,3})\s*[.):\-]\s*(.*)',
        r'^\((\d{1,3})\)\s+(.*)',
        r'^([ivxlIVXL]+)\s*[.)]\s+(.*)',
    ]

    OPTION_PATTERNS = [
        r'^\s*\(([a-dA-D])\)\s*(.*)',
        r'^\s*([a-dA-D])\)\s*(.*)',
        r'^\s*([a-dA-D])\.\s*(.*)',
        r'^\s*([①②③④])\s*(.*)',
        r'^\s*\(([1-5])\)\s*(.*)',
    ]

    SAMPLE_ANSWER_PATTERNS = [
        r'^(?:Possible\s+Answer|Sample\s+Answer|Ideal\s+Answer|Answer|Ans)\s*(\d*)\s*[:.\-]?\s*(.*)',
        r'^(?:Model\s+Answer|Solution)\s*(\d*)\s*[:.\-]?\s*(.*)',
    ]

    QUESTION_STARTERS = (
        'what', 'why', 'how', 'who', 'where', 'when', 'which', 'do', 'would', 'could',
        'should', 'is', 'are', 'can', 'will', 'tell', 'explain', 'describe', 'define',
        'assume', 'suppose', 'justify', 'elaborate', 'give', 'state', 'name', 'discuss'
    )

    def __init__(self, ai_provider: AIProvider = None):
        self.ai = ai_provider or get_ai_provider()

    def extract_from_pages(self, pages: list[dict]) -> list[ExtractedQuestion]:
        """Extract questions across all document pages maintaining cross-page flow."""
        if not pages:
            return []

        questions = self._extract_multi_page_document(pages)
        logger.info("extraction_complete", total_questions=len(questions))
        return questions

    def _extract_multi_page_document(self, pages: list[dict]) -> list[ExtractedQuestion]:
        questions = []
        curr_q = None
        state = "NONE"  # "QUESTION", "OPTIONS", "SAMPLE_ANSWER", "GUIDANCE"
        sample_count = 0

        for page in pages:
            page_num = page["page_number"]
            text = page.get("text", "")
            if not text:
                continue

            for line in text.split("\n"):
                stripped = line.strip()
                if not stripped:
                    continue

                # 1. Check if line starts an option if inside an active question
                opt_match = None
                if curr_q:
                    opt_match = self._match_option(stripped, curr_q)

                if opt_match:
                    key, val = opt_match
                    curr_q.options.append(ExtractedOption(key=key, text=val))
                    curr_q.question_type = "MCQ"
                    state = "OPTIONS"
                    continue

                # 2. Check for sample answer (Possible Answer 1...)
                ans_match = self._match_sample_answer(stripped)
                if ans_match and curr_q:
                    sample_count += 1
                    ans_label = ans_match[0] or str(sample_count)
                    ans_text = ans_match[1].strip()
                    key = chr(64 + sample_count) if sample_count <= 26 else str(sample_count)

                    curr_q.options.append(
                        ExtractedOption(key=key, text=f"[Sample {ans_label}] {ans_text}".strip())
                    )
                    if not curr_q.answer:
                        curr_q.answer = f"Possible Answer {ans_label}"
                    curr_q.question_type = "SUBJECTIVE"
                    state = "SAMPLE_ANSWER"
                    continue

                # 3. Check if line starts a new question
                q_match = self._match_question(stripped, curr_q)
                if q_match:
                    q_num, q_text = q_match
                    if curr_q:
                        self._finalize_question(curr_q)
                        questions.append(curr_q)

                    ends_with_or = (
                        q_text.rstrip().endswith('(or)')
                        or q_text.rstrip().endswith('(or')
                        or q_text.rstrip().endswith('or')
                    )
                    is_complete = ('?' in q_text) and not ends_with_or

                    curr_q = ExtractedQuestion(
                        question_number=q_num,
                        question_text=q_text,
                        source_pages=[page_num],
                        is_complete=is_complete,
                    )
                    state = "QUESTION" if not is_complete else "BODY"
                    sample_count = 0
                    continue

                if not curr_q:
                    continue

                # Record source page
                if page_num not in curr_q.source_pages:
                    curr_q.source_pages.append(page_num)

                # 4. Continuation logic
                if state == "QUESTION":
                    if (
                        stripped.startswith('(')
                        or stripped.lower().startswith('or ')
                        or stripped.lower().startswith('(or')
                        or '?' in stripped
                        or not curr_q.is_complete
                    ):
                        curr_q.question_text += " " + stripped
                        if '?' in stripped:
                            curr_q.is_complete = True
                            state = "BODY"
                    else:
                        state = "GUIDANCE"
                elif state == "SAMPLE_ANSWER":
                    if curr_q.options:
                        curr_q.options[-1].text += (" " if curr_q.options[-1].text else "") + stripped
                elif state == "OPTIONS":
                    if curr_q.options:
                        curr_q.options[-1].text += " " + stripped
                else:  # GUIDANCE / BODY
                    pass

        if curr_q:
            self._finalize_question(curr_q)
            questions.append(curr_q)

        return questions

    def _match_question(self, line: str, curr_q: Optional[ExtractedQuestion]) -> Optional[tuple[str, str]]:
        if "interview questions" in line.lower() and not re.match(r'^\d', line):
            return None

        for pat in self.QUESTION_PATTERNS:
            m = re.match(pat, line, re.IGNORECASE)
            if m:
                groups = m.groups()
                if len(groups) >= 2:
                    q_num = groups[0].strip()
                    q_text = groups[1].strip()

                    # Disambiguation: if inside active question, (1)-(5) is an option, not a regression to Q1
                    if curr_q and q_num.isdigit() and int(q_num) <= 5 and curr_q.question_number and curr_q.question_number.isdigit() and int(curr_q.question_number) >= int(q_num):
                        return None

                    return q_num, q_text
        return None

    def _match_option(self, line: str, curr_q: ExtractedQuestion) -> Optional[tuple[str, str]]:
        if line.endswith('?'):
            return None

        for pat in self.OPTION_PATTERNS:
            m = re.match(pat, line)
            if m and m.lastindex and m.lastindex >= 2:
                raw_key = m.group(1)
                key = chr(64 + int(raw_key)) if raw_key.isdigit() and int(raw_key) <= 26 else raw_key.upper()
                text = m.group(2).strip()
                return key, text
        return None

    def _match_sample_answer(self, line: str) -> Optional[tuple[str, str]]:
        for pat in self.SAMPLE_ANSWER_PATTERNS:
            m = re.match(pat, line, re.IGNORECASE)
            if m:
                count = m.lastindex or 0
                if count >= 2:
                    return m.group(1).strip(), m.group(2).strip()
                elif count == 1:
                    return "", m.group(1).strip()
        return None

    def _finalize_question(self, q: ExtractedQuestion):
        if not q.question_type or q.question_type == "UNKNOWN":
            q.question_type = "MCQ" if q.options and not any("Sample" in opt.text for opt in q.options) else "SUBJECTIVE"

        score = 0.7
        if q.question_number:
            score += 0.1
        if len(q.question_text) > 10:
            score += 0.1
        if q.options:
            score += 0.05
        if q.answer:
            score += 0.05
        q.confidence = min(round(score, 3), 1.0)

    def extract_from_single_page(self, text: str, page_number: int) -> list[ExtractedQuestion]:
        """Extract questions from a single page of text."""
        return self.extract_from_pages([{"page_number": page_number, "text": text}])
