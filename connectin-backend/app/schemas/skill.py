from pydantic import BaseModel
from typing import List

class SkillBase(BaseModel):
    name: str

class SkillCreate(SkillBase):
    pass

class SkillOut(SkillBase):
    id: int

    class Config:
        from_attributes = True
