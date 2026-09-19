"""Integration tests for API endpoints."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from tests.conftest import make_sample_pdf_content, make_sample_jpg_content, make_sample_png_content


# ============================================================
# Health Check Tests
# ============================================================

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert "Document Intelligence" in response.json()["service"]


# ============================================================
# Auth Tests
# ============================================================

@pytest.mark.asyncio
async def test_register(client, mock_db):
    with patch("app.api.v1.auth.AuthService") as MockService:
        instance = MockService.return_value
        instance.register = AsyncMock(return_value={
            "access_token": "test_token",
            "token_type": "bearer",
            "user_id": str(uuid4()),
        })

        response = await client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "securepassword123",
        })
        assert response.status_code == 201
        assert response.json()["success"] is True
        assert "access_token" in response.json()["data"]


@pytest.mark.asyncio
async def test_login(client, mock_db):
    with patch("app.api.v1.auth.AuthService") as MockService:
        instance = MockService.return_value
        instance.login = AsyncMock(return_value={
            "access_token": "test_token",
            "token_type": "bearer",
            "user_id": str(uuid4()),
        })

        response = await client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "securepassword123",
        })
        assert response.status_code == 200
        assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_login_invalid_format(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "not-an-email",
        "password": "short",
    })
    assert response.status_code == 422


# ============================================================
# Document Upload Tests
# ============================================================

@pytest.mark.asyncio
async def test_upload_pdf(client, auth_headers, mock_db):
    with patch("app.api.v1.documents.DocumentService") as MockService, \
         patch("app.api.v1.documents.process_document") as mock_task:
        instance = MockService.return_value
        doc_id = str(uuid4())
        instance.upload_document = AsyncMock(return_value={
            "document_id": doc_id,
            "filename": "test.pdf",
            "status": "QUEUED",
        })
        mock_task.delay = MagicMock()

        response = await client.post(
            "/api/v1/documents",
            headers=auth_headers,
            files={"file": ("test.pdf", make_sample_pdf_content(), "application/pdf")},
        )
        assert response.status_code == 201
        assert response.json()["data"]["status"] == "QUEUED"
        mock_task.delay.assert_called_once_with(doc_id)


@pytest.mark.asyncio
async def test_upload_jpg(client, auth_headers, mock_db):
    with patch("app.api.v1.documents.DocumentService") as MockService, \
         patch("app.api.v1.documents.process_document"):
        instance = MockService.return_value
        instance.upload_document = AsyncMock(return_value={
            "document_id": str(uuid4()),
            "filename": "test.jpg",
            "status": "QUEUED",
        })

        response = await client.post(
            "/api/v1/documents",
            headers=auth_headers,
            files={"file": ("test.jpg", make_sample_jpg_content(), "image/jpeg")},
        )
        assert response.status_code == 201


@pytest.mark.asyncio
async def test_upload_png(client, auth_headers, mock_db):
    with patch("app.api.v1.documents.DocumentService") as MockService, \
         patch("app.api.v1.documents.process_document"):
        instance = MockService.return_value
        instance.upload_document = AsyncMock(return_value={
            "document_id": str(uuid4()),
            "filename": "test.png",
            "status": "QUEUED",
        })

        response = await client.post(
            "/api/v1/documents",
            headers=auth_headers,
            files={"file": ("test.png", make_sample_png_content(), "image/png")},
        )
        assert response.status_code == 201


@pytest.mark.asyncio
async def test_upload_unsupported_file(client, auth_headers):
    response = await client.post(
        "/api/v1/documents",
        headers=auth_headers,
        files={"file": ("test.docx", b"fake content", "application/msword")},
    )
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_upload_empty_file(client, auth_headers):
    response = await client.post(
        "/api/v1/documents",
        headers=auth_headers,
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_upload_without_auth(client):
    response = await client.post(
        "/api/v1/documents",
        files={"file": ("test.pdf", make_sample_pdf_content(), "application/pdf")},
    )
    assert response.status_code in [401, 403]


# ============================================================
# Document CRUD Tests
# ============================================================

@pytest.mark.asyncio
async def test_list_documents(client, auth_headers, mock_db):
    with patch("app.api.v1.documents.DocumentService") as MockService:
        instance = MockService.return_value
        instance.list_documents = AsyncMock(return_value=([], 0))

        response = await client.get("/api/v1/documents", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_get_document_status(client, auth_headers, mock_db):
    doc_id = uuid4()
    with patch("app.api.v1.documents.DocumentService") as MockService:
        instance = MockService.return_value
        instance.get_status = AsyncMock(return_value={
            "document_id": str(doc_id),
            "status": "PROCESSING",
            "progress": {"total_pages": 10, "processed_pages": 5, "percentage": 50},
            "question_count": 0,
            "review_count": 0,
            "error": None,
        })

        response = await client.get(
            f"/api/v1/documents/{doc_id}/status",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "PROCESSING"


# ============================================================
# Questions Tests
# ============================================================

@pytest.mark.asyncio
async def test_list_questions(client, auth_headers, mock_db):
    doc_id = uuid4()
    with patch("app.api.v1.questions.DocumentRepository") as MockDocRepo, \
         patch("app.api.v1.questions.QuestionRepository") as MockQRepo:
        doc_instance = MockDocRepo.return_value
        doc_mock = MagicMock()
        doc_mock.original_filename = "test.pdf"
        doc_instance.get_by_id = AsyncMock(return_value=doc_mock)

        q_instance = MockQRepo.return_value
        q_instance.list_by_document = AsyncMock(return_value=([], 0))

        response = await client.get(
            f"/api/v1/documents/{doc_id}/questions",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["success"] is True


# ============================================================
# Review Items Tests
# ============================================================

@pytest.mark.asyncio
async def test_list_review_items(client, auth_headers, mock_db):
    doc_id = uuid4()
    with patch("app.api.v1.review.DocumentRepository") as MockDocRepo, \
         patch("app.api.v1.review.QuestionRepository") as MockQRepo:
        doc_instance = MockDocRepo.return_value
        doc_instance.get_by_id = AsyncMock(return_value=MagicMock())

        q_instance = MockQRepo.return_value
        q_instance.get_review_items = AsyncMock(return_value=([], 0))

        response = await client.get(
            f"/api/v1/documents/{doc_id}/review-items",
            headers=auth_headers,
        )
        assert response.status_code == 200


# ============================================================
# Relationship Tests
# ============================================================

@pytest.mark.asyncio
async def test_create_relationship(client, auth_headers, mock_db):
    source_id = uuid4()
    related_id = uuid4()
    with patch("app.api.v1.relationships.DocumentRepository") as MockDocRepo:
        instance = MockDocRepo.return_value
        source_mock = MagicMock()
        related_mock = MagicMock()
        instance.get_by_id = AsyncMock(side_effect=[source_mock, related_mock])
        instance.relationship_exists = AsyncMock(return_value=False)

        rel_mock = MagicMock()
        rel_mock.id = uuid4()
        rel_mock.source_document_id = source_id
        rel_mock.related_document_id = related_id
        rel_mock.relationship_type = "ANSWER_KEY"
        rel_mock.created_at = "2024-01-01T00:00:00"
        instance.create_relationship = AsyncMock(return_value=rel_mock)

        response = await client.post(
            f"/api/v1/documents/{source_id}/relationships",
            headers=auth_headers,
            json={
                "related_document_id": str(related_id),
                "relationship_type": "ANSWER_KEY",
            },
        )
        assert response.status_code == 201
