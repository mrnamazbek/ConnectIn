import uuid
import json
from datetime import datetime, timedelta
from typing import Optional, Dict

from app.utils.redis_client import get_redis

async def create_refresh_token(user_id: str, expires_in: int = 60 * 60 * 24 * 7) -> str:
    """
    Создаёт новый refresh-токен и сохраняет его в Redis на указанный срок.

    :param user_id: Идентификатор пользователя, для которого создаётся токен.
    :param expires_in: Время жизни токена в секундах (по умолчанию 7 дней).
    :return: Строка с уникальным идентификатором токена.
    """
    token = str(uuid.uuid4())
    expiration = datetime.now() + timedelta(seconds=expires_in)

    # Предположим, что get_redis() возвращает асинхронный клиент.
    # Если это не так, уберите 'await'.
    redis = await get_redis()

    data = {
        "user_id": user_id,
        "exp": expiration.isoformat()
    }
    # Сохраняем JSON-строку в Redis с ключом вида "refresh:{token}" и временем жизни expires_in
    await redis.setex(f"refresh:{token}", expires_in, json.dumps(data))
    return token


async def verify_refresh_token(token: str) -> Optional[Dict[str, str]]:
    """
    Проверяет, что переданный refresh-токен существует в Redis,
    не истёк по времени и содержит корректные данные.

    :param token: Строка-токен, ранее сгенерированная функцией create_refresh_token.
    :return: Словарь с данными токена (user_id, exp), либо None, если токен не валиден.
    """
    redis = await get_redis()
    data = await redis.get(f"refresh:{token}")
    if not data:
        return None

    token_data = json.loads(data)

    # Проверяем срок действия
    try:
        expiration = datetime.fromisoformat(token_data["exp"])
    except (KeyError, ValueError):
        # Если нет ключа "exp" или формат даты некорректен
        await delete_refresh_token(token)
        return None

    if datetime.now() > expiration:
        await delete_refresh_token(token)
        return None

    # Дополнительная проверка наличия user_id
    if "user_id" not in token_data:
        await delete_refresh_token(token)
        return None

    return token_data


async def delete_refresh_token(token: str) -> None:
    """
    Удаляет refresh-токен из Redis. Может использоваться при логауте
    или при выявлении невалидного токена.

    :param token: Строка-токен, который требуется удалить.
    """
    redis = await get_redis()
    await redis.delete(f"refresh:{token}")
