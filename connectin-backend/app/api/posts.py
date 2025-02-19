"""
Этот модуль отвечает за работу с постами:
- Создание постов с тегами и навыками.
- Получение списка постов.
- Поиск постов с использованием Elasticsearch для быстрого полнотекстового поиска.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.post import Post
from app.models.user import User
from app.models.project import Project
from app.models.team import Team
from app.models.tag import Tag
from app.schemas.post import PostCreate, PostOut
from app.api.auth import get_current_user

# Импорт клиента Elasticsearch
from app.utils.elasticsearch_client import get_es_client

router = APIRouter()


@router.post("/", response_model=PostOut, summary="Создать пост")
def create_post(
        post_data: PostCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Создает новый пост с тегами и навыками.
    """
    if post_data.post_type not in ["news", "project", "team"]:
        raise HTTPException(status_code=400, detail="Invalid post type.")

    new_post = Post(
        title=post_data.title,
        content=post_data.content,
        post_type=post_data.post_type,
        author_id=current_user.id if post_data.post_type != "team" else None
    )
    if post_data.post_type == "team":
        team = db.query(Team).filter(Team.id == post_data.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")
        new_post.team_id = team.id

    if post_data.tag_ids:
        selected_tags = db.query(Tag).filter(Tag.id.in_(post_data.tag_ids)).all()
        if not selected_tags:
            raise HTTPException(status_code=400, detail="Invalid tags selected.")
        new_post.tags = selected_tags

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Индексируем пост в Elasticsearch
    es = get_es_client()
    es.index(index="posts", id=new_post.id, body={
        "id": new_post.id,
        "title": new_post.title,
        "content": new_post.content,
        "post_type": new_post.post_type,
        "author_id": new_post.author_id,
        "tags": [tag.name for tag in new_post.tags] if new_post.tags else []
    })

    return PostOut.from_orm(new_post)


@router.get("/", response_model=List[PostOut], summary="Список всех постов")
def get_all_posts(db: Session = Depends(get_db)):
    """
    Возвращает список всех постов.
    """
    posts = db.query(Post).all()
    formatted_posts = []
    for post in posts:
        formatted_posts.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "post_type": post.post_type,
            "author_id": post.author_id,
            "project_id": post.project_id,
            "team_id": post.team_id,
            "skills": [skill.name for skill in post.skills],
            "tags": [tag.name for tag in post.tags],
        })
    return formatted_posts


@router.get("/search", response_model=List[PostOut], summary="Поиск постов")
def search_posts(query: str, db: Session = Depends(get_db)):
    """
    Выполняет поиск постов с использованием Elasticsearch.
    Ищет по полям title, content и tags.
    """
    if not query:
        return []

    es = get_es_client()
    # Формируем запрос к Elasticsearch
    es_query = {
        "query": {
            "multi_match": {
                "query": query,
                "fields": ["title", "content", "tags"]
            }
        }
    }
    res = es.search(index="posts", body=es_query)
    post_ids = [hit["_source"]["id"] for hit in res["hits"]["hits"]]
    posts = db.query(Post).filter(Post.id.in_(post_ids)).all()
    return [PostOut.from_orm(post) for post in posts]


@router.get("/my", response_model=List[PostOut], summary="Мои посты")
def get_user_posts(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Возвращает посты, созданные текущим пользователем.
    """
    user_posts = db.query(Post).filter(Post.author_id == current_user.id).all()
    formatted_posts = []
    for post in user_posts:
        formatted_posts.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "post_type": post.post_type,
            "author_id": post.author_id,
            "project_id": post.project_id,
            "team_id": post.team_id,
            "skills": [skill.name for skill in post.skills],
            "tags": [tag.name for tag in post.tags],
        })
    return formatted_posts


@router.delete("/{post_id}", status_code=204, summary="Удалить пост")
def delete_post(
        post_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Удаляет пост, если текущий пользователь является автором.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}
