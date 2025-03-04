"""
Репозиторий для работы с таблицами бесед и сообщений.
"""

from typing import List, Set
from sqlalchemy.orm import Session, joinedload
from app.models import Conversation, Message, User
from app.models.relations.associations import conversation_participants
from sqlalchemy import func

class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_conversations(self, user_id: int) -> List[Conversation]:
        """Получить все беседы пользователя."""
        return (
            self.db.query(Conversation)
            .options(
                joinedload(Conversation.participants),
                joinedload(Conversation.messages)
            )
            .join(conversation_participants)
            .filter(conversation_participants.c.user_id == user_id)
            .distinct()
            .all()
        )

    def get_conversation_by_id(self, conversation_id: int) -> Conversation | None:
        """Получить беседу по ID с предзагрузкой участников и сообщений."""
        return (
            self.db.query(Conversation)
            .options(
                joinedload(Conversation.participants),
                joinedload(Conversation.messages)
            )
            .filter(Conversation.id == conversation_id)
            .first()
        )

    def user_has_access(self, conversation_id: int, user_id: int) -> bool:
        """Проверить, есть ли у пользователя доступ к беседе."""
        return self.db.query(
            conversation_participants
            .filter_by(conversation_id=conversation_id, user_id=user_id)
            .exists()
        ).scalar()

    def find_existing_direct_conversation(self, participant_ids: Set[int]) -> Conversation | None:
        """Найти существующую direct-беседу."""
        return (
            self.db.query(Conversation)
            .join(conversation_participants)
            .filter(Conversation.type == "direct")
            .group_by(Conversation.id)
            .having(func.count(conversation_participants.c.user_id) == len(participant_ids))
            .having(func.every(conversation_participants.c.user_id.in_(participant_ids)))
            .first()
        )

    def create_conversation(self, type: str, project_id: int | None, team_id: int | None, participant_ids: Set[int]) -> Conversation:
        """Создать новую беседу."""
        conversation = Conversation(type=type, project_id=project_id, team_id=team_id)
        self.db.add(conversation)
        self.db.commit()
        participants = self.db.query(User).filter(User.id.in_(participant_ids)).all()
        if len(participants) != len(participant_ids):
            self.db.rollback()
            raise ValueError("Некоторые участники не найдены")
        conversation.participants = participants
        self.db.commit()
        return conversation

    def create_message(self, conversation_id: int, sender_id: int, content: str) -> Message:
        """Создать новое сообщение."""
        message = Message(conversation_id=conversation_id, sender_id=sender_id, content=content)
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message