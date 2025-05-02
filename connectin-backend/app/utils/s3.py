# app/utils/s3.py
import boto3
import aioboto3
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import HTTPException, UploadFile
from app.core.config import settings
from typing import Optional
import uuid
import logging
from PIL import Image
import io

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.sync_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket = settings.AWS_BUCKET_NAME
        self.session = aioboto3.Session(
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

    def generate_presigned_url(self, object_name: str, expiration: int = 3600) -> str:
        """Generate presigned URL for secure uploads/downloads"""
        try:
            return self.sync_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_name},
                ExpiresIn=expiration
            )
        except ClientError as e:
            logger.error(f"S3 Presign Error: {str(e)}")
            raise HTTPException(500, "Failed to generate secure URL")

    async def upload_avatar(self, file: UploadFile, user_id: int) -> str:
        """Upload user avatar with validation and optimization"""
        try:
            # Validate file type
            if not file.content_type.startswith('image/'):
                raise HTTPException(400, "File must be an image")

            # Read file content
            contents = await file.read()
            
            # Validate image
            try:
                image = Image.open(io.BytesIO(contents))
                # Convert to RGB if necessary
                if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
                    image = image.convert('RGB')
                
                # Resize if too large
                max_size = (800, 800)
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Convert back to bytes
                output = io.BytesIO()
                image.save(output, format='JPEG', quality=85)
                contents = output.getvalue()
            except Exception as e:
                logger.error(f"Image processing error: {str(e)}")
                raise HTTPException(400, "Invalid image file")

            # Generate unique filename
            file_extension = '.jpg'
            object_name = f"user-avatars/{user_id}/{uuid.uuid4()}{file_extension}"

            # Upload to S3 using async client
            async with self.session.client('s3') as client:
                await client.upload_fileobj(
                    io.BytesIO(contents),
                    self.bucket,
                    object_name,
                    ExtraArgs={
                        'ContentType': 'image/jpeg',
                        'CacheControl': 'max-age=31536000'
                    }
                )

            # Generate public URL
            url = f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{object_name}"
            return url

        except (NoCredentialsError, ClientError) as e:
            logger.error(f"S3 Upload Error: {str(e)}")
            raise HTTPException(500, "Failed to upload avatar")
        except Exception as e:
            logger.error(f"Unexpected error during avatar upload: {str(e)}")
            raise HTTPException(500, "Failed to process avatar")
        finally:
            await file.close()

    async def upload_cover_photo(self, file: UploadFile, user_id: int) -> str:
        """Upload user cover photo with validation and optimization"""
        try:
            # Validate file type
            if not file.content_type.startswith('image/'):
                raise HTTPException(400, "File must be an image")

            # Read file content
            contents = await file.read()
            
            # Validate image
            try:
                image = Image.open(io.BytesIO(contents))
                # Convert to RGB if necessary
                if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
                    image = image.convert('RGB')
                
                # Resize if too large - cover photos are wider than avatars
                max_size = (1600, 600)  # Wider format for cover photos
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Convert back to bytes
                output = io.BytesIO()
                image.save(output, format='JPEG', quality=85)
                contents = output.getvalue()
            except Exception as e:
                logger.error(f"Image processing error: {str(e)}")
                raise HTTPException(400, "Invalid image file")

            # Generate unique filename
            file_extension = '.jpg'
            object_name = f"user-covers/{user_id}/{uuid.uuid4()}{file_extension}"

            # Upload to S3 using async client
            async with self.session.client('s3') as client:
                await client.upload_fileobj(
                    io.BytesIO(contents),
                    self.bucket,
                    object_name,
                    ExtraArgs={
                        'ContentType': 'image/jpeg',
                        'CacheControl': 'max-age=31536000'
                    }
                )

            # Generate public URL
            url = f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{object_name}"
            return url

        except (NoCredentialsError, ClientError) as e:
            logger.error(f"S3 Upload Error: {str(e)}")
            raise HTTPException(500, "Failed to upload cover photo")
        except Exception as e:
            logger.error(f"Unexpected error during cover photo upload: {str(e)}")
            raise HTTPException(500, "Failed to process cover photo")
        finally:
            await file.close()

    def delete_file(self, object_name: str) -> bool:
        """Permanently delete file from S3"""
        try:
            self.sync_client.delete_object(Bucket=self.bucket, Key=object_name)
            return True
        except ClientError as e:
            logger.error(f"S3 Delete Error: {str(e)}")
            return False

s3_service = S3Service()