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

router = APIRouter()

# 🔹 Create a Post (With Tag Selection)
@router.post("/", response_model=PostOut)
def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new post. Users can assign tags (for news & project posts).
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

    # ✅ Assign Tags (Fix)
    if post_data.tag_ids:
        selected_tags = db.query(Tag).filter(Tag.id.in_(post_data.tag_ids)).all()
        if not selected_tags:
            raise HTTPException(status_code=400, detail="Invalid tags selected.")
        new_post.tags = selected_tags  # ✅ Assign the retrieved tags

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return PostOut.from_orm(new_post)  # ✅ Ensure tag names are returned


# 🔹 Get All Posts
@router.get("/", response_model=List[PostOut])
def get_all_posts(db: Session = Depends(get_db)):
    """
    Retrieves all posts with correctly formatted tags.
    """
    posts = db.query(Post).all()

    # ✅ Convert each post to a dictionary and extract tag names
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
            "skills": [skill.name for skill in post.skills],  # ✅ Extract skill names
            "tags": [tag.name for tag in post.tags],  # ✅ Extract tag names
        })

    return formatted_posts  # ✅ Return formatted list

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
            "skills": [skill.name for skill in post.skills],
            "tags": [tag.name for tag in post.tags],
        }
        for post in user_posts
    ]

    return formatted_posts

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
    query: str,
    db: Session = Depends(get_db)
):
    """
    Searches posts by title, content, or associated tags.
    """
    if not query:
        return []  # ✅ Return empty list if no query is provided

    # 🔹 Search in title, content, or tags
    posts = db.query(Post).filter(
        (Post.title.ilike(f"%{query}%")) |
        (Post.content.ilike(f"%{query}%")) |
        (Post.tags.any(Tag.name.ilike(f"%{query}%")))  # ✅ Search in tags
    ).all()

    return [PostOut.from_orm(post) for post in posts]
