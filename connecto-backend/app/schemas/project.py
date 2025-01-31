"""
project.py:
Схемы для CRUD-операций над проектами:
- ProjectBase: общие поля (name, description)
- ProjectCreate: поля, нужные при создании
- ProjectUpdate: поля, которые можно менять
- ProjectOut: ответ API с дополнительными данными (список участников, рейтинг и т.д.)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
# from .user import UserOut  # Если нужно выводить владельца
# from .skill import SkillOut # Если нужно выводить навыки

class ProjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    """
    Схема для создания проекта.
    Можно добавить поля: owner_id, список skills (IDs), срок и т.д.
    """
    pass


class ProjectUpdate(BaseModel):
    """
    Схема обновления проекта.
    """
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None


class ProjectOut(ProjectBase):
    """
    Отображаем проект в ответе API.
    """
    id: int
    # skills: List[SkillOut] = [] # если нужно подтягивать навыки
    # owner: Optional[UserOut] = None

    class Config:
        orm_mode = True
