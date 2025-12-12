from pydantic import BaseModel

class VoteOut(BaseModel):
    user_id: int
    project_id: int
    is_upvote: bool
