from sqlalchemy import Column, Integer, ForeignKey, Table
from app.models.base import Base  # Make sure this is imported first

from sqlalchemy import Column, Integer, Boolean, ForeignKey, Table
from app.models.base import Base

# ✅ Many-to-Many: User ↔ Teams
user_teams_association = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True),
    Column("is_admin", Boolean, default=False, nullable=False),  # Добавляем поле для роли
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

# user_teams_association = Table(
#     "user_teams",
#     Base.metadata,
#     Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
#     Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
#     extend_existing=True
# )

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