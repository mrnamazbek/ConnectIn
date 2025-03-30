from sqlalchemy import Column, Integer, ForeignKey, Table
from .base import Base  # Make sure this is imported first


# Таблица для связи многих ко многим между skills и skill_categories
skill_mappings = Table(
    "skill_mappings",
    Base.metadata,
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("skill_categories.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)


# ✅ Many-to-Many: Project ↔ Skills
project_skills_association = Table(
    "project_skills",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# ✅ Many-to-Many: Project ↔ Tags
project_tags_association = Table(
    "project_tags",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# ✅ Many-to-Many: Project ↔ Members
project_members_association = Table(
    "project_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# ✅ Many-to-Many: Project ↔ Applicants
project_applications = Table(
    "project_applications",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# ✅ Many-to-Many: User ↔ Teams
user_teams_association = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# ✅ Many-to-Many: User ↔ Skills
user_skills_association = Table(
    "user_skills",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# ✅ Many-to-Many: Post ↔ Tags
post_tags_association = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# Many-to-Many: User ↔ Conversations
conversation_participants = Table(
    "conversation_participants",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("conversation_id", Integer, ForeignKey("conversations.id"), primary_key=True),
    extend_existing=True
)

# models/associations.py

# Many-to-Many: User ↔ Todo (Наблюдатели задач)
todo_watchers_association = Table(
    "todo_watchers",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("todo_id", Integer, ForeignKey("todos.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)

# Many-to-Many: Todo ↔ Tags (Теги задач)
todo_tags_association = Table(
    "todo_tags",
    Base.metadata,
    Column("todo_id", Integer, ForeignKey("todos.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True
)