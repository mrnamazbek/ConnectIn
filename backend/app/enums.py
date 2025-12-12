from enum import Enum
# enums.py
from enum import Enum as PyEnum

#------------------# Можно создать Enum для статусов
class SubscriptionStatusEnum(Enum):
    FREE = "free"
    ACTIVE = "active"
    PAST_DUE = "past_due" # Платеж просрочен
    CANCELED = "canceled"
#-----------------
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



