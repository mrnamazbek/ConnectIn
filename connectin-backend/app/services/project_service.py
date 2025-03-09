from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import project_tags_association, project_skills_association
from app.models.project import Project, project_applications, project_members_association
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

class ProjectService:
    @staticmethod
    def create_project(project_data: ProjectCreate, user_id: int, db: Session) -> ProjectOut:
        """Создаёт новый проект с тегами и навыками."""
        new_project = Project(
            name=project_data.name,
            description=project_data.description,
            owner_id=user_id
        )
        db.add(new_project)
        db.commit()

        if project_data.tag_ids:
            for tag_id in project_data.tag_ids:
                db.execute(project_tags_association.insert().values(project_id=new_project.id, tag_id=tag_id))
        if project_data.skill_ids:
            for skill_id in project_data.skill_ids:
                db.execute(project_skills_association.insert().values(project_id=new_project.id, skill_id=skill_id))
        db.commit()

        db.refresh(new_project)
        return ProjectOut.model_validate(new_project)

    @staticmethod
    def get_my_projects(user_id: int, db: Session) -> List[ProjectOut]:
        """Возвращает проекты пользователя."""
        projects = db.query(Project).filter(Project.owner_id == user_id).all()
        return [ProjectOut.model_validate(proj) for proj in projects]

    @staticmethod
    def update_project(project_id: int, project_data: ProjectUpdate, user_id: int, db: Session) -> ProjectOut:
        """Обновляет проект, если пользователь — владелец."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Проект не найден")
        if project.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        project.name = project_data.name or project.name
        project.description = project_data.description or project.description
        db.commit()
        db.refresh(project)
        return ProjectOut.model_validate(project)

    @staticmethod
    def delete_project(project_id: int, user_id: int, db: Session) -> None:
        """Удаляет проект, если пользователь — владелец."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Проект не найден")
        if project.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        db.delete(project)
        db.commit()

    @staticmethod
    def apply_to_project(project_id: int, user_id: int, db: Session) -> None:
        """Подача заявки на участие в проекте."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Проект не найден")

        if db.query(project_members_association).filter_by(user_id=user_id, project_id=project_id).first():
            raise HTTPException(status_code=400, detail="Вы уже участник")
        if db.query(project_applications).filter_by(user_id=user_id, project_id=project_id).first():
            raise HTTPException(status_code=400, detail="Заявка уже подана")

        db.execute(project_applications.insert().values(user_id=user_id, project_id=project_id))
        db.commit()

    @staticmethod
    def decide_application(project_id: int, applicant_id: int, decision: str, owner_id: int, db: Session) -> None:
        """Одобрение или отклонение заявки владельцем проекта."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project or project.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        application = db.query(project_applications).filter_by(project_id=project_id, user_id=applicant_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        if decision == "ACCEPTED":
            db.execute(project_members_association.insert().values(user_id=applicant_id, project_id=project_id))
            db.execute(project_applications.delete().where(project_applications.c.user_id == applicant_id))
            db.commit()
        elif decision == "REJECTED":
            db.execute(project_applications.delete().where(project_applications.c.user_id == applicant_id))
            db.commit()