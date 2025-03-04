# app/repositories/base_repository.py
from sqlalchemy.orm import Session


class BaseRepository:
    def __init__(self, model):
        self.model = model

    def get(self, db: Session, id: int):
        return db.query(self.model).get(id)

    # Общие методы для всех репозиториев