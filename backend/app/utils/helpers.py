"""Utility helper functions."""

import uuid


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def safe_filename(original: str) -> str:
    """Generate a safe unique filename preserving the extension."""
    ext = original.rsplit(".", 1)[-1].lower() if "." in original else ""
    unique = uuid.uuid4().hex
    return f"{unique}.{ext}" if ext else unique
