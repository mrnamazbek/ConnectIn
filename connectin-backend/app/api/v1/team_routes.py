from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut
from app.services.team_service import TeamService
from app.models.user import User
from app.api.v1.auth_router import get_current_user
from app.database.connection import get_db

router = APIRouter(prefix="/teams", tags=["teams"])

@router.post("/", response_model=TeamOut, summary="Создать новую команду")
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создает новую команду и назначает текущего пользователя лидером."""
    return TeamService.create_team(team_data, db, current_user)

@router.get("/", response_model=list[TeamOut], summary="Получить все команды")
def get_all_teams(db: Session = Depends(get_db)):
    """Возвращает список всех команд."""
    return TeamService.get_all_teams(db)

@router.get("/{team_id}", response_model=TeamOut, summary="Получить команду по ID")
def get_team(team_id: int, db: Session = Depends(get_db)):
    """Возвращает данные команды по её ID."""
    team = TeamService.get_team_by_id(team_id, db)
    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")
    return team

@router.put("/{team_id}", response_model=TeamOut, summary="Обновить команду")
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновляет данные команды. Доступно только лидеру."""
    return TeamService.update_team(team_id, team_data, db, current_user)

@router.delete("/{team_id}", summary="Удалить команду")
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаляет команду. Доступно только лидеру."""
    TeamService.delete_team(team_id, db, current_user)
    return {"detail": "Команда удалена"}

@router.delete("/{team_id}/members/{user_id}", summary="Удалить участника из команды")
def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаляет участника из команды. Доступно только лидеру."""
    TeamService.remove_member(team_id, user_id, db, current_user)
    return {"detail": "Участник удалён из команды"}