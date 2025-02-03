from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional, List

class SkillBase(BaseModel):
    """Схема навыков, возвращаемая в API."""
    id: int
    name: str

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    """Схема проекта, возвращаемая в API."""
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Общие поля пользователей (Create/Update)."""
    email: EmailStr
    username: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    github: Optional[HttpUrl] = None
    linkedin: Optional[HttpUrl] = None
    telegram: Optional[HttpUrl] = None  # ✅ Fix type


class UserCreate(UserBase):
    """Схема для регистрации пользователя."""
    password: str = Field(..., min_length=6)


class UserUpdate(UserBase):
    """Схема для обновления данных пользователя."""
    pass  # ✅ No need to redefine fields


class UserOut(BaseModel):
    """
    Возвращает **пользователя + навыки + проекты**.
    """
    id: int
    email: EmailStr
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    position: Optional[str] = None
    github: Optional[HttpUrl] = None
    linkedin: Optional[HttpUrl] = None
    telegram: Optional[HttpUrl] = None
    skills: List[SkillBase] = []  # ✅ Ensure it returns an empty list
    projects: List[ProjectBase] = []  # ✅ Ensure it returns an empty list

    class Config:
        from_attributes = True  
