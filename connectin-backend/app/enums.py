from enum import Enum

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


