# Production Deployment & Live URLs

## 🌐 Live Production URLs

| Service | Host | URL |
|---|---|---|
| **Frontend Web App** | Vercel | [https://frontend-five-jade-16.vercel.app](https://frontend-five-jade-16.vercel.app) |
| **Backend REST API** | Render | [https://docai-backend-vl7c.onrender.com](https://docai-backend-vl7c.onrender.com) |
| **Interactive Swagger Docs** | Render | [https://docai-backend-vl7c.onrender.com/docs](https://docai-backend-vl7c.onrender.com/docs) |
| **ReDoc API Documentation** | Render | [https://docai-backend-vl7c.onrender.com/redoc](https://docai-backend-vl7c.onrender.com/redoc) |
| **Health Check Endpoint** | Render | [https://docai-backend-vl7c.onrender.com/health](https://docai-backend-vl7c.onrender.com/health) |

---

## 1. Architecture Overview

- **Frontend (React 18 + Vite)**: Deployed on Vercel as a Single Page Application (SPA) with routing rewrites via `vercel.json`.
- **Backend (FastAPI + Uvicorn)**: Containerized with Docker and hosted as a Web Service on Render, with PyMuPDF, Tesseract OCR, and OpenCV.
- **Worker (Celery)**: Background worker running on Render, connected to Upstash Redis for asynchronous task processing.
- **Database**: PostgreSQL (Supabase IPv4 Pooler) managing documents, pages, questions, options, answers, and reviews.
- **Object Storage**: Cloudinary storing uploaded documents and rendered page images.
