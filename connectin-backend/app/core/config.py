import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Stores application settings. Pydantic automatically reads environment variables.
    """

    # ✅ Load from .env file
    DATABASE_URL: str
    SECRET_KEY: str

    class Config:
        env_file = ".env"  # Load from .env
        env_file_encoding = "utf-8"

settings = Settings()
