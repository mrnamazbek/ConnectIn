"""
Configuration settings for API Gateway
"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Service URLs
    AUTH_SERVICE_URL: str = "http://auth-service:8001"
    PROJECT_SERVICE_URL: str = "http://project-service:8002"
    NOTIFICATION_SERVICE_URL: str = "http://notification-service:8003"
    
    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://connectin.vercel.app",
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Timeout
    REQUEST_TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
