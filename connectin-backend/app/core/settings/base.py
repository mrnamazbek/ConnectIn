from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Общие настройки
    class Config:
        env_file = '.env'
