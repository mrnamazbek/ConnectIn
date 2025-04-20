from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas.chat import (
    MessageCreate, 
    MessageOut, 
    ConversationCreate, 
    ConversationOut,
    ConversationList,
    MessageList
)
from app.api.v1.auth import get_current_user
from app.models.relations.associations import conversation_participants
from datetime import datetime, timedelta

router = APIRouter()

# Cache for active conversations
active_conversations: Dict[int, List[int]] = {}

def _sort_and_convert_messages(messages: List[Message]) -> List[MessageOut]:
    """Optimized message sorting and conversion"""
    return [
        MessageOut.model_validate(msg)
        for msg in sorted(messages, key=lambda m: m.timestamp)
    ]

@router.get("/", response_model=List[ConversationList])
async def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: Optional[str] = None
) -> List[ConversationList]:
    """
    Get conversations with pagination and search
    """
    query = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.participants),
            joinedload(Conversation.messages)
        )
        .join(conversation_participants)
        .filter(conversation_participants.c.user_id == current_user.id)
    )

    if search:
        query = query.filter(
            Conversation.participants.any(User.username.ilike(f"%{search}%"))
        )

    # Get total count for pagination
    total = query.count()
    
    # Get conversations with latest message
    conversations = (
        query
        .order_by(desc(Conversation.updated_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    # Convert to response model with last message
    return [
        ConversationList(
            id=conv.id,
            type=conv.type.value,
            project_id=conv.project_id,
            team_id=conv.team_id,
            participants=[user.id for user in conv.participants],
            last_message=conv.messages[-1] if conv.messages else None,
            unread_count=len([m for m in conv.messages if m.id not in active_conversations.get(current_user.id, [])]),
            updated_at=conv.updated_at
        )
        for conv in conversations
    ]

@router.get("/{conversation_id}/messages", response_model=MessageList)
async def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    before: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=100)
) -> MessageList:
    """
    Get messages with pagination and date filtering
    """
    # Verify conversation access
    conversation = (
        db.query(Conversation)
        .join(conversation_participants)
        .filter(
            Conversation.id == conversation_id,
            conversation_participants.c.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Build query
    query = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(desc(Message.timestamp))
    )

    if before:
        query = query.filter(Message.timestamp < before)

    # Get messages
    messages = query.limit(limit).all()
    
    # Mark messages as read
    if current_user.id not in active_conversations:
        active_conversations[current_user.id] = []
    
    active_conversations[current_user.id].extend([m.id for m in messages])
    
    return MessageList(
        messages=_sort_and_convert_messages(messages),
        has_more=len(messages) == limit
    )

@router.post("/message", response_model=MessageOut)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> MessageOut:
    """
    Send a message with validation and notification
    """
    # Verify conversation access
    conversation = (
        db.query(Conversation)
        .join(conversation_participants)
        .filter(
            Conversation.id == message_data.conversation_id,
            conversation_participants.c.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Create message
    message = Message(
        conversation_id=message_data.conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        timestamp=datetime.utcnow()
    )
    
    db.add(message)
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(message)

    # Mark as read for sender
    if current_user.id not in active_conversations:
        active_conversations[current_user.id] = []
    active_conversations[current_user.id].append(message.id)

    return MessageOut.model_validate(message)

@router.post("/", response_model=ConversationOut)
async def create_conversation(
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ConversationOut:
    """
    Create a new conversation with validation
    """
    if conversation_data.type not in {"direct", "project", "team"}:
        raise HTTPException(status_code=400, detail="Invalid conversation type")

    # Check for existing direct conversation
    if conversation_data.type == "direct":
        existing = _find_existing_direct_conversation(
            db, 
            set(conversation_data.participant_ids) | {current_user.id}
        )
        if existing:
            return existing

    # Create new conversation
    conversation = Conversation(
        type=conversation_data.type,
        project_id=conversation_data.project_id,
        team_id=conversation_data.team_id,
        updated_at=datetime.utcnow()
    )
    db.add(conversation)
    db.commit()

    # Add participants
    participant_ids = set(conversation_data.participant_ids) | {current_user.id}
    participants = db.query(User).filter(User.id.in_(participant_ids)).all()
    
    if len(participants) != len(participant_ids):
        db.rollback()
        raise HTTPException(status_code=404, detail="Some participants not found")

    conversation.participants = participants
    db.commit()

    return ConversationOut(
        id=conversation.id,
        type=conversation.type.value,
        project_id=conversation.project_id,
        team_id=conversation.team_id,
        participants=[user.id for user in conversation.participants],
        messages=[]
    )

def _find_existing_direct_conversation(
    db: Session,
    participant_ids: set[int]
) -> Optional[ConversationOut]:
    """
    Find existing direct conversation between participants
    """
    return (
        db.query(Conversation)
        .join(conversation_participants)
        .filter(Conversation.type == "direct")
        .group_by(Conversation.id)
        .having(func.count(conversation_participants.c.user_id) == len(participant_ids))
        .having(
            func.every(conversation_participants.c.user_id.in_(participant_ids))
        )
        .first()
    )