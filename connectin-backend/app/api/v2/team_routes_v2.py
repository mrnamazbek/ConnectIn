"""
Вторая версия API для управления командами (Team):
- Создание, обновление, удаление команд
- Получение списка команд и детальной информации о команде
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.services.team_service import TeamService
from app.schemas.team import TeamCreate, TeamOut, TeamUpdate
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=TeamOut, summary="Создать новую команду")
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Создать новую команду."""
    return TeamService.create_team(team_data, db)

@router.get("/", response_model=List[TeamOut], summary="Получить список всех команд")
def read_teams(db: Session = Depends(get_db)):
    """Получить список всех команд."""
    return TeamService.get_all_teams(db)

@router.get("/{team_id}", response_model=TeamOut, summary="Получить данные конкретной команды")
def read_team(team_id: int, db: Session = Depends(get_db)):
    """Получить данные конкретной команды."""
    team = TeamService.get_team_by_id(team_id, db)
    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")
    return team

@router.put("/{team_id}", response_model=TeamOut, summary="Обновить команду")
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Обновить команду."""
    return TeamService.update_team(team_id, team_data, db)

@router.delete("/{team_id}", summary="Удалить команду")
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Удалить команду."""
    TeamService.delete_team(team_id, db)
    return {"detail": "Команда успешно удалена"}