"""
Репозиторий для работы с таблицей пользователей.
"""

from sqlalchemy.orm import Session
from app.models.user import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str):
        """Находит пользователя по email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str):
        """Находит пользователя по имени пользователя."""
        return self.db.query(User).filter(User.username == username).first()

    def create_user(self, username: str, email: str, hashed_password: str = None, google_id: str = None, github: str = None):
        """Создаёт нового пользователя."""
        new_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            google_id=google_id,
            github=github
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user