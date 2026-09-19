# Document Intelligence & Question Extraction Service

A production-oriented full-stack application that accepts examination/question-bank PDFs and images, processes them asynchronously, extracts structured questions with options, answers, confidence scores, and review items, and exposes results through a clean REST API with a React dashboard.

## 🌐 Live Production Deployments

| Component | Service Provider | Live URL |
|---|---|---|
| **Frontend Web Application** | Vercel | [https://frontend-five-jade-16.vercel.app](https://frontend-five-jade-16.vercel.app) |
| **Backend REST API** | Render | [https://docai-backend-vl7c.onrender.com](https://docai-backend-vl7c.onrender.com) |
| **Swagger Interactive API Docs** | Render | [https://docai-backend-vl7c.onrender.com/docs](https://docai-backend-vl7c.onrender.com/docs) |
| **ReDoc API Reference** | Render | [https://docai-backend-vl7c.onrender.com/redoc](https://docai-backend-vl7c.onrender.com/redoc) |
| **System Health Check** | Render | [https://docai-backend-vl7c.onrender.com/health](https://docai-backend-vl7c.onrender.com/health) |

## Features

- **Document Upload**: Accept PDF, JPG, JPEG, PNG files with full validation
- **Async Processing**: Celery workers process documents concurrently via Redis
- **PDF Text Extraction**: PyMuPDF for digital PDFs with selectable text
- **OCR**: Tesseract OCR for scanned documents and images
- **AI Extraction**: Pluggable AI providers (heuristic fallback works without API keys)
- **Question Detection**: MCQ, True/False, Short Answer, Unknown types
- **Cross-Page Questions**: Detect and merge questions spanning multiple pages
- **Answer Key Detection**: Find answer keys at end of document or in separate files
- **Answer Matching**: Associate answers with questions by normalized numbers
- **Confidence Scoring**: Multi-signal confidence (0.0-1.0) with configurable thresholds
- **Review System**: Flag uncertain extractions for human verification
- **Document Relationships**: Link question papers to answer key documents
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Authorization**: Users can only access their own documents
- **React Dashboard**: Upload, monitor, view questions, review items

## Architecture

```
React Frontend ──→ FastAPI ──→ PostgreSQL (metadata, questions, answers)
                     │
                     ├──→ Redis (Celery broker)
                     │
                     └──→ File Storage (local, S3-ready)
                            │
                     Celery Workers ──→ PDF/OCR/AI Pipeline ──→ PostgreSQL
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend API | FastAPI, Python 3.12+ |
| Database | PostgreSQL 16 |
| Queue | Redis 7, Celery 5.4 |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT (python-jose), bcrypt |
| PDF | PyMuPDF |
| OCR | Tesseract (configurable) |
| AI | Heuristic fallback + OpenAI (optional) |
| Testing | pytest, httpx |
| Deploy | Docker, Docker Compose |

## Prerequisites

- Docker & Docker Compose
- Git

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd document-intelligence-service

# Copy environment files
cp backend/.env.example backend/.env

# Start all services
docker compose up --build

# The system will automatically:
# 1. Start PostgreSQL and Redis
# 2. Run database migrations (alembic upgrade head)
# 3. Start the FastAPI backend on http://localhost:8000
# 4. Start the Celery worker
# 5. Start the React frontend on http://localhost:5173
```

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

## Environment Variables

See `backend/.env.example` for all configurable variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | PostgreSQL connection | Async database URL |
| `REDIS_URL` | Redis connection | Redis broker URL |
| `JWT_SECRET` | `change-me` | **Change in production** |
| `MAX_FILE_SIZE_MB` | `25` | Max upload size |
| `AI_PROVIDER` | (empty) | `openai`, or empty for heuristic |
| `AI_API_KEY` | (empty) | API key if using AI provider |
| `OCR_PROVIDER` | `tesseract` | OCR engine |
| `CONFIDENCE_EXTRACTED_THRESHOLD` | `0.85` | High confidence threshold |
| `CONFIDENCE_PARTIAL_THRESHOLD` | `0.60` | Medium confidence threshold |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login, returns JWT

### Documents
- `POST /api/v1/documents` — Upload document (multipart/form-data)
- `GET /api/v1/documents` — List user's documents
- `GET /api/v1/documents/{id}` — Get document details
- `GET /api/v1/documents/{id}/status` — Get processing status
- `DELETE /api/v1/documents/{id}` — Delete document

### Questions
- `GET /api/v1/documents/{id}/questions` — List questions
- `GET /api/v1/questions/{id}` — Get question details

### Answers
- `GET /api/v1/documents/{id}/answers` — List answers
- `GET /api/v1/questions/{id}/answer` — Get answer

### Review
- `GET /api/v1/documents/{id}/review-items` — List review items
- `GET /api/v1/review-items/{id}` — Get review item

### Relationships
- `POST /api/v1/documents/{id}/relationships` — Create relationship
- `GET /api/v1/documents/{id}/relationships` — List relationships

## Sample Workflow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@test.com", "password": "password123"}'

# 2. Upload PDF
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer <token>" \
  -F "file=@backend/sample_documents/clean_digital_exam.pdf"

# 3. Poll status
curl http://localhost:8000/api/v1/documents/<document_id>/status \
  -H "Authorization: Bearer <token>"

# 4. Get extracted questions
curl http://localhost:8000/api/v1/documents/<document_id>/questions \
  -H "Authorization: Bearer <token>"
```

## Testing

```bash
# Run all tests (inside Docker)
docker compose exec backend pytest tests/ -v

# Run unit tests only
docker compose exec backend pytest tests/unit/ -v

# Run integration tests only
docker compose exec backend pytest tests/integration/ -v
```

## Generate Sample Documents

```bash
docker compose exec backend python sample_documents/generate_samples.py
```

## Postman

Import `postman/document-intelligence.postman_collection.json` into Postman.

1. Set the `base_url` variable to `http://localhost:8000`
2. Run "Register" or "Login" — token is auto-saved
3. Use "Upload PDF" with a sample document
4. Run remaining requests

## Database Migrations

```bash
# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback
docker compose exec backend alembic downgrade -1
```

## AI/OCR Providers

| Provider | Type | API Key Required | Notes |
|----------|------|-----------------|-------|
| Heuristic | AI | No | Default. Regex-based extraction |
| Tesseract | OCR | No | Default. Local OCR |
| OpenAI | AI | Yes | Set `AI_PROVIDER=openai` |

The system works fully with the heuristic + Tesseract defaults (no paid APIs needed).

## Known Limitations

1. **Heuristic extraction** relies on common question patterns — unusual formats may need AI
2. **Cross-page merge** uses structural signals — complex layouts may need manual review
3. **Image/table references** are preserved as page references but content is not extracted
4. **OCR accuracy** depends on scan quality — preprocessing helps but has limits
5. **Answer key detection** works best with common formats (1-A, Q1->A, etc.)

## Trade-offs

- **Heuristic vs AI**: Heuristic fallback chosen as default to avoid API key requirement for evaluation. AI providers are pluggable for production use.
- **Sync migrations**: Alembic uses sync engine (standard practice) even though the app uses async SQLAlchemy.
- **Local storage**: Default storage is local filesystem for simplicity. Interface supports S3/GCS/Azure.
- **Polling vs WebSockets**: Frontend uses polling for simplicity. WebSocket upgrade is straightforward.
