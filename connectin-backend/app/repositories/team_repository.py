"""
Репозиторий для работы с таблицей команд (Team) в базе данных.
"""

from sqlalchemy.orm import Session
from app.models.team import Team

class TeamRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_teams(self):
        """Получить все команды."""
        return self.db.query(Team).all()

    def get_team_by_id(self, team_id: int):
        """Получить команду по ID."""
        return self.db.query(Team).filter(Team.id == team_id).first()

    def get_team_by_name(self, name: str):
        """Получить команду по названию."""
        return self.db.query(Team).filter(Team.name == name).first()

    def create_team(self, name: str, description: str):
        """Создать новую команду."""
        new_team = Team(name=name, description=description)
        self.db.add(new_team)
        self.db.commit()
        self.db.refresh(new_team)
        return new_team

    def update_team(self, team_id: int, name: str, description: str):
        """Обновить команду."""
        team = self.get_team_by_id(team_id)
        if team:
            if name is not None:
                team.name = name
            if description is not None:
                team.description = description
            self.db.commit()
            self.db.refresh(team)
        return team

    def delete_team(self, team_id: int):
        """Удалить команду."""
        team = self.get_team_by_id(team_id)
        if team:
            self.db.delete(team)
            self.db.commit()
            return True
        return False