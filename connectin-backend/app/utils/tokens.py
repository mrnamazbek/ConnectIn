"""
Здесь мы создаём уникальный refresh-токен, сохраняем его в Redis с указанным временем жизни,
а затем можем проверить или удалить его. Это обеспечивает безопасность и позволяет обновлять JWT
токены без необходимости повторного входа.
"""

import uuid
from datetime import timedelta, datetime
import json
from app.utils.redis_client import get_redis

# Функция для создания нового refresh-токена и сохранения его в Redis
async def create_refresh_token(user_id: str, expires_in: int = 60 * 60 * 24 * 7) -> str:
    """
    Создает refresh-токен, сохраняет его в Redis и возвращает токен.
    expires_in - время жизни токена в секундах (по умолчанию 7 дней).
    """
    token = str(uuid.uuid4())
    expiration = datetime.utcnow() + timedelta(seconds=expires_in)
    redis = await get_redis()
    # Сохраняем токен с данными (например, user_id) в формате JSON
    await redis.setex(f"refresh:{token}", expires_in, json.dumps({"user_id": user_id, "exp": expiration.isoformat()}))
    return token

# Функция для проверки и получения данных refresh-токена
async def verify_refresh_token(token: str) -> dict:
    redis = await get_redis()
    data = await redis.get(f"refresh:{token}")

    if not data:
        return None

    token_data = json.loads(data)

    # Проверяем срок действия
    expiration = datetime.fromisoformat(token_data["exp"])
    if datetime.utcnow() > expiration:
        await delete_refresh_token(token)
        return None

    # Дополнительная проверка формата
    if "user_id" not in token_data:
        await delete_refresh_token(token)
        return None

    return token_data

# Функция для удаления refresh-токена (например, при logout)
async def delete_refresh_token(token: str) -> None:
    redis = await get_redis()
    await redis.delete(f"refresh:{token}")
