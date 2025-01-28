"""
Этот модуль отвечает за CRUD-операции над моделью Проекта.
Пользователи могут создавать, просматривать, редактировать и удалять свои проекты.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.api.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=ProjectRead, summary="Создать проект")
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создание нового проекта.
    Текущий пользователь становится "владельцем" (user_id).
    """
    new_project = Project(
        title=project_data.title,
        description=project_data.description,
        user_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/", response_model=List[ProjectRead], summary="Список всех проектов")
def read_projects(db: Session = Depends(get_db)):
    """
    Получаем список всех проектов, доступных в базе.
    """
    projects = db.query(Project).all()
    return projects


@router.get("/{project_id}", response_model=ProjectRead, summary="Детали одного проекта")
def read_project(project_id: int, db: Session = Depends(get_db)):
    """
    Получить информацию по конкретному проекту по его ID.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Проект не найден"
        )
    return project


@router.put("/{project_id}", response_model=ProjectRead, summary="Обновить проект")
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновить существующий проект (только если пользователь - владелец).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Проверяем, владелец ли текущий пользователь
    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Вы не можете редактировать чужой проект"
        )

    # Если поля в ProjectUpdate не пустые, присваиваем их
    if project_data.title:
        project.title = project_data.title
    if project_data.description:
        project.description = project_data.description

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", summary="Удалить проект")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить проект по ID, если вы являетесь его владельцем.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Вы не можете удалить чужой проект"
        )

    db.delete(project)
    db.commit()
    return {"detail": "Проект успешно удалён"}
