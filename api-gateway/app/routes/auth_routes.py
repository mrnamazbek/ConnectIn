"""
Auth routes - Forward authentication requests to auth service
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx
import logging

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register")
async def register(request: Request):
    """Forward registration request to auth service"""
    try:
        body = await request.json()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AUTH_SERVICE_URL}/auth/register",
                json=body,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Auth service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )

@router.post("/login")
async def login(request: Request):
    """Forward login request to auth service"""
    try:
        body = await request.json()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AUTH_SERVICE_URL}/auth/login",
                json=body,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Auth service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )

@router.post("/refresh")
async def refresh_token(request: Request):
    """Forward token refresh request to auth service"""
    try:
        body = await request.json()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AUTH_SERVICE_URL}/auth/refresh",
                json=body,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Auth service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )

@router.get("/google")
async def google_auth(request: Request):
    """Forward Google OAuth request to auth service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/auth/google",
                params=dict(request.query_params),
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Auth service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )

@router.get("/health")
async def auth_health():
    """Check auth service health"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/health",
                timeout=5
            )
            return response.json()
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )
