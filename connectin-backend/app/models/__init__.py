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
from .comment import PostComment, ProjectComment
from .like import PostLike
from .save import SavedPost
from .vote import ProjectVote

# Import Many-to-Many association tables separately to avoid circular dependencies
from .associations import (
    conversation_participants,
    post_tags_association,
    project_applications,
    project_members_association,
    project_skills_association,
    project_tags_association,
    user_skills_association,
    user_teams_association,
)

__all__ = [
    "Base",
    "Chat",
    "Conversation",
    "ConversationParticipant",
    "Message",
    "Post",
    "PostComment",
    "PostLike",
    "Project",
    "ProjectComment",
    "ProjectVote",
    "Recommendation",
    "Request",
    "Review",
    "SavedPost",
    "Skill",
    "Tag",
    "Team",
    "User",
    "conversation_participants",
    "post_tags_association",
    "project_applications",
    "project_members_association",
    "project_skills_association",
    "project_tags_association",
    "user_skills_association",
    "user_teams_association",
]
