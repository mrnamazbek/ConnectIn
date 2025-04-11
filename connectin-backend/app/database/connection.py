# app/database/connection.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator

from app.core.config import settings

engine = create_engine(
    str(settings.DATABASE_URL),
    pool_size=20,
    max_overflow=30,
    pool_timeout=60,
    pool_recycle=1800,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

Base = declarative_base()

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
