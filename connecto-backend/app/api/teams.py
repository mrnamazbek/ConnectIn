"""
Этот модуль посвящён работе с командами (Team):
- Создание новой команды
- Получение списка всех команд
- Получение детальной информации об определённой команде
- Обновление команды
- Удаление команды
- Добавление/удаление участников (при необходимости)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamOut, TeamUpdate
from app.api.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=TeamOut, summary="Создать новую команду")
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создаёт новую команду. По желанию можно привязать создателя
    как "капитана" или "админа".
    """
    # Проверка уникальности названия команды или других условий - по желанию
    existing_team = db.query(Team).filter(Team.name == team_data.name).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Команда с таким названием уже существует."
        )

    new_team = Team(
        name=team_data.name,
        description=team_data.description,
        # Если хотите привязать создателя как капитана, можно добавить team.leader_id = current_user.id
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


@router.get("/", response_model=List[TeamOut], summary="Получить список всех команд")
def read_teams(db: Session = Depends(get_db)):
    """
    Возвращает список всех команд в базе.
    Можно добавить фильтры и пагинацию, если нужно.
    """
    teams = db.query(Team).all()
    return teams


@router.get("/{team_id}", response_model=TeamOut, summary="Получить данные конкретной команды")
def read_team(team_id: int, db: Session = Depends(get_db)):
    """
    Детальная информация по команде.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Команда не найдена."
        )
    return team


@router.put("/{team_id}", response_model=TeamOut, summary="Обновить команду")
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет данные о команде (название, описание).
    Предположим, что изменить команду может только "владелец" или лидер, если это предусмотрено логикой.
    Для MVP-проекта можно упростить и разрешить редактирование всем.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")

    # Если у вас есть лидер/owner, проверяем, что current_user.id == team.leader_id
    # Иначе, возвращаем 403
    # if team.leader_id != current_user.id:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="У вас нет прав на редактирование этой команды."
    #     )

    if team_data.name is not None:
        team.name = team_data.name
    if team_data.description is not None:
        team.description = team_data.description

    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", summary="Удалить команду")
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удаление команды.
    Снова же, в реальных проектах нужно ограничивать,
    кто может удалять команду (лидер/админ/суперпользователь).
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")

    # Аналогично проверка на права:
    # if team.leader_id != current_user.id:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="У вас нет прав на удаление этой команды."
    #     )

    db.delete(team)
    db.commit()
    return {"detail": "Команда успешно удалена"}
