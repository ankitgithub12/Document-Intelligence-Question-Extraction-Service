"""Storage service — abstract interface + local filesystem implementation."""

import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class StorageProvider(ABC):
    """Abstract storage provider interface."""

    @abstractmethod
    def save(self, content: bytes, path: str) -> str:
        """Save content and return the storage path."""
        ...

    @abstractmethod
    def get(self, path: str) -> bytes:
        """Retrieve content by path."""
        ...

    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete content by path."""
        ...

    @abstractmethod
    def exists(self, path: str) -> bool:
        """Check if content exists at path."""
        ...


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider."""

    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or settings.LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, path: str) -> Path:
        """Resolve path safely, preventing path traversal."""
        resolved = (self.base_path / path).resolve()
        if not str(resolved).startswith(str(self.base_path.resolve())):
            raise ValueError("Path traversal detected")
        return resolved

    def save(self, content: bytes, path: str) -> str:
        full_path = self._resolve_path(path)
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(content)
        logger.info("file_saved", path=path, size=len(content))
        return path

    def get(self, path: str) -> bytes:
        full_path = self._resolve_path(path)
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        return full_path.read_bytes()

    def delete(self, path: str) -> bool:
        full_path = self._resolve_path(path)
        if full_path.exists():
            full_path.unlink()
            logger.info("file_deleted", path=path)
            return True
        return False

    def exists(self, path: str) -> bool:
        return self._resolve_path(path).exists()

    def get_full_path(self, path: str) -> str:
        """Get the absolute path on disk — used by processing workers."""
        return str(self._resolve_path(path))


def get_storage_provider() -> LocalStorageProvider:
    """Factory function to get the configured storage provider."""
    if settings.STORAGE_PROVIDER == "local":
        return LocalStorageProvider()
    # Future: add S3, GCS, Azure providers here
    return LocalStorageProvider()
