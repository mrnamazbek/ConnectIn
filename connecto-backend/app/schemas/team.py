"""
team.py:
Pydantic-схемы для операций с командами:
- TeamBase: общие поля (name, description)
- TeamCreate: что нужно для создания
- TeamUpdate: поля, которые можно обновлять
- TeamOut: выводимые данные о команде
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from .user import UserOut  # Если хотим видеть список участников

class TeamBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None


class TeamCreate(TeamBase):
    """
    Схема для создания команды.
    Можно добавить любые специфические поля, например leader_id.
    """
    pass


class TeamUpdate(BaseModel):
    """
    Схема обновления данных команды.
    """
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class TeamOut(TeamBase):
    """
    Вывод информации о команде.
    Список участников можно добавить, если нужно.
    """
    id: int
    members: List[UserOut] = Field(default_factory=list)

    class Config:
        orm_mode = True
