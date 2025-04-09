from pydantic import BaseModel
from typing import List

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class TagOut(TagBase):
    id: int

    class Config:
        from_attributes = True
