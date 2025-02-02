"""
auth.py:
Утилиты для хэширования паролей (hash_password) и проверки (verify_password).
Можно расширить: сюда же вынести логику JWT-токенов, если нужно.
"""
from passlib.context import CryptContext

# Настраиваем контекст passlib для использования bcrypt (или других алгоритмов)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Возвращает хэш пароля, используя bcrypt.
    Пример использования:
        hashed_pw = hash_password("mysecret")
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Сравнивает 'сырой' пароль с хэшированным.
    Возвращает True, если они совпадают.
    """
    return pwd_context.verify(plain_password, hashed_password)
