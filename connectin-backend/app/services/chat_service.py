"""
Business logic for chat operations in the ConnectIn project.
Manages conversations and messages for users.
"""

from typing import List, Set, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func

from fastapi import HTTPException, status

from app.database.connection import get_db
from app.models.user import User
from app.models.chat import Conversation, Message
from app.models.relations.associations import conversation_participants
from app.schemas.chat import (
    ConversationCreate,
    ConversationOut,
    MessageCreate,
    MessageOut,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ChatService:
    """Service class for chat-related business logic."""

    @staticmethod
    def get_user_conversations(user: User, db: Session) -> List[ConversationOut]:
        """
        Retrieves all conversations for a given user.

        Args:
            user: The authenticated user.
            db: Database session.

        Returns:
            List[ConversationOut]: List of user's conversations.
        """
        conversations = (
            db.query(Conversation)
            .options(
                joinedload(Conversation.participants),
                joinedload(Conversation.messages)
            )
            .join(conversation_participants)
            .filter(conversation_participants.c.user_id == user.id)
            .distinct()
            .all()
        )

        return [
            ConversationOut(
                id=conv.id,
                type=conv.type.value,
                project_id=conv.project_id,
                team_id=conv.team_id,
                participants=[p.id for p in conv.participants],
                messages=ChatService._sort_messages(conv.messages)
            )
            for conv in conversations
        ]

    @staticmethod
    def get_conversation(conversation_id: int, user: User, db: Session) -> ConversationOut:
        """
        Retrieves a specific conversation by ID, checking user access.

        Args:
            conversation_id: ID of the conversation.
            user: The authenticated user.
            db: Database session.

        Returns:
            ConversationOut: The conversation details.

        Raises:
            HTTPException: If conversation not found or access denied.
        """
        conversation = (
            db.query(Conversation)
            .options(
                joinedload(Conversation.participants),
                joinedload(Conversation.messages)
            )
            .filter(Conversation.id == conversation_id)
            .first()
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if user.id not in [p.id for p in conversation.participants]:
            raise HTTPException(status_code=403, detail="Access denied to this conversation")

        return ConversationOut(
            id=conversation.id,
            type=conversation.type.value,
            project_id=conversation.project_id,
            team_id=conversation.team_id,
            participants=[p.id for p in conversation.participants],
            messages=ChatService._sort_messages(conversation.messages)
        )

    @staticmethod
    def create_conversation(data: ConversationCreate, user: User, db: Session) -> ConversationOut:
        """
        Creates a new conversation, handling direct chats and checking for duplicates.

        Args:
            data: Conversation creation data.
            user: The authenticated user (initiator).
            db: Database session.

        Returns:
            ConversationOut: The created conversation.

        Raises:
            HTTPException: If type is invalid or participants not found.
        """
        if data.type not in {"direct", "project", "team"}:
            raise HTTPException(status_code=400, detail="Invalid conversation type")

        participant_ids = set(data.participant_ids) | {user.id}

        # Check for existing direct conversation
        if data.type == "direct":
            existing = ChatService._find_existing_direct_conversation(participant_ids, db)
            if existing:
                return ChatService.get_conversation(existing.id, user, db)

        # Create new conversation
        conversation = Conversation(
            type=data.type,
            project_id=data.project_id,
            team_id=data.team_id,
        )
        db.add(conversation)
        db.flush()  # Get ID without committing yet

        # Validate and add participants
        participants = db.query(User).filter(User.id.in_(participant_ids)).all()
        if len(participants) != len(participant_ids):
            db.rollback()
            raise HTTPException(status_code=404, detail="One or more participants not found")

        conversation.participants = participants
        db.commit()
        db.refresh(conversation)
        logger.info(f"Conversation created: ID={conversation.id}, Type={data.type}")

        return ConversationOut(
            id=conversation.id,
            type=conversation.type.value,
            project_id=conversation.project_id,
            team_id=conversation.team_id,
            participants=[p.id for p in conversation.participants],
            messages=[]
        )

    @staticmethod
    def send_message(data: MessageCreate, user: User, db: Session) -> MessageOut:
        """
        Sends a message in a conversation, validating user access.

        Args:
            data: Message creation data.
            user: The authenticated user (sender).
            db: Database session.

        Returns:
            MessageOut: The sent message.

        Raises:
            HTTPException: If user lacks access to the conversation.
        """
        # Check if user is a participant
        participant_exists = db.query(conversation_participants).filter(
            conversation_participants.c.conversation_id == data.conversation_id,
            conversation_participants.c.user_id == user.id
        ).first()

        if not participant_exists:
            raise HTTPException(status_code=403, detail="No access to this conversation")

        # Create and save message
        message = Message(
            conversation_id=data.conversation_id,
            sender_id=user.id,
            content=data.content,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        logger.info(f"Message sent: Conversation ID={data.conversation_id}, Sender={user.id}")

        return MessageOut.model_validate(message)

    @staticmethod
    def _sort_messages(messages: List[Message]) -> List[MessageOut]:
        """Sorts messages by timestamp and converts to schema."""
        return [
            MessageOut.model_validate(msg)
            for msg in sorted(messages, key=lambda m: m.timestamp)
        ]

    @staticmethod
    def _find_existing_direct_conversation(participant_ids: Set[int], db: Session) -> Optional[Conversation]:
        """Finds an existing direct conversation with the exact set of participants."""
        return (
            db.query(Conversation)
            .join(conversation_participants)
            .filter(Conversation.type == "direct")
            .group_by(Conversation.id)
            .having(func.count(conversation_participants.c.user_id) == len(participant_ids))
            .having(func.every(conversation_participants.c.user_id.in_(participant_ids)))
            .first()
        )

# Example usage in API layer:
# from app.services.chats import ChatService
# @router.get("/", response_model=List[ConversationOut])
# async def get_conversations(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     return ChatService.get_user_conversations(current_user, db)