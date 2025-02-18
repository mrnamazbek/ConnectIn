from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn
from typing import Optional


class Settings(BaseSettings):
    # 🌍 Environment
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")

    # 🔐 Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")

    # 🛢 Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")

    # ☁️ AWS S3
    AWS_ACCESS_KEY_ID: str = Field(..., env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(..., env="AWS_SECRET_ACCESS_KEY")
    AWS_BUCKET_NAME: str = Field(..., env="AWS_BUCKET_NAME")
    AWS_REGION: str = Field(..., env="AWS_REGION")

    # 🔑 OAuth Providers
    GOOGLE_CLIENT_ID: str = Field(..., env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(..., env="GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = Field(..., env="GOOGLE_REDIRECT_URI")

    GITHUB_CLIENT_ID: str = Field(..., env="GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: str = Field(..., env="GITHUB_CLIENT_SECRET")
    GITHUB_REDIRECT_URI: str = Field(..., env="GITHUB_REDIRECT_URI")

    # 🏎 Redis Cache
    REDIS_URL: str = Field("redis://localhost:6379", env="REDIS_URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )


settings = Settings()