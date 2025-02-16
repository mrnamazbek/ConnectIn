import aioredis
from app.core.config import settings

# Функция для создания подключения к Redis
async def get_redis() -> aioredis.Redis:
    return await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
