"""
Модуль для управления операциями над Todo.
Доступные операции:
- Создание нового Todo.
- Получение списка Todo текущего пользователя.
- Обновление Todo.
- Удаление Todo.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from math import ceil
from datetime import datetime

from app.database.connection import get_db
from app.models.todo import Todo, TaskStatus, TaskPriority
from app.models.project import Project
from app.models.relations.associations import task_assignments
from app.models.user import User
from app.schemas.todo import TodoInDB, TodoCreate, TodoUpdate, TodoDetail, TodosResponse, TaskAssignmentRole, UserBasic
from app.api.v1.auth import get_current_user
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Helper function to check if user is a project member
def is_project_member(db: Session, user_id: int, project_id: int) -> bool:
    """Check if a user is a member or owner of a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    
    # Check if user is the owner
    if project.owner_id == user_id:
        return True
    
    # Check if user is a member
    for member in project.members:
        if member.id == user_id:
            return True
    
    return False

@router.post("/", response_model=TodoDetail, summary="Create a new Todo")
def create_todo(
        todo: TodoCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> TodoDetail:
    """
    Creates a new Todo item for the current user.
    
    If project_id is provided, the todo will be associated with that project.
    The user must be a member or owner of the project to create a todo for it.
    """
    # Check project authorization if a project is specified
    if todo.project_id:
        if not is_project_member(db, current_user.id, todo.project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member or owner of the project to create tasks"
            )
    
    # Create the new todo
    new_todo = Todo(
        title=todo.title,
        description=todo.description,
        status=todo.status,
        priority=todo.priority,
        estimated_hours=todo.estimated_hours,
        due_date=todo.due_date,
        user_id=current_user.id,  # Creator/owner
        project_id=todo.project_id,
        is_completed=False  # Default value
    )
    
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    
    # Add assignees if provided
    if todo.assignee_ids:
        for assignee_id in todo.assignee_ids:
            # For project todos, verify the assignee is a project member
            if todo.project_id and not is_project_member(db, assignee_id, todo.project_id):
                logger.warning(f"User {assignee_id} is not a project member and cannot be assigned")
                continue
                
            # Add the assignment
            stmt = task_assignments.insert().values(
                todo_id=new_todo.id,
                user_id=assignee_id,
                role=TaskAssignmentRole.ASSIGNEE,
                assigned_at=datetime.utcnow()
            )
            db.execute(stmt)
        
        db.commit()
    
    # Return the created todo with additional details
    return get_todo_detail(db, new_todo)

@router.get("/", response_model=TodosResponse, summary="Get user todos")
def get_todos(
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=50),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> TodosResponse:
    """
    Returns a paginated list of all Todos owned by or assigned to the current user.
    
    Supports filtering by status and priority.
    """
    # Base query for todos owned by the user
    query = db.query(Todo).filter(
        (Todo.user_id == current_user.id) | 
        (Todo.id.in_(
            db.query(task_assignments.c.todo_id)
            .filter(task_assignments.c.user_id == current_user.id)
            .subquery()
        ))
    )
    
    # Apply filters
    if status:
        query = query.filter(Todo.status == status)
    if priority:
        query = query.filter(Todo.priority == priority)
    
    # Count for pagination
    total_count = query.count()
    total_pages = ceil(total_count / page_size)
    
    # Get paginated results
    todos = query.order_by(Todo.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Format results with details
    todo_details = [get_todo_detail(db, todo) for todo in todos]
    
    return TodosResponse(
        items=todo_details,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/project/{project_id}", response_model=TodosResponse, summary="Get project todos")
def get_project_todos(
        project_id: int = Path(..., ge=1),
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=50),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> TodosResponse:
    """
    Returns a paginated list of all Todos associated with a specific project.
    
    The user must be a member or owner of the project to view its tasks.
    Supports filtering by status and priority.
    """
    # Check if the user has access to this project
    if not is_project_member(db, current_user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member or owner of the project to view its tasks"
        )
    
    # Base query for project todos
    query = db.query(Todo).filter(Todo.project_id == project_id)
    
    # Apply filters
    if status:
        query = query.filter(Todo.status == status)
    if priority:
        query = query.filter(Todo.priority == priority)
    
    # Count for pagination
    total_count = query.count()
    total_pages = ceil(total_count / page_size)
    
    # Get paginated results
    todos = query.order_by(Todo.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Format results with details
    todo_details = [get_todo_detail(db, todo) for todo in todos]
    
    return TodosResponse(
        items=todo_details,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{todo_id}", response_model=TodoDetail, summary="Get todo details")
def get_todo(
        todo_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> TodoDetail:
    """
    Retrieves detailed information about a specific Todo.
    
    The user must be the owner, an assignee, or a member of the associated project.
    """
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    # Check authorization
    if todo.user_id != current_user.id:
        # Check if user is an assignee
        is_assignee = db.query(task_assignments).filter(
            task_assignments.c.todo_id == todo_id,
            task_assignments.c.user_id == current_user.id
        ).first() is not None
        
        # Check if it's a project todo and user is a project member
        is_project_member_access = todo.project_id and is_project_member(db, current_user.id, todo.project_id)
        
        if not (is_assignee or is_project_member_access):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this todo"
            )
    
    return get_todo_detail(db, todo)

@router.put("/{todo_id}", response_model=TodoDetail, summary="Update Todo")
def update_todo(
        todo_id: int,
        todo_update: TodoUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> TodoDetail:
    """
    Updates a Todo with the given ID.
    
    The user must be the owner, an assignee, or a member of the associated project with permission.
    """
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    # Check authorization
    is_owner = db_todo.user_id == current_user.id
    is_project_owner = db_todo.project_id and db.query(Project).filter(
        Project.id == db_todo.project_id,
        Project.owner_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_project_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this todo"
        )
    
    # Update fields
    update_data = todo_update.model_dump(exclude_unset=True)
    
    # Handle project changes
    if "project_id" in update_data:
        new_project_id = update_data["project_id"]
        # If changing to a specific project, check membership
        if new_project_id and not is_project_member(db, current_user.id, new_project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member of the project to move a todo to it"
            )
    
    # Update assignees if provided
    if todo_update.assignee_ids is not None:
        # First remove existing assignee assignments
        db.execute(
            task_assignments.delete().where(
                (task_assignments.c.todo_id == todo_id) &
                (task_assignments.c.role == TaskAssignmentRole.ASSIGNEE)
            )
        )
        
        # Then add new assignees
        for assignee_id in todo_update.assignee_ids:
            # Check if the assignee is a project member (if applicable)
            project_id = update_data.get("project_id", db_todo.project_id)
            if project_id and not is_project_member(db, assignee_id, project_id):
                logger.warning(f"User {assignee_id} is not a project member and cannot be assigned")
                continue
                
            # Add the assignment
            db.execute(
                task_assignments.insert().values(
                    todo_id=todo_id,
                    user_id=assignee_id,
                    role=TaskAssignmentRole.ASSIGNEE,
                    assigned_at=datetime.utcnow()
                )
            )
        
        # Remove assignee_ids from the dict to avoid confusion with the model fields
        del update_data["assignee_ids"]
    
    # Update the todo object fields
    for key, value in update_data.items():
        setattr(db_todo, key, value)
    
    db.commit()
    db.refresh(db_todo)
    
    return get_todo_detail(db, db_todo)

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Todo")
def delete_todo(
        todo_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> None:
    """
    Deletes a Todo with the given ID.
    
    The user must be the owner of the todo or the owner of the associated project.
    """
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    # Check if user is the owner of the todo or the project
    is_todo_owner = db_todo.user_id == current_user.id
    is_project_owner = False
    
    if db_todo.project_id:
        project = db.query(Project).filter(Project.id == db_todo.project_id).first()
        is_project_owner = project and project.owner_id == current_user.id
    
    if not (is_todo_owner or is_project_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this todo"
        )
    
    db.delete(db_todo)
    db.commit()
    return

# Helper function to get todo details with assignments, tags, etc.
def get_todo_detail(db: Session, todo: Todo) -> TodoDetail:
    """Creates a TodoDetail object with additional details about the todo."""
    # Get assignees
    assignees = []
    
    # Get assignees from task_assignments
    assignee_query = db.query(User).join(
        task_assignments,
        User.id == task_assignments.c.user_id
    ).filter(
        task_assignments.c.todo_id == todo.id,
        task_assignments.c.role == TaskAssignmentRole.ASSIGNEE
    )
    
    # Add each user to assignees
    for user in assignee_query.all():
        assignees.append(UserBasic(
            id=user.id,
            username=user.username,
            avatar_url=user.avatar_url if hasattr(user, 'avatar_url') else None
        ))
    
    # Get watchers (from both the watchers relationship and task_assignments)
    watchers = []
    for watcher in todo.watchers:
        watchers.append(UserBasic(
            id=watcher.id,
            username=watcher.username,
            avatar_url=watcher.avatar_url if hasattr(watcher, 'avatar_url') else None
        ))
    
    # Count comments
    comment_count = len(todo.comments) if hasattr(todo, 'comments') and todo.comments is not None else 0
    
    # Get tags
    tags = [tag.name for tag in todo.tags] if hasattr(todo, 'tags') and todo.tags is not None else []
    
    # Create and return the detailed todo object
    return TodoDetail(
        id=todo.id,
        title=todo.title,
        description=todo.description,
        status=todo.status,
        priority=todo.priority,
        estimated_hours=todo.estimated_hours,
        due_date=todo.due_date,
        is_completed=todo.is_completed,
        user_id=todo.user_id,
        project_id=todo.project_id,
        created_at=todo.created_at,
        updated_at=todo.updated_at,
        assignees=assignees,
        watchers=watchers,
        comment_count=comment_count,
        tags=tags
    )
