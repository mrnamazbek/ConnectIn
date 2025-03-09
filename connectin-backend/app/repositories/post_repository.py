"""
Этот файл будет работать с постами: создавать их, получать, удалять.

Что тут делает каждая функция?

create_post — создаёт новый пост и сохраняет его в базе.
get_all_posts — возвращает все посты.
get_user_posts — возвращает посты конкретного пользователя.
delete_post — удаляет пост по его ID.
"""
from sqlalchemy.orm import Session
from app.models.post import Post

class PostRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_post(self, title: str, content: str, post_type: str, author_id: int):
        new_post = Post(title=title, content=content, post_type=post_type, author_id=author_id)
        self.db.add(new_post)
        self.db.commit()
        self.db.refresh(new_post)
        return new_post

    def get_all_posts(self):
        return self.db.query(Post).all()

    def get_user_posts(self, user_id: int):
        return self.db.query(Post).filter(Post.author_id == user_id).all()

    def delete_post(self, post_id: int):
        post = self.db.query(Post).filter(Post.id == post_id).first()
        if post:
            self.db.delete(post)
            self.db.commit()