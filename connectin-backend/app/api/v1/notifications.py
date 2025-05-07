from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from app.database.connection import get_db
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.api.v1.auth import get_current_user
from app.models.notification import Notification

router = APIRouter()

@router.get("/me", response_model=List[NotificationOut])
async def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notifications for the current user, ordered by creation date (newest first).
    """
    notifications = db.query(Notification)\
        .filter(Notification.user_id == current_user.id)\
        .order_by(desc(Notification.created_at))\
        .all()
    
    return notifications

@router.post("/mark-read/{notification_id}")
async def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    notification = db.query(Notification)\
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)\
        .first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    notification.read_at = datetime.now()
    db.commit()
    
    return {"detail": "Notification marked as read"}

@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all notifications for the current user as read.
    """
    unread_notifications = db.query(Notification)\
        .filter(Notification.user_id == current_user.id, Notification.read == False)\
        .all()
    
    now = datetime.now()
    for notification in unread_notifications:
        notification.read = True
        notification.read_at = now
    
    db.commit()
    
    return {"detail": f"{len(unread_notifications)} notifications marked as read"} 