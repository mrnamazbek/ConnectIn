import logging
from weasyprint import HTML, CSS
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Base CSS styles for PDF generation
DEFAULT_PDF_CSS = """
    @page { margin: 1.5cm; } /* Поля страницы */
    body { font-family: sans-serif; line-height: 1.5; font-size: 10pt; }
    h1 { font-size: 18pt; font-weight: bold; text-align: center; color: #333; margin-bottom: 0.5em; }
    h2 { font-size: 14pt; font-weight: bold; color: #444; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
    h3 { font-size: 11pt; font-weight: bold; color: #555; margin-top: 1em; margin-bottom: 0.3em; }
    p { margin: 0.3em 0; }
    ul { padding-left: 1.5em; margin: 0.5em 0; }
    li { margin-bottom: 0.3em; }
    strong { font-weight: bold; }
    em { font-style: italic; color: #555; }
    a { color: #0066cc; text-decoration: none; }
    pre { background-color: #f0f0f0; padding: 0.5em; border-radius: 3px; font-family: monospace; white-space: pre-wrap; word-wrap: break-word; }
    /* Добавьте другие стили по необходимости */
"""

class PDFService:
    @staticmethod
    def generate_pdf(html_content: str, base_url: str | None = None) -> bytes:
        """Converts HTML string to PDF bytes with basic styling."""
        try:
            logger.info("Starting PDF generation with WeasyPrint...")
            html = HTML(string=html_content, base_url=base_url)
            css = CSS(string=DEFAULT_PDF_CSS)
            pdf_bytes = html.write_pdf(stylesheets=[css])
            logger.info(f"PDF generated successfully, size: {len(pdf_bytes)} bytes")
            return pdf_bytes
        except Exception as e:
            logger.exception(f"WeasyPrint PDF generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate PDF document: {e}"
            )