from pydantic import BaseModel
from typing import Optional, List

class PostBase(BaseModel):
    title: str
    content: str
    post_type: str  # "news", "project", "team"

class PostCreate(PostBase):
    project_id: Optional[int] = None
    team_id: Optional[int] = None
    skill_ids: List[int] = []  # Only for team posts
    tag_ids: List[int] = []  # Only for project posts

class PostOut(PostBase):
    id: int
    author_id: Optional[int] = None
    project_id: Optional[int] = None
    team_id: Optional[int] = None
    skills: List[str] = []
    tags: List[str] = []  # ✅ Expecting tag names instead of `Tag` objects

    class Config:
        orm_mode = True

    @classmethod
    def from_orm(cls, obj):
        """Convert SQLAlchemy object to Pydantic schema with tag names"""
        return cls(
            id=obj.id,
            title=obj.title,
            content=obj.content,
            post_type=obj.post_type,
            author_id=obj.author_id,
            project_id=obj.project_id,
            team_id=obj.team_id,
            skills=[skill.name for skill in obj.skills],
            tags=[tag.name for tag in obj.tags]  # ✅ Extract tag names
        )
