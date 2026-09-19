"""Storage service — abstract interface + local filesystem + Cloudinary implementations."""

import os
import io
import tempfile
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

import cloudinary
import cloudinary.uploader
import cloudinary.api
import requests

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class StorageProvider(ABC):
    """Abstract storage provider interface."""

    @abstractmethod
    def save(self, content: bytes, path: str) -> str:
        """Save content and return the storage path/URL."""
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

    def get_full_path(self, path: str) -> str:
        """Get the full path/URL for processing workers."""
        return path


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
        logger.info("file_saved", provider="local", path=path, size=len(content))
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
            logger.info("file_deleted", provider="local", path=path)
            return True
        return False

    def exists(self, path: str) -> bool:
        return self._resolve_path(path).exists()

    def get_full_path(self, path: str) -> str:
        """Get the absolute path on disk — used by processing workers."""
        return str(self._resolve_path(path))


class CloudinaryStorageProvider(StorageProvider):
    """Cloudinary cloud storage provider for media/document storage."""

    def __init__(self):
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        self._folder = settings.CLOUDINARY_FOLDER
        # Local temp directory for caching files needed by workers
        self._temp_dir = Path(tempfile.gettempdir()) / "docai_cache"
        self._temp_dir.mkdir(parents=True, exist_ok=True)
        logger.info("cloudinary_configured", cloud_name=settings.CLOUDINARY_CLOUD_NAME)

    def _to_public_id(self, path: str) -> str:
        """Convert storage path to a Cloudinary public ID."""
        # Strip extension since Cloudinary manages formats
        base = path.rsplit(".", 1)[0] if "." in path else path
        return f"{self._folder}/{base}" if self._folder else base

    def save(self, content: bytes, path: str) -> str:
        """Upload content to Cloudinary and return the storage path."""
        public_id = self._to_public_id(path)
        ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""

        # Determine resource type
        resource_type = "raw"  # default for PDFs and non-image files
        if ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"):
            resource_type = "image"

        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            public_id=public_id,
            resource_type=resource_type,
            overwrite=True,
            invalidate=True,
        )

        logger.info(
            "file_saved",
            provider="cloudinary",
            path=path,
            public_id=public_id,
            url=result.get("secure_url"),
            size=len(content),
        )
        return path

    def get(self, path: str) -> bytes:
        """Download content from Cloudinary."""
        # Check local cache first
        cache_path = self._temp_dir / path.replace("/", os.sep)
        if cache_path.exists():
            return cache_path.read_bytes()

        public_id = self._to_public_id(path)
        ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
        resource_type = "image" if ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff") else "raw"

        try:
            info = cloudinary.api.resource(public_id, resource_type=resource_type)
            url = info.get("secure_url")
        except cloudinary.exceptions.NotFound:
            raise FileNotFoundError(f"File not found on Cloudinary: {path}")

        response = requests.get(url, timeout=60)
        response.raise_for_status()
        content = response.content

        # Cache locally for worker processing
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_bytes(content)

        return content

    def delete(self, path: str) -> bool:
        """Delete file from Cloudinary."""
        public_id = self._to_public_id(path)
        ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
        resource_type = "image" if ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff") else "raw"

        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            success = result.get("result") == "ok"
            if success:
                logger.info("file_deleted", provider="cloudinary", path=path)
                # Remove from local cache too
                cache_path = self._temp_dir / path.replace("/", os.sep)
                if cache_path.exists():
                    cache_path.unlink()
            return success
        except Exception as e:
            logger.error("cloudinary_delete_error", path=path, error=str(e))
            return False

    def exists(self, path: str) -> bool:
        """Check if file exists on Cloudinary."""
        public_id = self._to_public_id(path)
        ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
        resource_type = "image" if ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff") else "raw"

        try:
            cloudinary.api.resource(public_id, resource_type=resource_type)
            return True
        except cloudinary.exceptions.NotFound:
            return False
        except Exception:
            return False

    def get_full_path(self, path: str) -> str:
        """Download to local temp cache and return the local path for worker processing."""
        cache_path = self._temp_dir / path.replace("/", os.sep)
        if not cache_path.exists():
            content = self.get(path)
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.write_bytes(content)
        return str(cache_path)

    def get_url(self, path: str) -> str:
        """Get the public Cloudinary URL for a file."""
        public_id = self._to_public_id(path)
        ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
        resource_type = "image" if ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff") else "raw"

        try:
            info = cloudinary.api.resource(public_id, resource_type=resource_type)
            return info.get("secure_url", "")
        except Exception:
            return ""


def get_storage_provider() -> StorageProvider:
    """Factory function to get the configured storage provider."""
    provider = settings.STORAGE_PROVIDER.lower()
    if provider == "cloudinary":
        return CloudinaryStorageProvider()
    return LocalStorageProvider()
