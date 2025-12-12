from PIL import Image
import io
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)

def compress_image(upload_file: UploadFile, max_size=(800, 800), quality=85) -> io.BytesIO:
    """
    Compress and resize image before upload to S3
    
    Args:
        upload_file: The uploaded file (from FastAPI)
        max_size: Maximum dimensions (width, height)
        quality: JPEG compression quality (1-100)
        
    Returns:
        BytesIO buffer containing the compressed image
    """
    try:
        # Read the file content
        file_content = upload_file.file.read()
        upload_file.file.seek(0)  # Reset file pointer
        
        # Open image with PIL
        img = Image.open(io.BytesIO(file_content))
        
        # Resize if larger than max_size
        if img.width > max_size[0] or img.height > max_size[1]:
            img.thumbnail(max_size, Image.LANCZOS)
            
        # Save to buffer with compression
        buffer = io.BytesIO()
        
        # Determine format based on content type or file extension
        format = upload_file.content_type.split('/')[-1].upper()
        if format == 'JPG':
            format = 'JPEG'
            
        # Save with specified quality
        img.save(buffer, format=format, quality=quality)
        buffer.seek(0)
        
        logger.info(f"Image compressed: original size unknown, new size: {buffer.getbuffer().nbytes} bytes")
        return buffer
        
    except Exception as e:
        logger.error(f"Error compressing image: {str(e)}")
        # Return original file if compression fails
        upload_file.file.seek(0)
        return upload_file.file 