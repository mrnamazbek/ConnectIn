from enum import Enum
# enums.py
from enum import Enum as PyEnum

class ApplicationStatus(str, Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PENDING = "pending"

class UserRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"


class ConversationRole(str, Enum):
    GROUP = "group"
    DIRECT = "direct"
    TEAM = "team"


class TodoStatus(PyEnum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    BLOCKED = "Blocked"
    ARCHIVED = "Archived"

