from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from app.enums import ApplicationStatus

class ApplicationDecisionRequest(BaseModel):
    decision: ApplicationStatus

class ProjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    """
    Схема для создания проекта.
    Добавлены теги и навыки.
    """
    tag_ids: List[int] = []  # ✅ IDs of selected tags
    skill_ids: List[int] = []  # ✅ IDs of required skills


class ProjectUpdate(BaseModel):
    """
    Схема обновления проекта.
    """
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    tag_ids: List[int] = []  # ✅ Allow updating tags
    skill_ids: List[int] = []  # ✅ Allow updating skills


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    owner_id: int
    members: List[Dict] = []  # ✅ List of member details
    applicants: List[Dict] = []  # ✅ List of applicants
    tags: List[Dict] = []  # ✅ Convert tags to dictionary
    skills: List[Dict] = []  # ✅ Convert skills to dictionary

    @classmethod
    def from_orm(cls, project):
        """ ✅ Convert SQLAlchemy objects to Pydantic dictionaries manually """
        return cls(
            id=project.id,
            name=project.name,
            description=project.description,
            owner_id=project.owner_id,
            members=[{"id": user.id, "username": user.username} for user in project.members],
            applicants=[{"id": user.id, "username": user.username} for user in project.applicants],
            tags=[{"id": tag.id, "name": tag.name} for tag in project.tags],  # ✅ Convert tags to dict
            skills=[{"id": skill.id, "name": skill.name} for skill in project.skills]  # ✅ Convert skills to dict
        )

    class Config:
        from_attributes = True  # ✅ Fix ORM conversion issue
