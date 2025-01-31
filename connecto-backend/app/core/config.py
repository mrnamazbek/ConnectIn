# app/core/config.py

import os
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Класс для хранения настроек приложения.
    Pydantic автоматически считывает переменные окружения,
    а также позволяет задавать значения по умолчанию.
    """

    # Пример: URL базы данных
    DATABASE_URL: str = "postgresql://didar:postgres@localhost:5432/connectin"

    # Пример: секретный ключ (используется для JWT, шифрования)
    SECRET_KEY: str = "SUPERSECRET123"

    # Дополнительно можно указать другие переменные окружения,
    # например, DEBUG, ALLOWED_HOSTS, SMTP и т.д.

    class Config:
        # Для загрузки из файла .env (если нужен)
        env_file = ".env"
        env_file_encoding = "utf-8"


# Создаём экземпляр Settings, к которому можно обращаться по всему проекту
settings = Settings()
