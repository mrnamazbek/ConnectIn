"""
API Gateway - Main Entry Point for ConnectIn Microservices
Handles routing, authentication verification, and request forwarding
"""
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional
import logging

from app.middleware.auth import verify_token
from app.routes import auth_routes, project_routes, notification_routes
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ConnectIn API Gateway",
    description="Central API Gateway for ConnectIn microservices",
    version="2.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(project_routes.router, prefix="/projects", tags=["Projects"])
app.include_router(notification_routes.router, prefix="/notifications", tags=["Notifications"])

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "api-gateway",
        "version": "2.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """API Gateway root endpoint"""
    return {
        "message": "ConnectIn API Gateway",
        "version": "2.0.0",
        "docs": "/docs",
        "services": {
            "auth": "/auth",
            "projects": "/projects",
            "notifications": "/notifications"
        }
    }

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
