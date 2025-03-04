from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.post import Post
from app.models.team import Team
from app.models.tag import Tag
from app.schemas.post import PostCreate, PostOut
from app.utils.logger import get_logger

logger = get_logger(__name__)

class PostService:
    @staticmethod
    def create_post(post_data: PostCreate, user_id: int, db: Session) -> PostOut:
        """Создаёт новый пост с тегами."""
        if post_data.post_type not in ["news", "project", "team"]:
            raise HTTPException(status_code=400, detail="Неверный тип поста.")

        new_post = Post(
            title=post_data.title,
            content=post_data.content,
            post_type=post_data.post_type,
            author_id=user_id if post_data.post_type != "team" else None
        )

        if post_data.post_type == "team":
            team = db.query(Team).filter(Team.id == post_data.team_id).first()
            if not team:
                raise HTTPException(status_code=404, detail="Команда не найдена.")
            new_post.team_id = team.id

        if post_data.tag_ids:
            tags = db.query(Tag).filter(Tag.id.in_(post_data.tag_ids)).all()
            if not tags:
                raise HTTPException(status_code=400, detail="Неверные теги.")
            new_post.tags = tags

        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        logger.info(f"Пост создан: {new_post.id}")
        return PostOut.model_validate(new_post)

    @staticmethod
    def get_all_posts(db: Session) -> List[PostOut]:
        """Возвращает все посты с автором и тегами."""
        posts = db.query(Post).all()
        return [PostOut.model_validate(post) for post in posts]

    @staticmethod
    def get_user_posts(user_id: int, db: Session) -> List[PostOut]:
        """Возвращает посты конкретного пользователя."""
        posts = db.query(Post).filter(Post.author_id == user_id).all()
        return [PostOut.model_validate(post) for post in posts]

    @staticmethod
    def delete_post(post_id: int, user_id: int, db: Session) -> None:
        """Удаляет пост, если пользователь — автор."""
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Пост не найден")
        if post.author_id != user_id:
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        db.delete(post)
        db.commit()
        logger.info(f"Пост удалён: {post_id}")