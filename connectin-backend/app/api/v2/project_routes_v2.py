from fastapi import APIRouter, Depends
from typing import List
from app.database.connection import get_db
from app.api.v1.auth_router import get_current_user
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter()

@router.post("/", response_model=ProjectOut)
def create_project(project_data: ProjectCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return ProjectService.create_project(project_data, current_user.id, db)

@router.get("/my", response_model=List[ProjectOut])
def get_my_projects(current_user=Depends(get_current_user), db=Depends(get_db)):
    return ProjectService.get_my_projects(current_user.id, db)

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, project_data: ProjectUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    return ProjectService.update_project(project_id, project_data, current_user.id, db)

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    ProjectService.delete_project(project_id, current_user.id, db)
    return {"message": "Проект удалён"}

@router.post("/{project_id}/apply", status_code=204)
def apply_to_project(project_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    ProjectService.apply_to_project(project_id, current_user.id, db)
    return {"message": "Заявка подана"}

@router.post("/{project_id}/applications/{user_id}/decision", status_code=204)
def decide_application(project_id: int, user_id: int, decision: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    ProjectService.decide_application(project_id, user_id, decision, current_user.id, db)
    return {"message": "Решение по заявке принято"}