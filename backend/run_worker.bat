@echo off
echo ========================================================
echo Starting Celery Worker for Document Intelligence Service
echo ========================================================
cd /d "%~dp0"
call .venv\Scripts\activate
celery -A app.workers.celery_app.celery_app worker --loglevel=info -P solo
pause
