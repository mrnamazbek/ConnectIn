"""
skill.py:
Определяет модель Skill и (опционально) промежуточные таблицы
для Many-to-Many с пользователями и проектами.

Ниже пример project_skills (также упомянут в project.py).
Вы также можете создать user_skills, если надо.
"""

from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .project import project_skills_association  # Explicit import

# Пример: может существовать также user_skills_association, если нужно
# user_skills_association = Table(
#     "user_skills",
#     Base.metadata,
#     Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
#     Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
# )

# Если уже объявлено в project.py, здесь повторять не нужно.
# Но если хотим, можем from .project import project_skills_association
# и так далее. Для примера перенесём логику project_skills_association туда.

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # ✅ Use explicit import instead of a string
    projects = relationship(
        "Project",
        secondary=project_skills_association,
        back_populates="skills"
    )

    def __repr__(self):
        return f"<Skill id={self.id} name={self.name}>"
