"""Celery application configuration."""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "document_intelligence",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.document_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=30,
    task_max_retries=3,
)

# Support Upstash or cloud Redis over TLS (rediss://)
if settings.CELERY_BROKER_URL.startswith("rediss://"):
    import ssl
    celery_app.conf.update(
        broker_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
        redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
    )

