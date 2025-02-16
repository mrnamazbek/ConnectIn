# app/utils/s3.py
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import HTTPException, UploadFile
from app.core.config import settings
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket = settings.AWS_S3_BUCKET_NAME

    def generate_presigned_url(self, object_name: str, expiration: int = 3600) -> str:
        """Generate presigned URL for secure uploads/downloads"""
        try:
            return self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_name},
                ExpiresIn=expiration
            )
        except ClientError as e:
            logger.error(f"S3 Presign Error: {str(e)}")
            raise HTTPException(500, "Failed to generate secure URL")

    async def upload_file(self, file: UploadFile, prefix: str = "uploads") -> str:
        """Upload file with content type detection and UUID filename"""
        try:
            object_name = f"{prefix}/{uuid.uuid4()}{file.filename[-4:]}"
            await self.client.upload_fileobj(
                file.file,
                self.bucket,
                object_name,
                ExtraArgs={
                    'ContentType': file.content_type,
                    'ACL': 'public-read'
                }
            )
            return f"https://{self.bucket}.s3.amazonaws.com/{object_name}"
        except (NoCredentialsError, ClientError) as e:
            logger.error(f"S3 Upload Error: {str(e)}")
            raise HTTPException(500, "File upload failed")
        finally:
            await file.close()

    def delete_file(self, object_name: str) -> bool:
        """Permanently delete file from S3"""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=object_name)
            return True
        except ClientError as e:
            logger.error(f"S3 Delete Error: {str(e)}")
            return False

s3_service = S3Service()