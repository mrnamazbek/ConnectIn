"""
Project Service - Project and Team Management
Handles projects, teams, applications, and recommendations
"""
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from app.database import get_db, engine
from app import models, schemas
from app.config import settings

# Create tables
models.Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ConnectIn Project Service",
    description="Project and team management service",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "project-service"}

# Get user ID from header (set by API Gateway)
def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> Optional[int]:
    if x_user_id:
        return int(x_user_id)
    return None

# List projects
@app.get("/projects", response_model=List[schemas.ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 20,
    tech_stack: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id)
):
    """Get all projects with optional filtering"""
    query = db.query(models.Project)
    
    if tech_stack:
        query = query.filter(models.Project.tech_stack.contains([tech_stack]))
    
    projects = query.offset(skip).limit(limit).all()
    return projects

# Create project
@app.post("/projects", response_model=schemas.ProjectResponse, status_code=201)
async def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Create a new project"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db_project = models.Project(
        **project.dict(),
        owner_id=user_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    logger.info(f"Project created: {db_project.id} by user {user_id}")
    return db_project

# Get single project
@app.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project by ID"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# Update project
@app.put("/projects/{project_id}", response_model=schemas.ProjectResponse)
async def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Update project"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if db_project.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")
    
    for key, value in project_update.dict(exclude_unset=True).items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

# Delete project
@app.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Delete project"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if db_project.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")
    
    db.delete(db_project)
    db.commit()
    
    return {"message": "Project deleted successfully"}

# Apply to project
@app.post("/projects/{project_id}/apply")
async def apply_to_project(
    project_id: int,
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Apply to a project"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if already applied
    existing = db.query(models.Application).filter(
        models.Application.project_id == project_id,
        models.Application.user_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this project")
    
    # Create application
    db_application = models.Application(
        project_id=project_id,
       user_id=user_id,
        message=application.message
    )
    db.add(db_application)
    db.commit()
    
    return {"message": "Application submitted successfully"}

# Get recommendations (placeholder)
@app.get("/projects/recommendations")
async def get_recommendations(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get project recommendations for user"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # TODO: Integrate with ML service
    projects = db.query(models.Project).limit(10).all()
    return projects

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
