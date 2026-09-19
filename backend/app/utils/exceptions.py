"""Custom application exceptions with structured error codes."""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""
    def __init__(self, status_code: int, code: str, message: str):
        self.code = code
        super().__init__(
            status_code=status_code,
            detail={"success": False, "error": {"code": code, "message": message}},
        )


class UnsupportedFileTypeError(AppException):
    def __init__(self, message: str = "Only PDF, JPG, JPEG and PNG files are supported"):
        super().__init__(status.HTTP_400_BAD_REQUEST, "UNSUPPORTED_FILE_TYPE", message)


class FileTooLargeError(AppException):
    def __init__(self, max_mb: int):
        super().__init__(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            "FILE_TOO_LARGE",
            f"File size exceeds the maximum allowed size of {max_mb}MB",
        )


class EmptyFileError(AppException):
    def __init__(self):
        super().__init__(status.HTTP_400_BAD_REQUEST, "EMPTY_FILE", "Uploaded file is empty")


class MalformedFileError(AppException):
    def __init__(self, message: str = "The uploaded file appears to be malformed or corrupted"):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, "MALFORMED_FILE", message)


class DocumentNotFoundError(AppException):
    def __init__(self):
        super().__init__(status.HTTP_404_NOT_FOUND, "DOCUMENT_NOT_FOUND", "Document not found")


class QuestionNotFoundError(AppException):
    def __init__(self):
        super().__init__(status.HTTP_404_NOT_FOUND, "QUESTION_NOT_FOUND", "Question not found")


class ReviewItemNotFoundError(AppException):
    def __init__(self):
        super().__init__(status.HTTP_404_NOT_FOUND, "REVIEW_ITEM_NOT_FOUND", "Review item not found")


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", message)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Access denied"):
        super().__init__(status.HTTP_403_FORBIDDEN, "FORBIDDEN", message)


class UserAlreadyExistsError(AppException):
    def __init__(self):
        super().__init__(status.HTTP_409_CONFLICT, "USER_ALREADY_EXISTS", "A user with this email already exists")


class RelationshipExistsError(AppException):
    def __init__(self):
        super().__init__(
            status.HTTP_409_CONFLICT,
            "RELATIONSHIP_EXISTS",
            "This document relationship already exists",
        )


class ProcessingError(AppException):
    def __init__(self, message: str = "Document processing failed"):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, "PROCESSING_ERROR", message)
