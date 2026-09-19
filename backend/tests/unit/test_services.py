"""Unit tests for core services and utilities."""

import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.utils.file_validation import (
    validate_file_extension, validate_mime_type, validate_file_size,
    validate_file_content, validate_upload,
)
from app.utils.constants import FileType
from app.utils.exceptions import (
    UnsupportedFileTypeError, FileTooLargeError, EmptyFileError, MalformedFileError,
)
from app.utils.helpers import safe_filename, generate_uuid
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.services.ai_service import HeuristicAIProvider, ExtractedQuestion
from app.services.question_merger import QuestionMerger
from app.services.answer_matcher import AnswerMatcher
from app.services.confidence_service import ConfidenceService
from app.services.validation_service import ValidationService
from app.services.review_service import ReviewService

from tests.conftest import make_sample_pdf_content, make_sample_jpg_content, make_sample_png_content


# ============================================================
# File Validation Tests
# ============================================================

class TestFileValidation:
    def test_valid_pdf_extension(self):
        assert validate_file_extension("test.pdf") == "pdf"

    def test_valid_jpg_extension(self):
        assert validate_file_extension("photo.jpg") == "jpg"

    def test_valid_jpeg_extension(self):
        assert validate_file_extension("photo.jpeg") == "jpeg"

    def test_valid_png_extension(self):
        assert validate_file_extension("image.png") == "png"

    def test_unsupported_extension(self):
        with pytest.raises(UnsupportedFileTypeError):
            validate_file_extension("doc.docx")

    def test_no_extension(self):
        with pytest.raises(UnsupportedFileTypeError):
            validate_file_extension("noextension")

    def test_valid_pdf_mime(self):
        validate_mime_type("application/pdf")  # should not raise

    def test_invalid_mime(self):
        with pytest.raises(UnsupportedFileTypeError):
            validate_mime_type("application/zip")

    def test_none_mime_passes(self):
        validate_mime_type(None)  # should not raise

    def test_empty_file(self):
        with pytest.raises(EmptyFileError):
            validate_file_size(0)

    @patch("app.utils.file_validation.settings")
    def test_file_too_large(self, mock_settings):
        mock_settings.max_file_size_bytes = 1024
        mock_settings.MAX_FILE_SIZE_MB = 1
        with pytest.raises(FileTooLargeError):
            validate_file_size(2048)

    def test_validate_pdf_content(self):
        result = validate_file_content(make_sample_pdf_content())
        assert result == FileType.PDF

    def test_validate_jpg_content(self):
        result = validate_file_content(make_sample_jpg_content())
        assert result == FileType.JPG

    def test_validate_png_content(self):
        result = validate_file_content(make_sample_png_content())
        assert result == FileType.PNG

    def test_validate_empty_content(self):
        with pytest.raises(EmptyFileError):
            validate_file_content(b"")

    def test_validate_malformed_content(self):
        with pytest.raises(MalformedFileError):
            validate_file_content(b"not a valid file header at all")


# ============================================================
# Security Tests
# ============================================================

class TestSecurity:
    def test_password_hashing(self):
        password = "test_password_123"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed)

    def test_wrong_password(self):
        hashed = hash_password("correct_password")
        assert not verify_password("wrong_password", hashed)

    def test_jwt_creation_and_decode(self):
        user_id = str(uuid4())
        token = create_access_token(user_id)
        payload = decode_access_token(token)
        assert payload["sub"] == user_id
        assert payload["type"] == "access"

    def test_invalid_jwt(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            decode_access_token("invalid.token.here")


# ============================================================
# Helpers Tests
# ============================================================

class TestHelpers:
    def test_generate_uuid(self):
        uid = generate_uuid()
        assert len(uid) == 36  # UUID format

    def test_safe_filename(self):
        result = safe_filename("my document (1).pdf")
        assert result.endswith(".pdf")
        assert " " not in result
        assert "(" not in result

    def test_safe_filename_no_extension(self):
        result = safe_filename("noext")
        assert "." not in result


# ============================================================
# Heuristic AI Provider Tests
# ============================================================

class TestHeuristicAIProvider:
    def setup_method(self):
        self.provider = HeuristicAIProvider()

    def test_extract_mcq_questions(self):
        text = """1. What is the capital of France?
(a) London
(b) Berlin
(c) Paris
(d) Madrid

2. Which planet is closest to the sun?
(a) Venus
(b) Mercury
(c) Earth
(d) Mars"""

        questions = self.provider.extract_questions(text, 1)
        assert len(questions) == 2
        assert questions[0].question_number == "1"
        assert questions[0].question_type == "MCQ"
        assert len(questions[0].options) == 4
        assert questions[1].question_number == "2"

    def test_extract_true_false(self):
        text = """1. True or False: The earth is flat.
2. State true or false: Water boils at 100°C at sea level."""

        questions = self.provider.extract_questions(text, 1)
        assert len(questions) >= 1
        # At least one should be detected as TRUE_FALSE
        tf_questions = [q for q in questions if q.question_type == "TRUE_FALSE"]
        assert len(tf_questions) >= 1

    def test_extract_numbered_questions(self):
        text = """Q1. Explain the concept of polymorphism.
Q2. What is inheritance in OOP?
Q.3 Define abstraction."""

        questions = self.provider.extract_questions(text, 1)
        assert len(questions) == 3
        assert questions[0].question_number == "1"
        assert questions[2].question_number == "3"

    def test_extract_answer_key(self):
        text = """Answer Key:
1-A
2-C
3-B
4-D
5-A"""

        answers = self.provider.extract_answer_key(text, 10)
        assert len(answers) == 5
        assert answers[0].question_number == "1"
        assert answers[0].answer == "A"
        assert answers[2].answer == "B"

    def test_extract_answer_key_arrow_format(self):
        text = """Q1 -> A
Q2 -> C
Q3 -> B"""

        answers = self.provider.extract_answer_key(text, 5)
        assert len(answers) == 3

    def test_empty_text(self):
        questions = self.provider.extract_questions("", 1)
        assert questions == []

    def test_no_questions_in_text(self):
        text = "This is just a paragraph with no questions at all."
        questions = self.provider.extract_questions(text, 1)
        assert len(questions) == 0


# ============================================================
# Question Merger Tests
# ============================================================

class TestQuestionMerger:
    def setup_method(self):
        self.merger = QuestionMerger()

    def test_merge_cross_page_question(self):
        q1 = ExtractedQuestion(
            question_number="17",
            question_text="Which of the following statements is",
            source_pages=[3],
            is_complete=False,
        )
        q2 = ExtractedQuestion(
            question_text="correct regarding operating systems?",
            source_pages=[4],
            question_type="MCQ",
            options=[],
            is_complete=True,
        )

        merged = self.merger.merge_cross_page_questions([q1, q2])
        assert len(merged) == 1
        assert "statements is" in merged[0].question_text
        assert "correct regarding" in merged[0].question_text
        assert merged[0].source_pages == [3, 4]
        assert merged[0].question_number == "17"

    def test_no_merge_separate_questions(self):
        q1 = ExtractedQuestion(
            question_number="1",
            question_text="What is 2+2?",
            source_pages=[1],
            is_complete=True,
        )
        q2 = ExtractedQuestion(
            question_number="2",
            question_text="What is 3+3?",
            source_pages=[1],
            is_complete=True,
        )

        merged = self.merger.merge_cross_page_questions([q1, q2])
        assert len(merged) == 2

    def test_single_question(self):
        q1 = ExtractedQuestion(question_text="What is 2+2?", source_pages=[1])
        merged = self.merger.merge_cross_page_questions([q1])
        assert len(merged) == 1


# ============================================================
# Answer Matcher Tests
# ============================================================

class TestAnswerMatcher:
    def setup_method(self):
        self.matcher = AnswerMatcher()

    def test_match_answers(self):
        from app.services.ai_service import ExtractedQuestion, ExtractedAnswerKey

        questions = [
            ExtractedQuestion(question_number="1", question_text="Q1", source_pages=[1]),
            ExtractedQuestion(question_number="2", question_text="Q2", source_pages=[1]),
            ExtractedQuestion(question_number="3", question_text="Q3", source_pages=[1]),
        ]
        answer_keys = [
            ExtractedAnswerKey(question_number="1", answer="A"),
            ExtractedAnswerKey(question_number="2", answer="C"),
            ExtractedAnswerKey(question_number="3", answer="B"),
        ]

        matches = self.matcher.match_answers(questions, answer_keys)
        assert len(matches) == 3
        assert matches[0]["answer"] == "A"
        assert matches[0]["status"] == "MATCHED"

    def test_unmatched_answer(self):
        from app.services.ai_service import ExtractedQuestion, ExtractedAnswerKey

        questions = [
            ExtractedQuestion(question_number="1", question_text="Q1", source_pages=[1]),
        ]
        answer_keys = [
            ExtractedAnswerKey(question_number="5", answer="A"),
        ]

        matches = self.matcher.match_answers(questions, answer_keys)
        matched = [m for m in matches if m["status"] == "MATCHED"]
        assert len(matched) == 0

    def test_empty_answer_keys(self):
        from app.services.ai_service import ExtractedQuestion

        questions = [
            ExtractedQuestion(question_number="1", question_text="Q1", source_pages=[1]),
        ]

        matches = self.matcher.match_answers(questions, [])
        assert len(matches) == 0


# ============================================================
# Confidence Service Tests
# ============================================================

class TestConfidenceService:
    def setup_method(self):
        self.service = ConfidenceService()

    def test_classify_high_confidence(self):
        assert self.service.classify_confidence(0.9) == "EXTRACTED"

    def test_classify_medium_confidence(self):
        assert self.service.classify_confidence(0.7) == "PARTIAL"

    def test_classify_low_confidence(self):
        assert self.service.classify_confidence(0.4) == "REVIEW_REQUIRED"

    def test_needs_review(self):
        assert self.service.needs_review(0.5) is True
        assert self.service.needs_review(0.9) is False


# ============================================================
# Validation Service Tests
# ============================================================

class TestValidationService:
    def setup_method(self):
        self.service = ValidationService()

    def test_valid_question(self):
        q = ExtractedQuestion(
            question_number="1",
            question_text="What is the capital of France?",
            question_type="MCQ",
        )
        issues = self.service.validate_question(q)
        assert len(issues) == 0

    def test_missing_number(self):
        q = ExtractedQuestion(
            question_text="What is the capital of France?",
        )
        issues = self.service.validate_question(q)
        assert any("number" in i.lower() for i in issues)

    def test_short_text(self):
        q = ExtractedQuestion(question_number="1", question_text="Hi")
        issues = self.service.validate_question(q)
        assert any("short" in i.lower() for i in issues)


# ============================================================
# Review Service Tests
# ============================================================

class TestReviewService:
    def setup_method(self):
        self.service = ReviewService()

    def test_low_confidence_review(self):
        items = self.service.create_review_items_for_question(
            document_id=uuid4(),
            question_id=uuid4(),
            confidence=0.3,
            question_number="1",
            validation_issues=[],
            source_pages=[1],
        )
        assert any(i["issue_type"] == "LOW_CONFIDENCE" for i in items)

    def test_missing_number_review(self):
        items = self.service.create_review_items_for_question(
            document_id=uuid4(),
            question_id=uuid4(),
            confidence=0.9,
            question_number=None,
            validation_issues=[],
            source_pages=[1],
        )
        assert any(i["issue_type"] == "MISSING_QUESTION_NUMBER" for i in items)

    def test_cross_page_review(self):
        items = self.service.create_review_items_for_question(
            document_id=uuid4(),
            question_id=uuid4(),
            confidence=0.8,
            question_number="5",
            validation_issues=[],
            is_cross_page=True,
            source_pages=[3, 4],
        )
        assert any(i["issue_type"] == "CROSS_PAGE_MERGE" for i in items)
