"""
Auth Service - Authentication and Authorization
Handles user registration, login, JWT tokens, and OAuth
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.database import get_db, engine
from app import models, schemas
from app.services import auth_service
from app.config import settings

# Create tables
models.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ConnectIn Auth Service",
    description="Authentication and user management service",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "auth-service"}

# Registration
@app.post("/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    logger.info(f"Registration attempt for email: {user.email}")
    
    # Check if user exists
    existing_user = auth_service.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    new_user = auth_service.create_user(db, user)
    logger.info(f"User registered successfully: {new_user.id}")
    
    return new_user

# Login
@app.post("/auth/login", response_model=schemas.TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token"""
    logger.info(f"Login attempt for username: {form_data.username}")
    
    # Authenticate user
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = auth_service.create_access_token(data={"sub": str(user.id)})
    refresh_token = auth_service.create_refresh_token(data={"sub": str(user.id)})
    
    logger.info(f"User logged in successfully: {user.id}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

# Refresh token
@app.post("/auth/refresh", response_model=schemas.TokenResponse)
async def refresh_token(token_data: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token"""
    try:
        # Verify refresh token
        payload = auth_service.verify_token(token_data.refresh_token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user
        user = auth_service.get_user_by_id(db, int(user_id))
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create new tokens
        access_token = auth_service.create_access_token(data={"sub": str(user.id)})
        refresh_token = auth_service.create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Get current user
@app.get("/auth/me", response_model=schemas.UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    try:
        payload = auth_service.verify_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = auth_service.get_user_by_id(db, int(user_id))
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Google OAuth (placeholder - implement with Authlib)
@app.get("/auth/google")
async def google_auth():
    """Initiate Google OAuth flow"""
    # TODO: Implement with Authlib
    return {"message": "Google OAuth not yet implemented"}

@app.get("/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    # TODO: Exchange code for tokens, create/login user
    return {"message": "Google OAuth callback"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
