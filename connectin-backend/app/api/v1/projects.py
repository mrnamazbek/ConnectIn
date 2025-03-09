"""
Этот модуль отвечает за CRUD-операции над моделью Проекта.
Пользователи могут создавать, просматривать, редактировать и удалять свои проекты.
Добавлена система заявок: пользователи могут подавать заявки, а владельцы проектов их одобрять/отклонять.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from typing import List

from app.database.connection import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.schemas.user import UserOut
from app.schemas.tag import TagOut
from app.schemas.skill import SkillOut
from app.api.v1.auth import get_current_user
from app.models.project import project_applications, project_members_association, project_tags_association, project_skills_association
from app.schemas.project import ApplicationDecisionRequest, ApplicationStatus
from app.models.vote import ProjectVote
from app.models.comment import ProjectComment
from app.schemas.comment import CommentOut, CommentCreate

router = APIRouter()

class VoteRequest(BaseModel):
    is_upvote: bool

class VoteStatusResponse(BaseModel):
    has_voted: bool
    is_upvote: bool | None = None

# 🔹 Создать проект с тегами и навыками
@router.post("/", response_model=ProjectOut, summary="Создать проект")
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создание нового проекта.
    Текущий пользователь становится владельцем проекта.
    Принимает список тегов (tag_ids) и навыков (skill_ids).
    """
    # Создаем проект
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Добавляем теги, если они переданы
    if project_data.tag_ids:
        for tag_id in project_data.tag_ids:
            db.execute(
                project_tags_association.insert().values(
                    project_id=new_project.id, tag_id=tag_id
                )
            )

    # Добавляем навыки, если они переданы
    if project_data.skill_ids:
        for skill_id in project_data.skill_ids:
            db.execute(
                project_skills_association.insert().values(
                    project_id=new_project.id, skill_id=skill_id
                )
            )

    db.commit()
    db.refresh(new_project)

    # Возвращаем проект в формате ProjectOut
    return ProjectOut(
        id=new_project.id,
        name=new_project.name,
        description=new_project.description,
        owner=UserOut.model_validate(new_project.owner) if new_project.owner else None,
        tags=[TagOut.model_validate(tag) for tag in new_project.tags],
        skills=[SkillOut.model_validate(skill) for skill in new_project.skills],
        members=[UserOut.model_validate(user) for user in new_project.members],
        applicants=[UserOut.model_validate(user) for user in new_project.applicants],
        comments_count=len(new_project.comments),
        vote_count=db.query(
            func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
        ).filter(ProjectVote.project_id == new_project.id).scalar() or 0
    )

# 🔹 Получить мои проекты
@router.get("/my", response_model=List[ProjectOut], summary="Мои проекты")
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить список проектов, которые создал текущий пользователь.
    """
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()

    return [
        ProjectOut(
            id=project.id,
            name=project.name,
            description=project.description,
            owner=UserOut.model_validate(project.owner) if project.owner else None,
            tags=[TagOut.model_validate(tag) for tag in project.tags],
            skills=[SkillOut.model_validate(skill) for skill in project.skills],
            members=[UserOut.model_validate(user) for user in project.members],
            applicants=[UserOut.model_validate(user) for user in project.applicants],
            comments_count=len(project.comments),
            vote_count=db.query(
                func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
            ).filter(ProjectVote.project_id == project.id).scalar() or 0
        )
        for project in projects
    ]

# 🔹 Получить все проекты
@router.get("/", response_model=List[ProjectOut])
def read_projects(db: Session = Depends(get_db)):
    """
    Получить список всех проектов.
    """
    projects = db.query(Project).all()

    return [
        ProjectOut(
            id=project.id,
            name=project.name,
            description=project.description,
            owner=UserOut.model_validate(project.owner) if project.owner else None,
            tags=[TagOut.model_validate(tag) for tag in project.tags],
            skills=[SkillOut.model_validate(skill) for skill in project.skills],
            members=[UserOut.model_validate(user) for user in project.members],
            applicants=[UserOut.model_validate(user) for user in project.applicants],
            comments_count=len(project.comments),
            vote_count=db.query(
                func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
            ).filter(ProjectVote.project_id == project.id).scalar() or 0
        )
        for project in projects
    ]

# 🔹 Получить проект по ID
@router.get("/{project_id}", response_model=ProjectOut)
def read_project(project_id: int, db: Session = Depends(get_db)):
    """
    Получить информацию о проекте по его ID.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    vote_count = db.query(
        func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
    ).filter(ProjectVote.project_id == project_id).scalar() or 0

    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        owner=UserOut.model_validate(project.owner) if project.owner else None,
        tags=[TagOut.model_validate(tag) for tag in project.tags],
        skills=[SkillOut.model_validate(skill) for skill in project.skills],
        members=[UserOut.model_validate(user) for user in project.members],
        applicants=[UserOut.model_validate(user) for user in project.applicants],
        comments_count=len(project.comments),
        vote_count=vote_count
    )

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
    return ProjectOut.model_validate(project)

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

    if db.query(project_members_association).filter_by(user_id=current_user.id, project_id=project_id).first():
        raise HTTPException(status_code=400, detail="Вы уже являетесь участником проекта")

    if db.query(project_applications).filter_by(user_id=current_user.id, project_id=project_id).first():
        raise HTTPException(status_code=400, detail="Вы уже подали заявку")

    db.execute(project_applications.insert().values(user_id=current_user.id, project_id=project_id))
    db.commit()
    return {"detail": "Заявка подана"}

# 🔹 Получить список участников проекта
@router.get("/{project_id}/members", summary="Список участников проекта")
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить список всех участников проекта.
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

    member_ids = [member["user_id"] for member in members]
    users = db.query(User).filter(User.id.in_(member_ids)).all()
    return [UserOut.model_validate(user) for user in users]

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

    applicant_ids = [app["user_id"] for app in applicants]
    users = db.query(User).filter(User.id.in_(applicant_ids)).all()
    return [UserOut.model_validate(user) for user in users]

# 🔹 Одобрить/Отклонить заявку
@router.post("/{project_id}/applications/{user_id}/decision", summary="Принять или отклонить заявку")
def decide_application(
    project_id: int,
    user_id: int,
    request: ApplicationDecisionRequest,
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
        db.execute(project_members_association.insert().values(user_id=user_id, project_id=project_id))
        db.execute(project_applications.delete().where(
            (project_applications.c.project_id == project_id) &
            (project_applications.c.user_id == user_id)
        ))
        db.commit()
        return {"detail": "Пользователь принят в проект"}
    else:
        db.execute(project_applications.delete().where(
            (project_applications.c.project_id == project_id) &
            (project_applications.c.user_id == user_id)
        ))
        db.commit()
        return {"detail": "Заявка отклонена"}

# 🔹 Удалить пользователя из проекта
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

# 🔹 Проголосовать за проект (upvote/downvote)
@router.post("/{project_id}/vote")
def vote_project(
    project_id: int,
    vote_data: VoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Проголосовать за проект (upvote или downvote).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    existing_vote = db.query(ProjectVote).filter_by(user_id=current_user.id, project_id=project_id).first()

    if existing_vote:
        if existing_vote.is_upvote == vote_data.is_upvote:
            db.delete(existing_vote)
            db.commit()
            return {"detail": "Голос удален"}
        else:
            existing_vote.is_upvote = vote_data.is_upvote
            db.commit()
            return {"detail": "Голос изменен"}

    new_vote = ProjectVote(user_id=current_user.id, project_id=project_id, is_upvote=vote_data.is_upvote)
    db.add(new_vote)
    db.commit()
    return {"detail": "Голос добавлен"}

# 🔹 Проверить статус голоса
@router.get("/{project_id}/vote_status", response_model=VoteStatusResponse)
def get_vote_status(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Проверить, голосовал ли текущий пользователь за проект и был ли это upvote или downvote.
    """
    vote = db.query(ProjectVote).filter_by(user_id=current_user.id, project_id=project_id).first()
    if vote:
        return {"has_voted": True, "is_upvote": vote.is_upvote}
    return {"has_voted": False, "is_upvote": None}

# 🔹 Добавить комментарий к проекту
@router.post("/{project_id}/comment", response_model=CommentOut)
def comment_project(
    project_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Добавить комментарий к проекту.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    new_comment = ProjectComment(
        content=comment_data.content,
        user_id=current_user.id,
        project_id=project_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return CommentOut(
        id=new_comment.id,
        content=new_comment.content,
        user_id=new_comment.user_id,
        created_at=new_comment.created_at,
        user=UserOut.model_validate(current_user)
    )

# 🔹 Получить комментарии проекта
@router.get("/{project_id}/comments", response_model=List[CommentOut])
def get_project_comments(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить все комментарии для указанного проекта.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    comments = db.query(ProjectComment).filter(ProjectComment.project_id == project_id).all()
    return [
        CommentOut(
            id=comment.id,
            content=comment.content,
            user_id=comment.user_id,
            created_at=comment.created_at,
            user=UserOut.model_validate(comment.user) if comment.user else None
        )
        for comment in comments
    ]