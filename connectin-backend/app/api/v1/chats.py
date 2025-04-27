from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from app.database import get_db
from app.models.chat import Conversation, Message, ConversationType
from app.schemas.chat import (
    ConversationCreate,
    ConversationOut,
    ConversationList,
    MessageCreate,
    MessageOut,
    MessageList,
    UserBasicInfo,
    ReadReceipt
)
from app.api.v1.auth import get_current_user
from app.services.chat_service import ChatService
from app.utils.s3_chat_client import create_presigned_get_url
from app.models import User
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_user_basic_info(users) -> List[UserBasicInfo]:
    """Convert User objects to UserBasicInfo schemas"""
    return [
        UserBasicInfo(
            id=user.id,
            username=user.username,
            avatar_url=getattr(user, 'avatar_url', None)
        ) for user in users
    ]

def get_unread_count(conversation_id: int, user_id: int, db: Session) -> int:
    """Get count of unread messages in conversation for user"""
    return db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
        Message.read.is_(None)
    ).count()

@router.get("/", response_model=List[ConversationList])
async def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: Optional[str] = None,
):
    """Get all conversations for the current user with pagination and search."""
    try:
        query = (
            db.query(Conversation)
            .join(Conversation.participants)
            .filter(User.id == current_user.id)
            .order_by(desc(Conversation.updated_at))
        )

        if search:
            query = query.join(User, Conversation.participants).filter(
                and_(
                    User.id != current_user.id,
                    or_(
                        User.username.ilike(f"%{search}%"),
                        User.email.ilike(f"%{search}%"),
                        User.first_name.ilike(f"%{search}%"),
                        User.last_name.ilike(f"%{search}%")
                    )
                )
            )

        total = query.count()
        conversations = query.offset((page - 1) * per_page).limit(per_page).all()
        
        result = []
        for conv in conversations:
            # Get other participants (not the current user)
            other_participants = [user for user in conv.participants if user.id != current_user.id]
            
            # Get unread messages count
            unread_count = get_unread_count(conv.id, current_user.id, db)
            
            # Ensure we have a valid last_message
            last_message = None
            if conv.messages:
                last_message = conv.messages[0]
                # Ensure content is never empty
                if last_message.content is None or last_message.content == "":
                    last_message.content = "(empty message)"
            
            result.append(
                ConversationList(
                    id=conv.id,
                    type=conv.type,
                    participants=[user.id for user in conv.participants],
                    participants_info=get_user_basic_info(other_participants),
                    last_message=last_message,
                    updated_at=conv.updated_at,
                    unread_count=unread_count
                )
            )
        
        return result
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversations")

@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific conversation by ID."""
    try:
        conversation = (
            db.query(Conversation)
            .join(Conversation.participants)
            .filter(
                Conversation.id == conversation_id,
                User.id == current_user.id,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get other participants (not the current user)
        other_participants = [user for user in conversation.participants if user.id != current_user.id]
        
        # Get unread messages count
        unread_count = get_unread_count(conversation_id, current_user.id, db)
        
        # Ensure messages have valid content
        messages = conversation.messages[:50]  # Limit to most recent 50 messages
        for msg in messages:
            if msg.content is None or msg.content == "":
                msg.content = "(empty message)"
        
        return ConversationOut(
            id=conversation.id,
            type=conversation.type,
            participants=[user.id for user in conversation.participants],
            participants_info=get_user_basic_info(other_participants),
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=messages,
            unread_count=unread_count
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation")

@router.post("/", response_model=ConversationOut)
async def create_conversation(
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new conversation."""
    try:
        # Check if conversation already exists for direct messages
        if conversation_data.type == ConversationType.DIRECT.value:
            # For direct messages, check if a conversation already exists with these participants
            all_participant_ids = [current_user.id] + conversation_data.participant_ids
            
            # Get all conversations where current user is a participant
            user_conversations = (
                db.query(Conversation)
                .join(Conversation.participants)
                .filter(
                    Conversation.type == ConversationType.DIRECT.value,
                    User.id == current_user.id
                )
                .all()
            )
            
            # Check each conversation to see if it has exactly these participants
            for conv in user_conversations:
                conv_participant_ids = [p.id for p in conv.participants]
                if set(conv_participant_ids) == set(all_participant_ids) and len(conv_participant_ids) == len(all_participant_ids):
                    # Use same method as get_conversation to return consistent format
                    other_participants = [user for user in conv.participants if user.id != current_user.id]
                    unread_count = get_unread_count(conv.id, current_user.id, db)
                    
                    # Ensure messages have valid content
                    messages = conv.messages[:50]  # Limit to most recent 50 messages
                    for msg in messages:
                        if msg.content is None or msg.content == "":
                            msg.content = "(empty message)"
                    
                    return ConversationOut(
                        id=conv.id,
                        type=conv.type,
                        participants=[user.id for user in conv.participants],
                        participants_info=get_user_basic_info(other_participants),
                        created_at=conv.created_at,
                        updated_at=conv.updated_at,
                        messages=messages,
                        unread_count=unread_count
                    )

        # If no existing conversation is found, create a new one
        # Get all participants including the current user
        all_participant_ids = [current_user.id] + conversation_data.participant_ids
        participants = db.query(User).filter(User.id.in_(all_participant_ids)).all()

        if len(participants) != len(all_participant_ids):
            missing_ids = set(all_participant_ids) - set(user.id for user in participants)
            raise HTTPException(status_code=404, detail=f"Some participants not found: {missing_ids}")

        conversation = Conversation(
            type=conversation_data.type,
            participants=participants,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        # Get other participants (not the current user)
        other_participants = [user for user in conversation.participants if user.id != current_user.id]
        
        return ConversationOut(
            id=conversation.id,
            type=conversation.type,
            participants=[user.id for user in conversation.participants],
            participants_info=get_user_basic_info(other_participants),
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[],
            unread_count=0
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@router.get("/{conversation_id}/messages", response_model=MessageList)
async def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
):
    """Get messages for a conversation with pagination."""
    try:
        # Verify conversation access
        conversation = (
            db.query(Conversation)
            .join(Conversation.participants)
            .filter(
                Conversation.id == conversation_id,
                User.id == current_user.id,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(desc(Message.timestamp))
            .offset((page - 1) * per_page)
            .limit(per_page + 1)
            .all()
        )

        has_more = len(messages) > per_page
        messages = messages[:per_page]
        
        # Ensure messages have valid content
        for msg in messages:
            if msg.content is None or msg.content == "":
                msg.content = "(empty message)"
        
        # Mark unread messages as read
        unread_messages = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.sender_id != current_user.id,
                Message.read.is_(None)
            )
            .all()
        )
        
        now = datetime.utcnow()
        for msg in unread_messages:
            msg.read = now
        
        db.commit()

        return MessageList(
            messages=messages,
            has_more=has_more,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving messages for conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")

@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message in a conversation."""
    try:
        # Verify conversation access
        conversation = (
            db.query(Conversation)
            .join(Conversation.participants)
            .filter(
                Conversation.id == conversation_id,
                User.id == current_user.id,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Ensure content is never empty
        content = message_data.content
        if content is None or content == "":
            content = "(empty message)"

        message = Message(
            content=content,
            conversation_id=conversation_id,
            sender_id=current_user.id,
        )
        db.add(message)
        
        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(message)

        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message in conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.post("/{conversation_id}/read", status_code=204)
async def mark_as_read(
    conversation_id: int,
    read_receipt: ReadReceipt,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark messages as read."""
    try:
        # Verify conversation access
        conversation = (
            db.query(Conversation)
            .join(Conversation.participants)
            .filter(
                Conversation.id == conversation_id,
                User.id == current_user.id,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # If message_ids is empty, mark all unread messages in the conversation as read
        if not read_receipt.message_ids:
            unread_messages = (
                db.query(Message)
                .filter(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != current_user.id,
                    Message.read.is_(None)
                )
                .all()
            )
        else:
            # Otherwise, mark only specified messages
            unread_messages = (
                db.query(Message)
                .filter(
                    Message.id.in_(read_receipt.message_ids),
                    Message.conversation_id == conversation_id,
                    Message.sender_id != current_user.id,
                    Message.read.is_(None)
                )
                .all()
            )
        
        read_time = read_receipt.read_at
        for message in unread_messages:
            message.read = read_time
        
        db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking messages as read in conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark messages as read")

# starting media to chat


# connectin-backend/app/api/v1/chat.py

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.chat import Message, Conversation, ConversationType
from app.schemas.chat import (
    MessageCreate, MessageOut, MessageList, ConversationCreate,
    ConversationOut, ConversationList, ReadReceipt
)
from app.api.v1.auth import get_current_user
from app.services.chat_service import ChatService
from app.utils.s3_chat_client import create_presigned_get_url
from typing import Dict, Optional, List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# Все существующие маршруты остаются без изменений

# Добавляем новый маршрут для получения signed URL для скачивания/просмотра медиа
@router.get("/media/access-url")
async def get_media_access_url(
        media_url: str = Query(..., description="Полный URL медиафайла в S3"),
        current_user: User = Depends(get_current_user)
):
    """
    Генерирует временную ссылку для доступа к приватному медиафайлу.

    Клиент должен использовать эту ссылку для просмотра/скачивания приватных медиафайлов.
    Ссылка действительна ограниченное время (обычно 1 час).
    """
    try:
        # Извлекаем key из полного URL
        # Пример media_url: https://bucket-name.s3.region.amazonaws.com/chat_media/123/file.jpg
        # Нам нужно получить: chat_media/123/file.jpg

        # Проверяем что URL относится к нашему бакету S3
        if "amazonaws.com" not in media_url:
            raise HTTPException(status_code=400, detail="Недопустимый URL медиафайла")

        # Извлекаем ключ объекта из URL
        object_key = media_url.split(".amazonaws.com/")[1]

        # Получаем временную ссылку для доступа
        presigned_url = create_presigned_get_url(object_key)

        if not presigned_url:
            raise HTTPException(status_code=404, detail="Не удалось получить доступ к медиафайлу")

        return {"access_url": presigned_url}

    except Exception as e:
        logger.error(f"Ошибка при создании access URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при создании ссылки для доступа")