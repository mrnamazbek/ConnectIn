# app/core/exceptions.py
from fastapi import HTTPException
from starlette.responses import JSONResponse

from app.main import app


class CustomAPIException(HTTPException):
    def __init__(self, detail: str, status_code: int = 400):
        super().__init__(
            status_code=status_code,
            detail=detail
        )

# Включить в main.py:
@app.exception_handler(CustomAPIException)
async def custom_exception_handler(request, exc):
    return JSONResponse(...)