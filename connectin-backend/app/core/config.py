from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    FRONTEND_URL: str = Field("http://localhost:8000/docs")
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    AWS_ACCESS_KEY_ID: str = Field(..., env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(..., env="AWS_SECRET_ACCESS_KEY")
    AWS_BUCKET_NAME: str = Field(..., env="AWS_BUCKET_NAME")
    AWS_REGION: str = Field(..., env="AWS_REGION")

    GOOGLE_CLIENT_ID: str = Field(..., env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(..., env="GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = Field(..., env="GOOGLE_REDIRECT_URI")

    GITHUB_CLIENT_ID: str = Field(..., env="GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: str = Field(..., env="GITHUB_CLIENT_SECRET")
    GITHUB_REDIRECT_URI: str = Field(..., env="GITHUB_REDIRECT_URI")

    REDIS_URL: str = Field("redis://localhost:6379", env="REDIS_URL")

    ELASTICSEARCH_URL: str = Field("http://127.0.0.1:9200", env="ELASTICSEARCH_URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

settings = Settings()