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
    Возвращает **пользователя + навыки + проекты + образование + опыт**.
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
    skills: List[SkillBase] = []
    projects: List[ProjectBase] = []
    education: List[EducationOut] = []  # ✅ Ensure Pydantic `EducationOut` is used
    experience: List[ExperienceOut] = []  # ✅ Ensure Pydantic `ExperienceOut` is used

    @classmethod
    def from_orm(cls, user):
        """ ✅ Convert SQLAlchemy objects to Pydantic models manually. """
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
            skills=[SkillBase.from_orm(skill) for skill in user.skills],
            projects=[ProjectBase.from_orm(project) for project in user.projects],
            education=[EducationOut.from_orm(edu) for edu in user.education],  # ✅ FIXED
            experience=[ExperienceOut.from_orm(exp) for exp in user.experience]  # ✅ FIXED
        )

    class Config:
        from_attributes = True  # ✅ Fix ORM issue