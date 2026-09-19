"""Analytics and Telemetry API endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.models.document import Document
from app.models.question import Question
from app.models.review_item import ReviewItem

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/summary",
    summary="Get user intelligence analytics summary",
    description="Returns aggregate metrics, taxonomy breakdowns, confidence stats, and engine telemetry.",
)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    # Documents summary
    doc_query = select(
        func.count(Document.id),
        func.coalesce(func.sum(Document.total_pages), 0),
        func.coalesce(func.sum(Document.file_size), 0),
    ).where(Document.user_id == user_id)
    doc_res = await db.execute(doc_query)
    doc_count, total_pages, total_file_size = doc_res.first()

    # Documents by status
    status_query = (
        select(Document.status, func.count(Document.id))
        .where(Document.user_id == user_id)
        .group_by(Document.status)
    )
    status_res = await db.execute(status_query)
    docs_by_status = {row[0]: row[1] for row in status_res.all()}

    # Questions summary
    q_query = (
        select(
            func.count(Question.id),
            func.coalesce(func.avg(Question.confidence), 0.0),
        )
        .join(Document, Question.document_id == Document.id)
        .where(Document.user_id == user_id)
    )
    q_res = await db.execute(q_query)
    q_count, avg_confidence = q_res.first()

    # Question types taxonomy
    type_query = (
        select(Question.question_type, func.count(Question.id))
        .join(Document, Question.document_id == Document.id)
        .where(Document.user_id == user_id)
        .group_by(Question.question_type)
    )
    type_res = await db.execute(type_query)
    taxonomy = {row[0]: row[1] for row in type_res.all()}

    # Confidence distribution (High: >=0.85, Med: 0.60 - 0.84, Low: <0.60)
    high_conf_q = (
        select(func.count(Question.id))
        .join(Document, Question.document_id == Document.id)
        .where(Document.user_id == user_id, Question.confidence >= 0.85)
    )
    med_conf_q = (
        select(func.count(Question.id))
        .join(Document, Question.document_id == Document.id)
        .where(Document.user_id == user_id, Question.confidence >= 0.60, Question.confidence < 0.85)
    )
    low_conf_q = (
        select(func.count(Question.id))
        .join(Document, Question.document_id == Document.id)
        .where(Document.user_id == user_id, Question.confidence < 0.60)
    )

    high_conf = (await db.execute(high_conf_q)).scalar() or 0
    med_conf = (await db.execute(med_conf_q)).scalar() or 0
    low_conf = (await db.execute(low_conf_q)).scalar() or 0

    # Review items stats
    rev_total_q = (
        select(func.count(ReviewItem.id))
        .join(Document, ReviewItem.document_id == Document.id)
        .where(Document.user_id == user_id)
    )
    rev_res_q = (
        select(func.count(ReviewItem.id))
        .join(Document, ReviewItem.document_id == Document.id)
        .where(Document.user_id == user_id, ReviewItem.resolved == True)
    )
    rev_total = (await db.execute(rev_total_q)).scalar() or 0
    rev_resolved = (await db.execute(rev_res_q)).scalar() or 0
    rev_pending = max(0, rev_total - rev_resolved)

    return {
        "success": True,
        "data": {
            "documents": {
                "total": doc_count,
                "total_pages": int(total_pages),
                "total_file_bytes": int(total_file_size),
                "by_status": docs_by_status,
            },
            "questions": {
                "total": q_count,
                "avg_confidence": round(float(avg_confidence) * 100, 1),
                "taxonomy": taxonomy,
                "confidence_distribution": {
                    "high": high_conf,
                    "medium": med_conf,
                    "low": low_conf,
                },
            },
            "review": {
                "total_flags": rev_total,
                "resolved": rev_resolved,
                "pending": rev_pending,
                "clearance_rate": round((rev_resolved / rev_total) * 100, 1) if rev_total > 0 else 100.0,
            },
            "telemetry": {
                "ai_model": settings.OPENROUTER_MODEL or "nvidia/nemotron-3.5-lightning:free",
                "ai_status": "ONLINE" if (settings.OPENROUTER_API_KEY or settings.AGENTROUTER_API_KEY) else "STANDBY",
                "heuristic_fallback": "ACTIVE",
                "database": "CONNECTED",
                "redis_broker": "CONNECTED",
                "storage_provider": "Cloudinary",
                "environment": settings.APP_ENV,
            },
        },
    }
