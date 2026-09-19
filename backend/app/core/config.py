"""Application configuration from environment variables."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://docai_user:docai_password@postgres:5432/document_intelligence"
    DATABASE_URL_SYNC: str = "postgresql://docai_user:docai_password@postgres:5432/document_intelligence"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    JWT_SECRET: str = "change-me-to-a-secure-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # File Upload
    MAX_FILE_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: str = "pdf,jpg,jpeg,png"

    # Storage
    STORAGE_PROVIDER: str = "cloudinary"
    LOCAL_STORAGE_PATH: str = "./storage"

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = ""
    CLOUDINARY_API_KEY: Optional[str] = ""
    CLOUDINARY_API_SECRET: Optional[str] = ""
    CLOUDINARY_FOLDER: str = "document-intelligence"

    # OCR
    OCR_PROVIDER: str = "tesseract"

    # AI Provider
    AI_PROVIDER: Optional[str] = ""
    AI_API_KEY: Optional[str] = ""
    AI_MODEL: Optional[str] = ""
    AI_BASE_URL: Optional[str] = ""


    # Confidence Thresholds
    CONFIDENCE_EXTRACTED_THRESHOLD: float = 0.85
    CONFIDENCE_PARTIAL_THRESHOLD: float = 0.60

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
