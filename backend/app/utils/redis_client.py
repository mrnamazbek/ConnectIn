from typing import Any, AsyncGenerator

import aioredis
from aioredis import Redis
from fastapi import HTTPException

from app.core.config import settings
from contextlib import asynccontextmanager

from app.utils.logger import get_logger

logger = get_logger()

# Создаем пул подключений
redis_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=20  # 🔹 Ограничиваем число подключений
)

@asynccontextmanager
async def get_redis() -> AsyncGenerator[Redis, Any]:
    """
    Контекстный менеджер для безопасного использования Redis.
    Автоматически возвращает соединение в пул.
    """
    try:
        async with aioredis.Redis(connection_pool=redis_pool) as redis:
            yield redis
    except aioredis.RedisError as e:
        logger.error(f"Ошибка Redis: {e}")
        raise HTTPException(500, "Ошибка подключения к Redis")



"""
Что изменилось:

Добавлен пул соединений для предотвращения перегрузки.
Контекстный менеджер гарантирует корректное освобождение ресурсов.
Логирование ошибок.

"""