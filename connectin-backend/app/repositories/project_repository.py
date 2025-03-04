"""
Этот файл будет работать с проектами.
Что тут делает каждая функция?

create_project — создаёт новый проект.
get_my_projects — возвращает проекты пользователя.
update_project — обновляет данные проекта.
delete_project — удаляет проект по ID.
"""
from sqlalchemy.orm import Session
from app.models.project import Project

class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_project(self, name: str, description: str, owner_id: int):
        new_project = Project(name=name, description=description, owner_id=owner_id)
        self.db.add(new_project)
        self.db.commit()
        self.db.refresh(new_project)
        return new_project

    def get_my_projects(self, user_id: int):
        return self.db.query(Project).filter(Project.owner_id == user_id).all()

    def update_project(self, project_id: int, name: str, description: str):
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.name = name
            project.description = description
            self.db.commit()
            self.db.refresh(project)
        return project

    def delete_project(self, project_id: int):
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if project:
            self.db.delete(project)
            self.db.commit()