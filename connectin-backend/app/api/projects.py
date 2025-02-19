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
from app.models.project import project_applications, project_members_association, project_tags_association, project_skills_association
from app.schemas.project import ApplicationDecisionRequest, ApplicationStatus

router = APIRouter()

@router.post("/", response_model=ProjectOut, summary="Создать проект")
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создание нового проекта. Текущий пользователь становится владельцем проекта.
    Принимает список тегов (tag_ids) и навыков (skill_ids).
    """
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Добавление тегов
    if project_data.tag_ids:
        for tag_id in project_data.tag_ids:
            db.execute(
                project_tags_association.insert().values(
                    project_id=new_project.id, tag_id=tag_id
                )
            )

    # Добавление навыков
    if project_data.skill_ids:
        for skill_id in project_data.skill_ids:
            db.execute(
                project_skills_association.insert().values(
                    project_id=new_project.id, skill_id=skill_id
                )
            )

    db.commit()
    db.refresh(new_project)

    # Возвращаем проект с данными о тегах, навыках, участниках и заявках
    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description,
        "owner_id": new_project.owner_id,
        "members": [{"id": user.id, "username": user.username} for user in new_project.members],
        "applicants": [{"id": user.id, "username": user.username} for user in new_project.applicants],
        "tags": [{"id": tag.id, "name": tag.name} for tag in new_project.tags],
        "skills": [{"id": skill.id, "name": skill.name} for skill in new_project.skills]
    }

@router.get("/my", response_model=List[ProjectOut], summary="Мои проекты")
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получает список проектов, созданных текущим пользователем.
    """
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    formatted_projects = []
    for project in projects:
        formatted_projects.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "owner_id": project.owner_id,
            "tags": [{"id": tag.id, "name": tag.name} for tag in project.tags],
            "skills": [{"id": skill.id, "name": skill.name} for skill in project.skills],
        })
    return formatted_projects

@router.get("/", response_model=List[ProjectOut], summary="Список всех проектов")
def read_projects(db: Session = Depends(get_db)):
    """
    Получает список всех проектов.
    """
    return db.query(Project).all()

@router.get("/{project_id}", response_model=ProjectOut, summary="Детали проекта")
def read_project(project_id: int, db: Session = Depends(get_db)):
    """
    Получает информацию о конкретном проекте.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return ProjectOut.from_orm(project)

@router.put("/{project_id}", response_model=ProjectOut, summary="Обновить проект")
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет существующий проект (только если пользователь является владельцем).
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

@router.delete("/{project_id}", summary="Удалить проект")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удаляет проект, если текущий пользователь является владельцем.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете удалить чужой проект")

    db.delete(project)
    db.commit()
    return {"detail": "Проект успешно удалён"}

@router.post("/{project_id}/apply", summary="Подать заявку на проект")
def apply_to_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет пользователю подать заявку на участие в проекте.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if db.query(project_members_association).filter_by(user_id=current_user.id, project_id=project_id).first():
        raise HTTPException(status_code=400, detail="Вы уже являетесь участником проекта")

    if db.query(project_applications).filter_by(user_id=current_user.id, project_id=project_id).first():
        raise HTTPException(status_code=400, detail="Вы уже подали заявку")

    new_application = project_applications.insert().values(user_id=current_user.id, project_id=project_id)
    db.execute(new_application)
    db.commit()
    return {"detail": "Заявка подана"}

@router.get("/{project_id}/members", summary="Список участников проекта")
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получает список участников проекта.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    members = db.execute(
        project_members_association.select().where(
            project_members_association.c.project_id == project_id
        )
    ).fetchall()
    if not members:
        return {"detail": "В проекте пока нет участников"}
    member_ids = [member.user_id for member in members]
    users = db.query(User).filter(User.id.in_(member_ids)).all()
    return [{"id": user.id, "username": user.username, "email": user.email} for user in users]

@router.get("/{project_id}/applications", summary="Список заявок на проект")
def get_project_applications(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет владельцу проекта просмотреть список заявок.
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

@router.post("/{project_id}/applications/{user_id}/decision", summary="Принять или отклонить заявку")
def decide_application(
    project_id: int,
    user_id: int,
    request: ApplicationDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет владельцу проекта принять или отклонить заявку пользователя.
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
        db.execute(project_members_association.insert().values(user_id=user_id, project_id=project_id))
        db.execute(project_applications.delete().where(
            (project_applications.c.project_id == project_id) &
            (project_applications.c.user_id == user_id)
        ))
        db.commit()
        return {"detail": "Пользователь принят в проект"}
    elif request.decision == ApplicationStatus.REJECTED:
        db.execute(project_applications.delete().where(
            (project_applications.c.project_id == project_id) &
            (project_applications.c.user_id == user_id)
        ))
        db.commit()
        return {"detail": "Заявка отклонена"}

@router.delete("/{project_id}/members/{user_id}", summary="Удалить пользователя из проекта")
def remove_user_from_project(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет владельцу проекта удалить участника.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не владелец проекта")
    member = db.execute(
        project_members_association.select().where(
            (project_members_association.c.project_id == project_id) &
            (project_members_association.c.user_id == user_id)
        )
    ).fetchone()
    if not member:
        raise HTTPException(status_code=404, detail="Пользователь не является участником проекта")
    db.execute(project_members_association.delete().where(
        (project_members_association.c.project_id == project_id) &
        (project_members_association.c.user_id == user_id)
    ))
    db.commit()
    return {"detail": "Пользователь удален из проекта"}
