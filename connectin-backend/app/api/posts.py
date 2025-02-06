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

    if post_data.post_type == "project":
        project = db.query(Project).filter(Project.id == post_data.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        new_post.project_id = project.id

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
