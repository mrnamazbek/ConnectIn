from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.like import PostLike #NewsLike
from app.models.comment import PostComment #NewsComment
from app.models.save import SavedPost #SavedNews
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut
from app.api.auth import get_current_user

router = APIRouter()

# ✅ Like News
@router.post("/{news_id}/like")
def like_news(news_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_like = db.query(PostLike).filter_by(user_id=current_user.id, news_id=news_id).first()
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"detail": "Like removed"}
    
    new_like = PostLike(user_id=current_user.id, news_id=news_id)
    db.add(new_like)
    db.commit()
    return {"detail": "News liked"}

# ✅ Save News
@router.post("/{news_id}/save")
def save_news(news_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_save = db.query(SavedPost).filter_by(user_id=current_user.id, news_id=news_id).first()
    if existing_save:
        db.delete(existing_save)
        db.commit()
        return {"detail": "News unsaved"}

    new_save = SavedPost(user_id=current_user.id, news_id=news_id)
    db.add(new_save)
    db.commit()
    return {"detail": "News saved"}

# ✅ Comment on News
@router.post("/{news_id}/comment", response_model=CommentOut)
def comment_news(news_id: int, comment_data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_comment = PostComment(content=comment_data.content, user_id=current_user.id, news_id=news_id)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
