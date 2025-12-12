"""
Project routes - Forward project requests to project service
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import httpx
import logging

from app.config import settings
from app.middleware.auth import verify_token, get_optional_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("")
async def get_projects(
    request: Request,
    user: dict = Depends(get_optional_user)
):
    """Get all projects (optional authentication)"""
    try:
        headers = {}
        if user:
            headers["X-User-ID"] = str(user.get("sub"))
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.PROJECT_SERVICE_URL}/projects",
                params=dict(request.query_params),
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Project service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Project service unavailable"
        )

@router.post("")
async def create_project(
    request: Request,
    user: dict = Depends(verify_token)
):
    """Create new project (requires authentication)"""
    try:
        body = await request.json()
        headers = {"X-User-ID": str(user.get("sub"))}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.PROJECT_SERVICE_URL}/projects",
                json=body,
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Project service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Project service unavailable"
        )

@router.get("/{project_id}")
async def get_project(
    project_id: int,
    user: dict = Depends(get_optional_user)
):
    """Get single project by ID"""
    try:
        headers = {}
        if user:
            headers["X-User-ID"] = str(user.get("sub"))
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.PROJECT_SERVICE_URL}/projects/{project_id}",
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Project service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Project service unavailable"
        )

@router.put("/{project_id}")
async def update_project(
    project_id: int,
    request: Request,
    user: dict = Depends(verify_token)
):
    """Update project (requires authentication)"""
    try:
        body = await request.json()
        headers = {"X-User-ID": str(user.get("sub"))}
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{settings.PROJECT_SERVICE_URL}/projects/{project_id}",
                json=body,
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Project service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Project service unavailable"
        )

@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    user: dict = Depends(verify_token)
):
    """Delete project (requires authentication)"""
    try:
        headers = {"X-User-ID": str(user.get("sub"))}
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{settings.PROJECT_SERVICE_URL}/projects/{project_id}",
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Project service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Project service unavailable"
        )

@router.post("/{project_id}/apply")
async def apply_to_project(
    project_id: int,
    request: Request,
    user: dict = Depends(verify_token)
):
    """Apply to project (requires authentication)"""
    try:
        body = await request.json()
        headers = {"X-User-ID": str(user.get("sub"))}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.PROJECT_SERVICE_URL}/projects/{project_id}/apply",
                json=body,
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Project service connection_error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Project service unavailable"
        )

@router.get("/recommendations")
async def get_recommendations(
    user: dict = Depends(verify_token)
):
    """Get project recommendations for user"""
    try:
        headers = {"X-User-ID": str(user.get("sub"))}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.PROJECT_SERVICE_URL}/projects/recommendations",
                headers=headers,
                timeout=settings.REQUEST_TIMEOUT
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except httpx.RequestError as e:
        logger.error(f"Project service connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Project service unavailable"
        )
