"""
Сервис для управления командами (teams): создание, обновление, удаление команд.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.team_repository import TeamRepository
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut
from app.models.user import User

class TeamService:
    @staticmethod
    def create_team(team_data: TeamCreate, db: Session, current_user: User) -> TeamOut:
        """Создать новую команду с текущим пользователем как лидером."""
        repo = TeamRepository(db)
        existing_team = repo.get_team_by_name(team_data.name)
        if existing_team:
            raise HTTPException(status_code=400, detail="Команда с таким названием уже существует.")
        new_team = repo.create_team(team_data.name, team_data.description, current_user.id)
        return TeamOut.model_validate(new_team)

    @staticmethod
    def get_all_teams(db: Session) -> list[TeamOut]:
        """Получить все команды."""
        repo = TeamRepository(db)
        teams = repo.get_all_teams()
        return [TeamOut.model_validate(team) for team in teams]

    @staticmethod
    def get_team_by_id(team_id: int, db: Session) -> TeamOut:
        """Получить команду по ID."""
        repo = TeamRepository(db)
        team = repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Команда не найдена")
        return TeamOut.model_validate(team)

    @staticmethod
    def update_team(team_id: int, team_data: TeamUpdate, db: Session, current_user: User) -> TeamOut:
        """Обновить команду (только для лидера)."""
        repo = TeamRepository(db)
        team = repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Команда не найдена")
        if team.leader_id != current_user.id:
            raise HTTPException(status_code=403, detail="Только лидер может обновлять команду")
        updated_team = repo.update_team(team_id, team_data.name, team_data.description)
        return TeamOut.model_validate(updated_team)

    @staticmethod
    def delete_team(team_id: int, db: Session, current_user: User) -> None:
        """Удалить команду (только для лидера)."""
        repo = TeamRepository(db)
        team = repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Команда не найдена")
        if team.leader_id != current_user.id:
            raise HTTPException(status_code=403, detail="Только лидер может удалять команду")
        repo.delete_team(team_id)

    @staticmethod
    def remove_member(team_id: int, user_id: int, db: Session, current_user: User) -> None:
        """Удалить участника из команды (только для лидера)."""
        repo = TeamRepository(db)
        team = repo.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Команда не найдена")
        if team.leader_id != current_user.id:
            raise HTTPException(status_code=403, detail="Только лидер может удалять участников")
        if not repo.is_member_of_team(team_id, user_id):
            raise HTTPException(status_code=404, detail="Участник не найден в команде")
        repo.remove_member_from_team(team_id, user_id)