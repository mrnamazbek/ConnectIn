# connectin-backend/app/services/pdf_service.py

import logging
from io import BytesIO
from weasyprint import HTML
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class PDFService:
    @staticmethod
    def generate_pdf(html_content: str) -> bytes:
        """Convert HTML content to PDF with LaTeX-like styling"""
        try:
            html = HTML(string=html_content)
            pdf_file = html.write_pdf()
            return pdf_file
        except Exception as e:
            logger.error(f"PDF generation failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate PDF document"
            )

    @staticmethod
    def create_pdf_response(pdf_content: bytes, filename: str) -> BytesIO:
        """Create streaming response for PDF download"""
        try:
            buffer = BytesIO()
            buffer.write(pdf_content)
            buffer.seek(0)
            return buffer
        except Exception as e:
            logger.error(f"PDF response creation failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to create PDF response"
            )