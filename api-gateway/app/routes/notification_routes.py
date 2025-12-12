"""
Notification routes - Forward notification requests to notification service
"""
from fastapi import APIRouter, HTTPException, Depends
import httpx
import logging

from app.config import settings
from app.middleware.auth import verify_token

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("")
async def get_notifications(
    user: dict = Depends(verify_token)
):
    """Get user notifications"""
    try:
        headers = {"X-User-ID": str(user.get("sub"))}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.NOTIFICATION_SERVICE_URL}/notifications",
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Notification service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Notification service unavailable"
        )

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    user: dict = Depends(verify_token)
):
    """Mark notification as read"""
    try:
        headers = {"X-User-ID": str(user.get("sub"))}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/notifications/{notification_id}/read",
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Notification service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Notification service unavailable"
        )
