from datetime import date
from typing import Optional, List

from pydantic import BaseModel
from pydantic import EmailStr, Field, HttpUrl


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

# 🔹 Education Schema
class EducationBase(BaseModel):
    institution: str = Field(..., max_length=255)
    degree: str = Field(..., max_length=255)
    start_year: date
    end_year: Optional[date] = None # ✅ May be empty if education is ongoing
    field_of_study: Optional[str] = Field(None, max_length=255)
    relevant_courses: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class EducationCreate(EducationBase):
    """Schema for creating an education entry."""
    pass

class EducationUpdate(BaseModel):
    """Schema for updating an education entry."""
    institution: Optional[str] = Field(None, max_length=255)
    degree: Optional[str] = Field(None, max_length=255)
    start_year: Optional[date] = None
    end_year: Optional[date] = None
    field_of_study: Optional[str] = Field(None, max_length=255)
    relevant_courses: Optional[str] = None
    description: Optional[str] = None
    
class EducationOut(BaseModel):
    id: int  # ✅ Ensure `id` is included
    institution: str
    degree: str
    field_of_study: Optional[str] = None  # Make field_of_study optional
    start_year: date
    end_year: Optional[date] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True  # ✅ FIXED: Use `from_attributes` to support ORM conversion
        
# 🔹 Experience Schema
class ExperienceBase(BaseModel):
    company: str = Field(..., max_length=255)
    role: str = Field(..., max_length=255)
    # 4. Заменяем _year на _date
    start_year: date
    end_year: Optional[date] = None # Дата может быть None, если работа продолжается
    # 5. Добавляем новое поле
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ExperienceCreate(ExperienceBase):
    """Schema for creating an experience entry."""
    pass

class ExperienceUpdate(BaseModel):
    """Схема для ОБНОВЛЕНИЯ записи об опыте (все поля опциональны)."""
    company: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, max_length=255)
    start_year: Optional[date] = None
    end_year: Optional[date] = None
    description: Optional[str] = None
    
class ExperienceOut(ExperienceBase):
    id: int
    # company: str
    # role: str
    # start_year: int
    # end_year: Optional[int]  # ✅ May be empty if job is ongoing

    class Config:
        from_attributes = True  # ✅ FIXED: Use `from_attributes` to support ORM conversion

class UserBase(BaseModel):
    """Общие поля пользователей (используется для Create/Update)."""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    github: Optional[str] = Field(None, max_length=255)
    linkedin: Optional[str] = Field(None, max_length=255)
    telegram: Optional[str] = Field(None, max_length=255)
    # avatar_url: Optional[HttpUrl] = None  # ✅ NEW: URL for profile picture

class UserCreate(UserBase):
    """Схема для регистрации пользователя."""
    password: str = Field(..., min_length=6)

class UserUpdate(UserBase):
    """Схема для обновления данных пользователя."""
    avatar_url: Optional[str] = Field(None, max_length=500)  # Добавлено URL аватара
    status: Optional[str] = Field(None, max_length=100)  # Добавлено поле статуса

class AvatarUpdate(BaseModel):
    """Схема для обновления аватара пользователя."""
    avatar_url: str = Field(..., max_length=500)

class StatusUpdate(BaseModel):
    """Схема для обновления статуса пользователя."""
    status: str = Field(..., max_length=100)

class BasicInfoUpdate(BaseModel):
    """Схема для обновления основной информации пользователя."""
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)

class SocialLinksUpdate(BaseModel):
    """Схема для обновления социальных ссылок пользователя."""
    github: Optional[str] = Field(None, max_length=255)
    linkedin: Optional[str] = Field(None, max_length=255)
    telegram: Optional[str] = Field(None, max_length=255)
    
    class Config:
        # Схема будет принимать пустые строки
        extra = "ignore"

class ContactInfoUpdate(BaseModel):
    """Схема для обновления контактной информации пользователя."""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, max_length=50, min_length=3)

class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    position: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    telegram: Optional[str] = None
    avatar_url: Optional[str] = None  # ✅ Add this field
    skills: List[SkillBase] = []
    projects: List[ProjectBase] = []
    education: List[EducationOut] = []
    experience: List[ExperienceOut] = []
    status: Optional[str] = None 
    
    @classmethod
    def from_orm(cls, user):
        return cls(
            id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            city=user.city,
            position=user.position,
            github=user.github,
            linkedin=user.linkedin,
            telegram=user.telegram,
            avatar_url=user.avatar_url,  # ✅ Now frontend gets avatar
            skills=[SkillBase.model_validate(skill) for skill in user.skills],
            projects=[ProjectBase.model_validate(project) for project in user.projects],
            education=[EducationOut.model_validate(edu) for edu in user.education],
            experience=[ExperienceOut.model_validate(exp) for exp in user.experience],
            status=getattr(user, 'status', None) 
        )

    class Config:
        from_attributes = True

class UserOutWithToken(UserOut):
    """Схема для возвращения пользователя с токеном доступа"""
    access_token: str
    token_type: str