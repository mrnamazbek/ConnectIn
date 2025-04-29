# connectin-backend/app/utils/s3_chat_client.py (Пример)
import logging
from typing import Dict, Optional
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from fastapi import UploadFile
import uuid # Для генерации уникальных имен

from app.core.config import settings # Ваши настройки

logger = logging.getLogger(__name__)

# Настройка клиента S3 (можно вынести в зависимость FastAPI)
# Учетные данные должны быть настроены в окружении (через IAM роль или ключи)
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
    config=Config(signature_version='s3v4') # Рекомендуется для presigned URLs
)
S3_BUCKET_NAME = settings.AWS_BUCKET_NAME # Добавьте в config.py / .env
S3_CHAT_FOLDER = "chat-media/" # Папка для медиа чата

def create_presigned_post_url(file_name: str, file_type: str, user_id: int) -> Optional[Dict]:
    """Генерирует pre-signed URL для ЗАГРУЗКИ файла с фронтенда в S3."""
    # Генерируем уникальное имя объекта в S3
    object_name = f"{S3_CHAT_FOLDER}{user_id}/{uuid.uuid4()}_{file_name}"

    # Ограничения (пример)
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file_type not in allowed_types:
        logger.warning(f"Disallowed file type attempted upload: {file_type}")
        return None
    max_size = 10 * 1024 * 1024 # 10 MB

    try:
        # Note: Remove ACL settings since the bucket doesn't support ACLs
        response = s3_client.generate_presigned_post(
            Bucket=S3_BUCKET_NAME,
            Key=object_name,
            Fields={
                'Content-Type': file_type
            },
            Conditions=[
                {'Content-Type': file_type},
                ['content-length-range', 1, max_size]
            ],
            ExpiresIn=3600 # URL valid for 1 hour
        )
        
        # Добавляем полный URL объекта для сохранения в БД после загрузки
        response['object_url'] = f"https://{S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_name}"
        logger.info(f"Generated presigned POST URL for object: {object_name}")
        
        # Log the response structure for debugging
        logger.debug(f"Presigned POST response: {response}")
        
        return response
    except ClientError as e:
        logger.exception(f"Failed to generate presigned POST URL: {e}")
        return None

def upload_file_to_s3(file: UploadFile, user_id: int) -> Optional[str]:
     """Загружает файл через бэкенд (Вариант Б - менее предпочтителен)."""
     object_name = f"{S3_CHAT_FOLDER}{user_id}/{uuid.uuid4()}_{file.filename}"
     try:
          s3_client.upload_fileobj(
               file.file,
               S3_BUCKET_NAME,
               object_name,
               ExtraArgs={'ContentType': file.content_type}
          )
          file_url = f"https://{S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_name}"
          logger.info(f"File uploaded via backend to: {file_url}")
          return file_url
     except ClientError as e:
          logger.exception(f"Failed to upload file via backend: {e}")
          return None
     finally:
         file.file.close() # Закрываем файл

def create_presigned_get_url(object_key: str) -> Optional[str]:
     """Генерирует временную ссылку для СКАЧИВАНИЯ приватного файла."""
     try:
          url = s3_client.generate_presigned_url(
               'get_object',
               Params={'Bucket': S3_BUCKET_NAME, 'Key': object_key},
               ExpiresIn=3600 # Ссылка на скачивание/просмотр валидна 1 час
          )
          return url
     except ClientError as e:
          logger.exception(f"Failed to generate presigned GET URL for key {object_key}: {e}")
          return None