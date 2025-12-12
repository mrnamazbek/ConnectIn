from pydantic import BaseModel
from app.schemas.user import UserOut  # Это модель пользователя, которая у вас уже есть

class TokenResponse(BaseModel):
    access_token: str  # Токен доступа
    refresh_token: str  # Токен обновления
    token_type: str   # Тип токена
    user: UserOut     # Данные пользователя