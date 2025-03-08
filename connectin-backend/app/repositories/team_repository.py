"""
Репозиторий для работы с таблицей команд (Team) в базе данных.
"""

from sqlalchemy.orm import Session
from app.models.team import Team
from app.models.relations.associations import user_teams_association

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

    def create_team(self, name: str, description: str, leader_id: int):
        """Создать новую команду с указанным лидером."""
        new_team = Team(name=name, description=description, leader_id=leader_id)
        self.db.add(new_team)
        self.db.commit()
        self.db.refresh(new_team)
        # Add leader as a member
        self.add_member_to_team(new_team.id, leader_id)
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

    def add_member_to_team(self, team_id: int, user_id: int):
        """Добавить пользователя в команду."""
        self.db.execute(
            user_teams_association.insert().values(user_id=user_id, team_id=team_id)
        )
        self.db.commit()

    def remove_member_from_team(self, team_id: int, user_id: int):
        """Удалить пользователя из команды."""
        self.db.execute(
            user_teams_association.delete().where(
                user_teams_association.c.user_id == user_id,
                user_teams_association.c.team_id == team_id
            )
        )
        self.db.commit()

    def is_member_of_team(self, team_id: int, user_id: int):
        """Проверить, состоит ли пользователь в команде."""
        return self.db.query(user_teams_association).filter(
            user_teams_association.c.user_id == user_id,
            user_teams_association.c.team_id == team_id
        ).first() is not None