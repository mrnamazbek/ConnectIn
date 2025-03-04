# models/__init__.py

from .base import Base
from .user import User
from .team import Team
from .project import Project
from .post import Post
from .tag import Tag
from .skill import Skill
from .chat import Conversation, Message
from .request import Request
from .review import Review
from .recommendation import Recommendation

# Import Many-to-Many association tables separately to avoid circular dependencies
from relations.associations import (
    user_teams_association,
    user_skills_association,
    project_skills_association,
    project_members_association,
    project_applications,
    post_tags_association,
    project_tags_association,
    conversation_participants
)

__all__ = [
    "Base",
    "User",
    "Team",
    "Project",
    "Skill",
    "Post",
    "Tag",
    "Request",
    "Review",
    "Recommendation",
    "Conversation", 
    #ConversationParticipant",
    "Message",
    "user_teams_association",
    "user_skills_association",
    "project_skills_association",
    "project_members_association",
    "project_applications",
    "post_tags_association",
    "project_tags_association",
    "conversation_participants"
]
