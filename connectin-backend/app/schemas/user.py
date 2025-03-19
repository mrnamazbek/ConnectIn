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

# 🔹 Education Schema
class EducationBase(BaseModel):
    institution: str = Field(..., max_length=255)
    degree: str = Field(..., max_length=255)
    start_year: int
    end_year: Optional[int]  # ✅ May be empty if education is ongoing

    class Config:
        from_attributes = True

class EducationCreate(EducationBase):
    """Schema for creating an education entry."""
    pass

class EducationUpdate(BaseModel):
    """Schema for updating an education entry."""
    institution: Optional[str] = Field(None, max_length=255)
    degree: Optional[str] = Field(None, max_length=255)
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    
class EducationOut(BaseModel):
    id: int  # ✅ Ensure `id` is included
    institution: str
    degree: str
    start_year: int
    end_year: Optional[int]
    
    class Config:
        from_attributes = True  # ✅ FIXED: Use `from_attributes` to support ORM conversion
        
# 🔹 Experience Schema
class ExperienceBase(BaseModel):
    company: str = Field(..., max_length=255)
    role: str = Field(..., max_length=255)
    start_year: int
    end_year: Optional[int]  # ✅ May be empty if job is ongoing

    class Config:
        from_attributes = True

class ExperienceCreate(ExperienceBase):
    """Schema for creating an experience entry."""
    pass

class ExperienceUpdate(BaseModel):
    """Schema for updating an experience entry."""
    company: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, max_length=255)
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    
class ExperienceOut(BaseModel):
    id: int
    company: str 
    role: str 
    start_year: int
    end_year: Optional[int]  # ✅ May be empty if job is ongoing

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
    github: Optional[HttpUrl] = None
    linkedin: Optional[HttpUrl] = None
    telegram: Optional[HttpUrl] = None
    # avatar_url: Optional[HttpUrl] = None  # ✅ NEW: URL for profile picture

class UserCreate(UserBase):
    """Схема для регистрации пользователя."""
    password: str = Field(..., min_length=6)

class UserUpdate(UserBase):
    """Схема для обновления данных пользователя."""
    pass  # ✅ Inherits all fields from UserBase

class UserOut(BaseModel):
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
    avatar_url: Optional[str] = None  # ✅ Add this field
    skills: List[SkillBase] = []
    projects: List[ProjectBase] = []
    education: List[EducationOut] = []
    experience: List[ExperienceOut] = []

    status: str  # project status

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
            experience=[ExperienceOut.model_validate(exp) for exp in user.experience]
        )

    class Config:
        from_attributes = True