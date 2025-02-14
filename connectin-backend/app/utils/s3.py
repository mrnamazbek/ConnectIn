# import boto3
# import uuid
# from fastapi import UploadFile
# from app.core.config import settings

# # Initialize S3 Client
# s3_client = boto3.client(
#     "s3",
#     aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
#     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
#     region_name=settings.AWS_REGION,
# )

# def upload_file_to_s3(file: UploadFile, folder: str) -> str:
#     """
#     Uploads a file to S3 and returns the file URL.
#     """
#     try:
#         file_extension = file.filename.split(".")[-1]
#         file_key = f"{folder}/{uuid.uuid4()}.{file_extension}"  # Unique file name

#         s3_client.upload_fileobj(
#             file.file, settings.AWS_BUCKET_NAME, file_key,
#             ExtraArgs={"ACL": "public-read", "ContentType": file.content_type}
#         )

#         return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
#     except Exception as e:
#         print(f"Error uploading to S3: {e}")
#         return None

# def delete_file_from_s3(file_url: str) -> bool:
#     """
#     Deletes a file from S3.
#     """
#     try:
#         file_key = file_url.split(f"{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
#         s3_client.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=file_key)
#         return True
#     except Exception as e:
#         print(f"Error deleting from S3: {e}")
#         return False
