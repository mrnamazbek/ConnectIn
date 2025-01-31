"""
Этот модуль отвечает за CRUD-операции над моделью Проекта.
Пользователи могут создавать, просматривать, редактировать и удалять свои проекты.
Добавлена система заявок: пользователи могут подавать заявки, а владельцы проектов их одобрять/отклонять.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.api.auth import get_current_user
from app.models.project import project_applications, project_members_association
from app.schemas.project import ApplicationDecisionRequest, ApplicationStatus

router = APIRouter()

# 🔹 Создать проект
@router.post("/", response_model=ProjectOut, summary="Создать проект")
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создание нового проекта.
    Текущий пользователь становится владельцем проекта.
    """
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


# 🔹 Получить все проекты
@router.get("/", response_model=List[ProjectOut], summary="Список всех проектов")
def read_projects(db: Session = Depends(get_db)):
    """
    Получаем список всех проектов, доступных в базе.
    """
    return db.query(Project).all()


# 🔹 Получить один проект по ID
@router.get("/{project_id}", response_model=ProjectOut, summary="Детали проекта")
def read_project(project_id: int, db: Session = Depends(get_db)):
    """
    Получить информацию по конкретному проекту.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project


# 🔹 Обновить проект
@router.put("/{project_id}", response_model=ProjectOut, summary="Обновить проект")
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет существующий проект (только если пользователь - владелец).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете редактировать чужой проект")

    project.name = project_data.name or project.name
    project.description = project_data.description or project.description

    db.commit()
    db.refresh(project)
    return project


# 🔹 Удалить проект
@router.delete("/{project_id}", summary="Удалить проект")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удалить проект (только если пользователь - владелец).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете удалить чужой проект")

    db.delete(project)
    db.commit()
    return {"detail": "Проект успешно удалён"}


# 🔹 Подать заявку на участие в проекте
@router.post("/{project_id}/apply", summary="Подать заявку на проект")
def apply_to_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Пользователь подает заявку на участие в проекте.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Проверяем, не является ли пользователь уже участником
    if db.query(project_members_association).filter_by(user_id=current_user.id, project_id=project_id).first():
        raise HTTPException(status_code=400, detail="Вы уже являетесь участником проекта")

    # Проверяем, не подал ли пользователь уже заявку
    if db.query(project_applications).filter_by(user_id=current_user.id, project_id=project_id).first():
        raise HTTPException(status_code=400, detail="Вы уже подали заявку")

    # Добавляем заявку в таблицу заявок
    new_application = project_applications.insert().values(user_id=current_user.id, project_id=project_id)
    db.execute(new_application)
    db.commit()

    return {"detail": "Заявка подана"}


# 🔹 Получить список участников проекта
@router.get("/{project_id}/members", summary="Список участников проекта")
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить список всех участников проекта.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Получаем список участников через промежуточную таблицу
    members = db.execute(
        project_members_association.select().where(
            project_members_association.c.project_id == project_id
        )
    ).fetchall()

    if not members:
        return {"detail": "В проекте пока нет участников"}

    # Получаем информацию о пользователях
    member_ids = [member.user_id for member in members]
    users = db.query(User).filter(User.id.in_(member_ids)).all()

    return [{"id": user.id, "username": user.username, "email": user.email} for user in users]



# 🔹 Получить список заявок в проект
@router.get("/{project_id}/applications", summary="Список заявок на проект")
def get_project_applications(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Владелец проекта может просмотреть список заявок от пользователей.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не владелец проекта")

    applicants = db.execute(
        project_applications.select().where(project_applications.c.project_id == project_id)
    ).fetchall()

    return [{"user_id": app.user_id} for app in applicants]


# 🔹 Одобрить/Отклонить заявку
@router.post("/{project_id}/applications/{user_id}/decision", summary="Принять или отклонить заявку")
def decide_application(
    project_id: int,
    user_id: int,
    request: ApplicationDecisionRequest,  # Accepting JSON body instead of query
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Владелец проекта принимает или отклоняет заявку пользователя.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не владелец проекта")

    application = db.execute(
        project_applications.select().where(
            (project_applications.c.project_id == project_id) &
            (project_applications.c.user_id == user_id)
        )
    ).fetchone()

    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if request.decision == ApplicationStatus.ACCEPTED:
        # ✅ Add user to project members table
        db.execute(project_members_association.insert().values(user_id=user_id, project_id=project_id))
        # ✅ Remove application after approval
        db.execute(project_applications.delete().where(
            (project_applications.c.project_id == project_id) &
            (project_applications.c.user_id == user_id)
        ))
        db.commit()
        return {"detail": "Пользователь принят в проект"}

    elif request.decision == ApplicationStatus.REJECTED:
        # ✅ Remove application from applications table
        db.execute(project_applications.delete().where(
            (project_applications.c.project_id == project_id) &
            (project_applications.c.user_id == user_id)
        ))
        db.commit()
        return {"detail": "Заявка отклонена"}
    
    
# 🔹 Удалить пользователя из проекта (только владелец проекта)
@router.delete("/{project_id}/members/{user_id}", summary="Удалить пользователя из проекта")
def remove_user_from_project(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Владелец проекта может удалить участника из проекта.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не владелец проекта")

    # Проверяем, является ли пользователь участником
    member = db.execute(
        project_members_association.select().where(
            (project_members_association.c.project_id == project_id) &
            (project_members_association.c.user_id == user_id)
        )
    ).fetchone()

    if not member:
        raise HTTPException(status_code=404, detail="Пользователь не является участником проекта")

    # Удаляем пользователя из таблицы участников проекта
    db.execute(project_members_association.delete().where(
        (project_members_association.c.project_id == project_id) &
        (project_members_association.c.user_id == user_id)
    ))
    db.commit()

    return {"detail": "Пользователь удален из проекта"}
