"""Pytest configuration and shared fixtures."""

import pytest
import asyncio
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token, hash_password
from app.core.database import get_db, Base


# --- Fixtures ---

@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for all tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_user_id():
    return uuid4()


@pytest.fixture
def test_token(test_user_id):
    return create_access_token(str(test_user_id))


@pytest.fixture
def auth_headers(test_token):
    return {"Authorization": f"Bearer {test_token}"}


@pytest.fixture
def mock_db():
    """Mock async database session."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
async def client(mock_db):
    """Async test client with mocked database."""
    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


# --- Sample Data ---

def make_sample_pdf_content():
    """Create minimal valid PDF bytes."""
    return b"%PDF-1.4 minimal test content for validation"


def make_sample_jpg_content():
    """Create minimal valid JPEG bytes."""
    return b"\xff\xd8\xff\xe0" + b"\x00" * 100


def make_sample_png_content():
    """Create minimal valid PNG bytes."""
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
