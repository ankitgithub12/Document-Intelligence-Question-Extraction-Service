"""File validation utilities — extension, MIME, magic bytes, size."""

import mimetypes
from app.core.config import settings
from app.utils.constants import ALLOWED_MIME_TYPES, FILE_SIGNATURES, FileType
from app.utils.exceptions import (
    UnsupportedFileTypeError, FileTooLargeError, EmptyFileError, MalformedFileError
)


def validate_file_extension(filename: str) -> str:
    """Validate and return the file extension."""
    if "." not in filename:
        raise UnsupportedFileTypeError()
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in settings.allowed_extensions_list:
        raise UnsupportedFileTypeError(
            f"File extension '.{ext}' is not supported. Allowed: {', '.join(settings.allowed_extensions_list)}"
        )
    return ext


def validate_mime_type(content_type: str | None) -> None:
    """Validate the MIME type from the upload header."""
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise UnsupportedFileTypeError(
            f"MIME type '{content_type}' is not supported"
        )


def validate_file_content(content: bytes) -> FileType:
    """Validate file content using magic bytes and return the detected file type."""
    if not content or len(content) == 0:
        raise EmptyFileError()

    for signature, file_type in FILE_SIGNATURES.items():
        if content[:len(signature)] == signature:
            return file_type

    raise MalformedFileError(
        "File content does not match any supported format (PDF, JPG, PNG)"
    )


def validate_file_size(size: int) -> None:
    """Validate that the file does not exceed the maximum allowed size."""
    if size > settings.max_file_size_bytes:
        raise FileTooLargeError(settings.MAX_FILE_SIZE_MB)

    if size == 0:
        raise EmptyFileError()


def validate_upload(filename: str, content_type: str | None, content: bytes) -> FileType:
    """Run all file validations and return the detected file type."""
    validate_file_extension(filename)
    validate_mime_type(content_type)
    validate_file_size(len(content))
    detected_type = validate_file_content(content)
    return detected_type
