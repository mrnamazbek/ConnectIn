"""
Сервис для управления командами (teams): создание, обновление, удаление команд.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.team_repository import TeamRepository
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut

class TeamService:
    @staticmethod
    def create_team(team_data: TeamCreate, db: Session) -> TeamOut:
        """Создать новую команду."""
        repo = TeamRepository(db)
        existing_team = repo.get_team_by_name(team_data.name)
        if existing_team:
            raise HTTPException(status_code=400, detail="Команда с таким названием уже существует.")
        new_team = repo.create_team(team_data.name, team_data.description)
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
            return None
        return TeamOut.model_validate(team)

    @staticmethod
    def update_team(team_id: int, team_data: TeamUpdate, db: Session) -> TeamOut:
        """Обновить команду."""
        repo = TeamRepository(db)
        team = repo.update_team(team_id, team_data.name, team_data.description)
        if not team:
            raise HTTPException(status_code=404, detail="Команда не найдена")
        return TeamOut.model_validate(team)

    @staticmethod
    def delete_team(team_id: int, db: Session) -> None:
        """Удалить команду."""
        repo = TeamRepository(db)
        if not repo.delete_team(team_id):
            raise HTTPException(status_code=404, detail="Команда не найдена")