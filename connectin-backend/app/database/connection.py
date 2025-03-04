# app/database/connection.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator

from app.core.settings.config import settings

# Создаём движок SQLAlchemy, используя настройки из config
engine = create_engine(
    str(settings.DATABASE_URL),  # из Settings
    echo=False,             # echo=True для отладки, пишет SQL в консоль
    future=True             # API SQLAlchemy 2.0
)

# создаём фабрику сессий
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

def get_db() -> Generator:
    """
    Функция-зависимость (dependency) для FastAPI.
    Генерирует и затем закрывает сессию для каждого запроса.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
