from enum import Enum

class ApplicationStatus(str, Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
