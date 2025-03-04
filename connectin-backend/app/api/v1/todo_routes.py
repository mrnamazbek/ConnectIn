# app/api/todos.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models
from app.schemas.todo import TodoInDB, TodoCreate, TodoUpdate
from app.database.connection import get_db
from app.api.v1.auth_router import get_current_user  # Функция для получения текущего пользователя

router = APIRouter(
    prefix="/todos",
    tags=["todos"]
)

@router.post("/", response_model=TodoInDB)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_todo = models.Todo(title=todo.title, description=todo.description, user_id=current_user.id)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

@router.get("/", response_model=list[TodoInDB])
def get_todos(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    todos = db.query(models.Todo).filter(models.Todo.user_id == current_user.id).all()
    return todos

@router.put("/{todo_id}", response_model=TodoInDB)
def update_todo(todo_id: int, todo: TodoUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id, models.Todo.user_id == current_user.id).first()
    if not db_todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    for key, value in todo.model_dump(exclude_unset=True).items():
        setattr(db_todo, key, value)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id, models.Todo.user_id == current_user.id).first()
    if not db_todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    return
