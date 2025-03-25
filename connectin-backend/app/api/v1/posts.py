from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.post import Post
from app.models.user import User
from app.models.team import Team
from app.models.tag import Tag
from app.models.like import PostLike
from app.models.save import SavedPost
from app.models.comment import PostComment
from app.models.relations.associations import post_tags_association
from app.schemas.post import PostCreate, PostOut
from app.schemas.comment import CommentCreate, CommentOut
from app.api.v1.auth import get_current_user
from app.utils.logger import get_logger

router = APIRouter()

# Create a Post
@router.post("/", response_model=PostOut)
def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    return PostOut.model_validate(new_post)  # ✅ Ensure tag names are returned


# Get All Posts with Counts
@router.get("/", response_model=List[PostOut])
def get_all_posts(
    post_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Subqueries for counts
    likes_count_subquery = db.query(PostLike.post_id, func.count(PostLike.id).label('likes_count')).group_by(PostLike.post_id).subquery()
    comments_count_subquery = db.query(PostComment.post_id, func.count(PostComment.id).label('comments_count')).group_by(PostComment.post_id).subquery()
    saves_count_subquery = db.query(SavedPost.post_id, func.count(SavedPost.id).label('saves_count')).group_by(SavedPost.post_id).subquery()

    # Main query with optional post_type filter
    query = db.query(Post)
    if post_type:
        query = query.filter(Post.post_type == post_type)

    # Join with counts subqueries
    query = query.outerjoin(likes_count_subquery, Post.id == likes_count_subquery.c.post_id)\
                 .outerjoin(comments_count_subquery, Post.id == comments_count_subquery.c.post_id)\
                 .outerjoin(saves_count_subquery, Post.id == saves_count_subquery.c.post_id)

    # Select with coalesced counts
    posts = query.with_entities(
        Post,
        func.coalesce(likes_count_subquery.c.likes_count, 0).label('likes_count'),
        func.coalesce(comments_count_subquery.c.comments_count, 0).label('comments_count'),
        func.coalesce(saves_count_subquery.c.saves_count, 0).label('saves_count')
    ).all()

    return [
        PostOut(
            id=post.id,
            title=post.title,
            content=post.content,
            post_type=post.post_type,
            author_id=post.author_id,
            project_id=post.project_id,
            team_id=post.team_id,
            tags=[tag.name for tag in post.tags],
            # date=post.date.isoformat() if post.date else None,
            author={
                "username": post.author.username if post.author else "Unknown",
                "avatar_url": post.author.avatar_url if post.author else None
            },
            likes_count=likes_count,
            comments_count=comments_count,
            saves_count=saves_count
        )
        for post, likes_count, comments_count, saves_count in posts
    ]

@router.get("/filter_by_tags", response_model=List[PostOut])
def filter_posts_by_tags(
    tag_ids: List[int] = Query([]),  # List of tag IDs for filtering
    post_type: Optional[str] = "news",  # Default to "news"
    db: Session = Depends(get_db)
):
    # Subqueries for counts
    likes_count_subquery = db.query(PostLike.post_id, func.count(PostLike.id).label('likes_count')).group_by(PostLike.post_id).subquery()
    comments_count_subquery = db.query(PostComment.post_id, func.count(PostComment.id).label('comments_count')).group_by(PostComment.post_id).subquery()
    saves_count_subquery = db.query(SavedPost.post_id, func.count(SavedPost.id).label('saves_count')).group_by(SavedPost.post_id).subquery()

    # Main query
    query = db.query(Post)

    # Filter by post_type
    if post_type:
        query = query.filter(Post.post_type == post_type)

    # Filter by tags if tag_ids are provided
    if tag_ids:
        subquery = db.query(post_tags_association.c.post_id).filter(post_tags_association.c.tag_id.in_(tag_ids)).subquery()
        query = query.filter(Post.id.in_(subquery))

    # Join with counts subqueries
    query = query.outerjoin(likes_count_subquery, Post.id == likes_count_subquery.c.post_id)\
                 .outerjoin(comments_count_subquery, Post.id == comments_count_subquery.c.post_id)\
                 .outerjoin(saves_count_subquery, Post.id == saves_count_subquery.c.post_id)

    # Select with coalesced counts
    posts = query.with_entities(
        Post,
        func.coalesce(likes_count_subquery.c.likes_count, 0).label('likes_count'),
        func.coalesce(comments_count_subquery.c.comments_count, 0).label('comments_count'),
        func.coalesce(saves_count_subquery.c.saves_count, 0).label('saves_count')
    ).all()

    # Format response
    return [
        PostOut(
            id=post.id,
            title=post.title,
            content=post.content,
            post_type=post.post_type,
            author_id=post.author_id,
            project_id=post.project_id,
            team_id=post.team_id,
            tags=[tag.name for tag in post.tags],
            author={
                "username": post.author.username if post.author else "Unknown",
                "avatar_url": post.author.avatar_url if post.author else None
            },
            likes_count=likes_count,
            comments_count=comments_count,
            saves_count=saves_count
        )
        for post, likes_count, comments_count, saves_count in posts
    ]
    
@router.get("/my", response_model=List[PostOut])
def get_user_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves posts created by the currently authenticated user.
    """
    user_posts = db.query(Post).filter(Post.author_id == current_user.id).all()

    # ✅ Format posts correctly
    formatted_posts = [
        {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "post_type": post.post_type,
            "author_id": post.author_id,
            "project_id": post.project_id,
            "team_id": post.team_id,
            "tags": [tag.name for tag in post.tags],
        }
        for post in user_posts
    ]

    return formatted_posts
    
# Get Single Post with Counts
@router.get("/{post_id}", response_model=PostOut)
def get_single_post(post_id: int, db: Session = Depends(get_db)):
    likes_count = db.query(PostLike).filter(PostLike.post_id == post_id).count()
    comments_count = db.query(PostComment).filter(PostComment.post_id == post_id).count()
    saves_count = db.query(SavedPost).filter(SavedPost.post_id == post_id).count()

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return PostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        post_type=post.post_type,
        author_id=post.author_id,
        project_id=post.project_id,
        team_id=post.team_id,
        tags=[tag.name for tag in post.tags],
        # date=post.date.isoformat() if post.date else None,
        author={
            "username": post.author.username if post.author else "Unknown",
            "avatar_url": post.author.avatar_url if post.author else None
        },
        likes_count=likes_count,
        comments_count=comments_count,
        saves_count=saves_count
    )

@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a post if the current user is the author.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # ✅ Ensure only the author can delete
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}

@router.get("/search", response_model=List[PostOut])
def search_posts(
    query: str = Query(..., min_length=1),  # Обязательный параметр с минимальной длиной
    page: int = Query(1, ge=1),             # Номер страницы
    page_size: int = Query(10, ge=1, le=100),  # Размер страницы
    db: Session = Depends(get_db)
):
    """
    Поиск постов по заголовку, содержимому или связанным тегам с пагинацией.
    """
    logger = get_logger(__name__)
    logger.info(f"Получен поисковый запрос: query='{query}', page={page}, page_size={page_size}")

    # Выполняем поиск
    posts_query = db.query(Post).filter(
        (Post.title.ilike(f"%{query}%")) |
        (Post.content.ilike(f"%{query}%")) |
        (Post.tags.any(Tag.name.ilike(f"%{query}%")))
    )

    # Пагинация
    total = posts_query.count()
    posts = posts_query.offset((page - 1) * page_size).limit(page_size).all()

    logger.info(f"Найдено постов: {total} для query='{query}', возвращаем страницу {page} с {len(posts)} постами")

    # Форматируем результат
    result = [PostOut.model_validate(post) for post in posts]
    return result

# ✅ Like Post
@router.post("/{post_id}/like")
def like_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_like = db.query(PostLike).filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"detail": "Like removed"}
    
    new_like = PostLike(user_id=current_user.id, post_id=post_id)
    db.add(new_like)
    db.commit()
    return {"detail": "Post liked"}

@router.get("/{post_id}/likes")
def get_likes(post_id: int, db: Session = Depends(get_db)):
    like_count = db.query(PostLike).filter_by(post_id=post_id).count()
    return {"likes": like_count}

@router.get("/{post_id}/is_liked")
def is_post_liked(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_like = db.query(PostLike).filter_by(user_id=current_user.id, post_id=post_id).first()
    return {"is_liked": existing_like is not None}

# ✅ Save Post
@router.post("/{post_id}/save")
def save_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_save = db.query(SavedPost).filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing_save:
        db.delete(existing_save)
        db.commit()
        return {"detail": "Post unsaved"}

    new_save = SavedPost(user_id=current_user.id, post_id=post_id)
    db.add(new_save)
    db.commit()
    return {"detail": "Post saved"}

@router.get("/{post_id}/is_saved")
def is_post_saved(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_save = db.query(SavedPost).filter_by(user_id=current_user.id, post_id=post_id).first()
    return {"is_saved": existing_save is not None}

# Get comments
@router.get("/{post_id}/comments", response_model=List[CommentOut])
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    """
    Retrieves all comments for a specific post.
    """
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = db.query(PostComment).filter(PostComment.post_id == post_id).all()

    return [
        CommentOut(
            id=comment.id,
            content=comment.content,
            user_id=comment.user_id,  # ✅ Ensure `user_id` is directly returned
            created_at=comment.created_at
        )
        for comment in comments
    ]

@router.post("/{post_id}/comment", response_model=CommentOut)
def comment_post(
    post_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if the post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Create the new comment
    new_comment = PostComment(
        content=comment_data.content,
        user_id=current_user.id,
        post_id=post_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # Construct the response matching CommentOut
    return CommentOut(
        id=new_comment.id,
        content=new_comment.content,
        user_id=new_comment.user_id,
        created_at=new_comment.created_at,
        user={
            "username": new_comment.user.username if new_comment.user else "Unknown",
            "avatar_url": new_comment.user.avatar_url if new_comment.user and new_comment.user.avatar_url else None
        }
    )

# Get likes for a post
@router.get("/{post_id}/likes", response_model=List[int])
def get_post_likes(post_id: int, db: Session = Depends(get_db)):
    """
    Retrieves all user IDs who liked a specific post.
    """
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    likes = db.query(PostLike).filter(PostLike.post_id == post_id).all()

    return [like.user_id for like in likes]  # ✅ Return user IDs who liked the post
