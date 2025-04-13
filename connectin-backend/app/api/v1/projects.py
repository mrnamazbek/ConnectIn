"""
Этот модуль отвечает за CRUD-операции над моделью Проекта.
Пользователи могут создавать, просматривать, редактировать и удалять свои проекты.
Добавлена система заявок: пользователи могут подавать заявки, а владельцы проектов их одобрять/отклонять.
"""
from datetime import datetime
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from typing import List
from sqlalchemy.orm import joinedload
from fastapi import Query, HTTPException
from typing import List

from app.database.connection import get_db
from app.models import Tag, Skill
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectProfileOut, ProjectUpdate
from app.schemas.user import UserOut
from app.schemas.tag import TagOut
from app.schemas.skill import SkillOut
from app.api.v1.auth import get_current_user
from app.models.project import project_applications, project_members_association, project_tags_association, project_skills_association
from app.schemas.project import ApplicationDecisionRequest, ApplicationStatus
from app.models.vote import ProjectVote
from app.models.comment import ProjectComment
from app.schemas.comment import CommentOut, CommentCreate
from app.models.recommendation import ProjectRecommendation
from app.utils import get_logger

router = APIRouter()
logger = get_logger(__name__)

class VoteRequest(BaseModel):
    is_upvote: bool

class VoteStatusResponse(BaseModel):
    has_voted: bool
    is_upvote: bool | None = None
    vote_count: int = 0

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
        selected_tags = db.query(Tag).filter(Tag.id.in_(project_data.tag_ids)).all()
        if not selected_tags:
            raise HTTPException(status_code=400, detail="Invalid tags selected.")
        new_project.tags = selected_tags

    # Добавляем навыки, если они переданы
    if project_data.skill_ids:
        selected_skills = db.query(Skill).filter(Skill.id.in_(project_data.skill_ids)).all()
        if not selected_skills:
            raise HTTPException(status_code=400, detail="Invalid skills selected.")
        new_project.skills = selected_skills

    db.commit()
    db.refresh(new_project)

    # Возвращаем проект в формате ProjectOut
    return ProjectOut(
        id=new_project.id,
        name=new_project.name,
        description=new_project.description,
        owner=UserOut.model_validate(new_project.owner) if new_project.owner else None,
        tags=[TagOut(id=tag.id, name=tag.name) for tag in new_project.tags],
        skills=[SkillOut(id=skill.id, name=skill.name) for skill in new_project.skills],
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
            tags=[TagOut.model_validate(tag, from_attributes=True) for tag in project.tags],
            skills=[SkillOut.model_validate(skill, from_attributes=True) for skill in project.skills],
            members=[UserOut.model_validate(user, from_attributes=True) for user in project.members],
            applicants=[UserOut.model_validate(user, from_attributes=True) for user in project.applicants],
            comments_count=len(project.comments),
            vote_count=db.query(
                func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
            ).filter(ProjectVote.project_id == project.id).scalar() or 0
        )
        for project in projects
    ]

# 🔹 Получить все проекты
@router.get("/", response_model=dict)
def read_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=100),
    tag_ids: List[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get a list of all projects with pagination and optional tag filtering.
    """
    try:
        # Base query with eager loading of relationships
        query = db.query(Project).options(
            joinedload(Project.owner),
            joinedload(Project.tags),
            joinedload(Project.skills),
            joinedload(Project.members)
        )

        # Apply tag filter if provided
        if tag_ids:
            query = query.join(Project.tags).filter(Tag.id.in_(tag_ids))

        # Get total count for pagination
        total_count = query.distinct().count()

        # Calculate total pages
        total_pages = ceil(total_count / page_size)

        # Apply pagination and ordering
        projects = (
            query
            .distinct()
            .order_by(Project.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        # Format projects for response
        formatted_projects = [
            ProjectOut(
                id=project.id,
                name=project.name,
                description=project.description,
                owner=UserOut.model_validate(project.owner) if project.owner else None,
                tags=[TagOut.model_validate(tag, from_attributes=True) for tag in project.tags],
                skills=[SkillOut.model_validate(skill, from_attributes=True) for skill in project.skills],
                members=[UserOut.model_validate(user, from_attributes=True) for user in project.members],
                comments_count=len(project.comments),
                vote_count=db.query(
                    func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
                ).filter(ProjectVote.project_id == project.id).scalar() or 0
            )
            for project in projects
        ]

        return {
            "items": formatted_projects,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch projects")

@router.get("/filter_by_tags", response_model=dict)
def filter_projects_by_tags(
    tag_ids: List[int] = Query([]),
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Filter projects by tags with pagination support.
    """
    try:
        # Base query with eager loading
        query = db.query(Project).options(
            joinedload(Project.owner),
            joinedload(Project.tags),
            joinedload(Project.skills),
            joinedload(Project.members)
        )

        # Apply tag filter
        if tag_ids:
            query = query.join(Project.tags).filter(Tag.id.in_(tag_ids))
        else:
            # If no tags provided, return all projects
            query = query

        # Get total count for pagination
        total_count = query.distinct().count()

        # Calculate total pages
        total_pages = ceil(total_count / page_size)

        # Apply pagination and ordering
        projects = (
            query
            .distinct()
            .order_by(Project.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        # Format projects for response
        formatted_projects = [
            ProjectOut(
                id=project.id,
                name=project.name,
                description=project.description,
                owner=UserOut.model_validate(project.owner) if project.owner else None,
                tags=[TagOut.model_validate(tag, from_attributes=True) for tag in project.tags],
                skills=[SkillOut.model_validate(skill, from_attributes=True) for skill in project.skills],
                members=[UserOut.model_validate(user, from_attributes=True) for user in project.members],
                comments_count=len(project.comments),
                vote_count=db.query(
                    func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
                ).filter(ProjectVote.project_id == project.id).scalar() or 0
            )
            for project in projects
        ]

        return {
            "items": formatted_projects,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    except Exception as e:
        logger.error(f"Error filtering projects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to filter projects")

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
            tags=[TagOut.model_validate(tag, from_attributes=True) for tag in project.tags],
            skills=[SkillOut.model_validate(skill, from_attributes=True) for skill in project.skills],
            members=[UserOut.model_validate(user, from_attributes=True) for user in project.members],
            comments_count=len(project.comments),
            vote_count=db.query(
                func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
            ).filter(ProjectVote.project_id == project.id).scalar() or 0
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

    # Delete project recommendations first
    db.query(ProjectRecommendation).filter(
        ProjectRecommendation.to_project_id == project_id
    ).delete(synchronize_session=False)

    # Now delete the project
    db.delete(project)
    db.commit()
    return {"detail": "Проект успешно удалён"}

@router.get("/{project_id}/profile", response_model=ProjectProfileOut)
def get_project_profile(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить полную информацию о проекте для страницы профиля.
    Включает данные о проекте, участниках, заявках (для владельца), статусе голосования и комментариях.
    """
    # Fetch project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Calculate vote count
    vote_count = db.query(
        func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
    ).filter(ProjectVote.project_id == project_id).scalar() or 0

    # Project details
    project_out = ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        owner=UserOut.model_validate(project.owner) if project.owner else None,
        tags=[TagOut.model_validate(tag, from_attributes=True) for tag in project.tags],
        skills=[SkillOut.model_validate(skill, from_attributes=True) for skill in project.skills],
        members=[UserOut.model_validate(user, from_attributes=True) for user in project.members],
        comments_count=len(project.comments),
        vote_count=vote_count
    )

    # Members (redundant with project_out.members, but included for consistency)
    members = [UserOut.model_validate(user) for user in project.members]

    # Applications (only for owner)
    applications = None
    if project.owner_id == current_user.id:
        applicants = db.execute(
            project_applications.select().where(project_applications.c.project_id == project_id)
        ).mappings().fetchall()  # Add .mappings() here
        applicant_ids = [app["user_id"] for app in applicants]
        users = db.query(User).filter(User.id.in_(applicant_ids)).all()
        applications = [UserOut.model_validate(user) for user in users]

    # Comments
    comments = db.query(ProjectComment).filter(ProjectComment.project_id == project_id).all()
    comments_out = [
        CommentOut(
            id=comment.id,
            content=comment.content,
            user_id=comment.user_id,
            created_at=comment.created_at,
            user={
                "username": comment.user.username if comment.user else "Unknown",
                "avatar_url": comment.user.avatar_url if comment.user else None
            }
        )
        for comment in comments
    ]

    return ProjectProfileOut(
        project=project_out,
        members=members,
        applications=applications,
        comments=comments_out
    )

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
    current_user.last_active = datetime.now()
    db.commit()
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
@router.get("/{project_id}/applications", response_model=list[UserOut], summary="Список заявок на проект")
def get_project_applications(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Владелец проекта может просмотреть список заявок от пользователей.
    """
    # Fetch the project by ID
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Check if the current user is the project owner
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не владелец проекта")

    # Access applicants directly through the relationship
    applicants = project.applicants
    return [UserOut.model_validate(user) for user in applicants]

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
        else:
            existing_vote.is_upvote = vote_data.is_upvote
            db.commit()
    else:
        new_vote = ProjectVote(user_id=current_user.id, project_id=project_id, is_upvote=vote_data.is_upvote)
        db.add(new_vote)
        db.commit()

    # Get the actual vote count after the operation
    vote_count = db.query(
        func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
    ).filter(ProjectVote.project_id == project_id).scalar() or 0

    return {
        "detail": "Голос добавлен" if not existing_vote else "Голос изменен" if existing_vote.is_upvote != vote_data.is_upvote else "Голос удален",
        "vote_count": vote_count
    }

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
    # Get user's vote status
    vote = db.query(ProjectVote).filter_by(user_id=current_user.id, project_id=project_id).first()
    
    # Get total vote count
    vote_count = db.query(
        func.sum(case((ProjectVote.is_upvote, 1), else_=-1))
    ).filter(ProjectVote.project_id == project_id).scalar() or 0

    if vote:
        return {"has_voted": True, "is_upvote": vote.is_upvote, "vote_count": vote_count}
    return {"has_voted": False, "is_upvote": None, "vote_count": vote_count}

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
        user={
            "username": current_user.username,
            "avatar_url": current_user.avatar_url
        }
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
            user={"username": comment.user.username if comment.user else "Unknown", "avatar_url": comment.user.avatar_url if comment.user else None}        )
        for comment in comments
    ]

#  added search request
@router.get("/search", response_model=List[ProjectOut])
def search_projects(
    query: str = Query(..., min_length=1, example="blockchain"),
    page: int = Query(1, ge=1, description="Номер страницы начиная с 1"),
    page_size: int = Query(10, ge=1, le=100, description="Количество элементов (1-100)"),
    db: Session = Depends(get_db)
):
    """
    Поиск проектов по названию, описанию или тегам
    """
    # Initialize logger with module name for better tracking
    logger = get_logger(__name__)

    try:
        # Log the start of the search with parameters
        logger.info(f"Starting project search: query='{query}', page={page}, page_size={page_size}")

        # Base query with eager loading of related data
        query_base = db.query(Project).options(
            joinedload(Project.owner),
            joinedload(Project.tags),
            joinedload(Project.skills),
            joinedload(Project.members)
        )

        # Apply filters
        results = query_base.filter(
            (Project.name.ilike(f"%{query}%")) |
            (Project.description.ilike(f"%{query}%")) |
            (Project.tags.any(Tag.name.ilike(f"%{query}%")))
        ).order_by(Project.created_at.desc())

        # Get total count for pagination info
        total = results.count()

        # Apply pagination
        paginated_results = results.offset((page - 1) * page_size).limit(page_size).all()

        # Log successful completion with result details
        logger.info(f"Search completed: found {total} projects, returning {len(paginated_results)} on page {page}")

        return paginated_results

    except Exception as e:
        # Log error with details
        logger.error(f"Search failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")