from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .project import project_members_association, project_applications

user_teams_association = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True),
)

user_skills_association = Table(
    "user_skills",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
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

    teams = relationship("Team", secondary=user_teams_association, back_populates="members")
    owned_projects = relationship("Project", back_populates="owner")
    projects = relationship("Project", secondary=project_members_association, back_populates="members")
    applied_projects = relationship("Project", secondary=project_applications, back_populates="applicants")
    skills = relationship("Skill", secondary=user_skills_association, back_populates="users")  # ✅ Fix association

    def __repr__(self):
        return f"<User id={self.id} username={self.username} email={self.email}>"
