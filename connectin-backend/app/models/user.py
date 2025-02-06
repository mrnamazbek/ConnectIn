from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base

# Many-to-Many: User ↔ Teams
user_teams_association = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True),
    extend_existing=True
)

# Many-to-Many: User ↔ Skills
user_skills_association = Table(
    "user_skills",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
    extend_existing=True
)

# Many-to-Many: User ↔ Projects (Membership)
project_members_association = Table(
    "project_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    extend_existing=True
)

# Many-to-Many: User ↔ Projects (Applications)
project_applications = Table(
    "project_applications",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    extend_existing=True
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    github = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    telegram = Column(String(255), nullable=True)

    # ✅ A user can be a member of multiple teams
    teams = relationship("Team", secondary=user_teams_association, back_populates="members")

    # ✅ A user can own multiple projects
    owned_projects = relationship("Project", back_populates="owner")

    # ✅ A user can be a member of multiple projects
    projects = relationship("Project", secondary=project_members_association, back_populates="members")

    # ✅ A user can apply to multiple projects
    applied_projects = relationship("Project", secondary=project_applications, back_populates="applicants")

    # ✅ A user can write multiple posts
    posts = relationship("Post", back_populates="author")

    # ✅ A user can have multiple skills
    skills = relationship("Skill", secondary=user_skills_association, back_populates="users")

    def __repr__(self):
        return f"<User id={self.id} username={self.username} email={self.email}>"
