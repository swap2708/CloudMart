from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Service health check")
def health_check(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Verify application operational status and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "database": "connected",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "version": settings.APP_VERSION,
                "database": "disconnected",
                "error": str(e),
            },
        )
