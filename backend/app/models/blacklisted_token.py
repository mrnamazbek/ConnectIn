from sqlalchemy import Column, String, DateTime, func
from .base import Base

class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"
    token = Column(String, primary_key=True)
    created_at = Column(DateTime, default=func.now())