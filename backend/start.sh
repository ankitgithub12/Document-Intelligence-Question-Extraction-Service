#!/bin/bash
set -e

echo "=== Running Database Migrations ==="
alembic upgrade head || echo "Database migration skipped or already up to date."

echo "=== Starting Celery Background Worker ==="
celery -A app.workers.celery_app.celery_app worker --loglevel=info --concurrency=2 &

echo "=== Starting FastAPI Web Server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
