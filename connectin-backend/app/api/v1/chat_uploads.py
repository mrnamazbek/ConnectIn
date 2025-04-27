# app/api/v1/uploads.py (Пример)
from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, Optional
from app.utils.s3_chat_client import create_presigned_post_url # Импорт из утилиты
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

@router.post("/chat/presigned-url", response_model=Dict)
async def get_chat_upload_url(
    filename: str = Body(..., embed=True),
    filetype: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Генерирует Pre-Signed POST URL для загрузки медиа в чат напрямую в S3."""
    presigned_data = create_presigned_post_url(
        file_name=filename,
        file_type=filetype,
        user_id=current_user.id
    )
    if not presigned_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type or other error generating URL.")
    return presigned_data # Возвращает url и fields для POST запроса с фронтенда

# Не забудьте подключить router в main.py