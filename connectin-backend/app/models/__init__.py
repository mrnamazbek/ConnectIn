# models/__init__.py

from .base import Base
from .user import User
from .todo import Todo
from .team import Team
from .project import Project
from .post import Post
from .tag import Tag
from .skill_category import SkillCategory  # Import SkillCategory first
from .skill import Skill  # Then import Skill
from .chat import Conversation, Message
from .request import Request
from .review import Review
from .recommendation import Recommendation
from .comment import PostComment, ProjectComment
from .like import PostLike
from .save import SavedPost
from .vote import ProjectVote
from .blacklisted_token import BlacklistedToken
from .todo_comment import TodoComment


# Import Many-to-Many association tables separately to avoid circular dependencies
from .relations.associations import (
    conversation_participants,
    post_tags_association,
    project_applications,
    project_members_association,
    project_skills_association,
    project_tags_association,
    user_skills_association,
    user_teams_association,
    todo_tags_association,
    todo_watchers_association,
    skill_mappings,
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
    "SkillCategory",
    "Tag",
    "Team",
    "User",
    "BlacklistedToken",
    "conversation_participants",
    "post_tags_association",
    "project_applications",
    "project_members_association",
    "project_skills_association",
    "project_tags_association",
    "user_skills_association",
    "user_teams_association",
    "todo_watchers_association",
    "todo_tags_association",
    "skill_mappings",
]
