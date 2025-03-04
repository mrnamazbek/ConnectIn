from pydantic import BaseModel 

class LikeOut(BaseModel):
    user_id: int
    news_id: int
