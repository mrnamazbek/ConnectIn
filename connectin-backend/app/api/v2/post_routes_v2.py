from fastapi import APIRouter, Depends
from typing import List
from app.database.connection import get_db
from app.api.v1.auth import get_current_user
from app.schemas.post import PostCreate, PostOut
from app.services.post_service import PostService

router = APIRouter()

@router.post("/", response_model=PostOut)
def create_post(post_data: PostCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return PostService.create_post(post_data, current_user.id, db)

@router.get("/", response_model=List[PostOut])
def get_all_posts(db=Depends(get_db)):
    return PostService.get_all_posts(db)

@router.get("/my", response_model=List[PostOut])
def get_user_posts(current_user=Depends(get_current_user), db=Depends(get_db)):
    return PostService.get_user_posts(current_user.id, db)

@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    PostService.delete_post(post_id, current_user.id, db)
    return {"message": "Пост удалён"}