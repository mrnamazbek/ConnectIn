"""
Модуль для управления операциями над Todo.
Доступные операции:
- Создание нового Todo.
- Получение списка Todo текущего пользователя.
- Обновление Todo.
- Удаление Todo.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.todo import Todo
from app.schemas.todo import TodoInDB, TodoCreate, TodoUpdate
from app.api.v1.auth import get_current_user
from app.models.user import User  # Предполагается, что модель User уже определена
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/", response_model=TodoInDB, summary="Создать новое Todo")
def create_todo(
        todo: TodoCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> TodoInDB:
    """
    Создает новый элемент Todo для текущего пользователя.

    :param todo: Данные для создания Todo.
    :param db: Сессия базы данных.
    :param current_user: Текущий аутентифицированный пользователь.
    :return: Объект созданного Todo.
    """
    new_todo = Todo(
        title=todo.title,
        description=todo.description,
        user_id=current_user.id,
        is_completed=False  # По умолчанию, новое Todo не выполнено
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo


@router.get("/", response_model=List[TodoInDB], summary="Получить список Todo")
def get_todos(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> List[TodoInDB]:
    """
    Возвращает список всех Todo, принадлежащих текущему пользователю.

    :param db: Сессия базы данных.
    :param current_user: Текущий аутентифицированный пользователь.
    :return: Список объектов Todo.
    """
    todos = db.query(Todo).filter(Todo.user_id == current_user.id).all()
    return todos


@router.put("/{todo_id}", response_model=TodoInDB, summary="Обновить Todo")
def update_todo(
        todo_id: int,
        todo_update: TodoUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> TodoInDB:
    """
    Обновляет данные Todo с заданным идентификатором, если он принадлежит текущему пользователю.

    :param todo_id: Идентификатор Todo для обновления.
    :param todo_update: Объект с новыми данными для Todo.
    :param db: Сессия базы данных.
    :param current_user: Текущий аутентифицированный пользователь.
    :return: Обновленный объект Todo.
    :raises HTTPException: Если Todo не найден.
    """
    db_todo = (
        db.query(Todo)
        .filter(Todo.id == todo_id, Todo.user_id == current_user.id)
        .first()
    )
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    # Обновляем поля Todo, только если они присутствуют в объекте обновления
    update_data = todo_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить Todo")
def delete_todo(
        todo_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> None:
    """
    Удаляет Todo с заданным идентификатором, если он принадлежит текущему пользователю.

    :param todo_id: Идентификатор Todo для удаления.
    :param db: Сессия базы данных.
    :param current_user: Текущий аутентифицированный пользователь.
    :raises HTTPException: Если Todo не найден.
    """
    db_todo = (
        db.query(Todo)
        .filter(Todo.id == todo_id, Todo.user_id == current_user.id)
        .first()
    )
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    db.delete(db_todo)
    db.commit()
    return
