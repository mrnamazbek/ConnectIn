from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database.connection import get_db
from app.models.user import User
from app.models.chat import Conversation, Message, ConversationType
from app.api.v1.auth import get_current_user
from sqlalchemy import and_, or_, desc
from pydantic import BaseModel
from datetime import datetime
from app.utils.s3_chat_client import create_presigned_post_url

router = APIRouter()

# Pydantic models for request/response
class MessageSchema(BaseModel):
    id: int
    content: str
    timestamp: datetime
    sender_id: int
    conversation_id: int
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    media_name: Optional[str] = None

    class Config:
        orm_mode = True

class ConversationSchema(BaseModel):
    id: int
    type: str
    created_at: datetime
    updated_at: datetime
    participants: List[Dict[str, Any]]
    last_message: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True

class CreateConversationRequest(BaseModel):
    participant_ids: List[int]

class GetUploadUrlRequest(BaseModel):
    file_name: str
    file_type: str
    
# Helper function to serialize a User model to dict
def serialize_user(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "avatar_url": user.avatar_url
    }

# Helper function to serialize a Message model to dict
def serialize_message(message: Message) -> Dict[str, Any]:
    if not message:
        return None
        
    sender = message.sender
    return {
        "id": message.id,
        "content": message.content,
        "timestamp": message.timestamp,
        "sender_id": message.sender_id,
        "conversation_id": message.conversation_id,
        "sender_name": f"{sender.first_name} {sender.last_name}" if sender else "Unknown User",
        "sender_avatar": sender.avatar_url if sender else None,
        "media_url": message.media_url,
        "media_type": message.media_type,
        "media_name": message.media_name
    }

# Helper function to serialize a Conversation model to dict
def serialize_conversation(conversation: Conversation) -> Dict[str, Any]:
    return {
        "id": conversation.id,
        "type": conversation.type,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "participants": [serialize_user(p) for p in conversation.participants],
        "last_message": serialize_message(conversation.last_message) if conversation.last_message else None
    }

# Routes
@router.get("/conversations")
async def get_user_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    conversations = current_user.conversations
    return [serialize_conversation(c) for c in conversations]

@router.post("/conversations", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: CreateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation"""
    # Add current user to participants
    all_participant_ids = list(set(request.participant_ids + [current_user.id]))
    
    # Check if all users exist
    participants = db.query(User).filter(User.id.in_(all_participant_ids)).all()
    if len(participants) != len(all_participant_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more users not found"
        )
    
    # Check if a conversation already exists with the same participants
    for conversation in current_user.conversations:
        # Get ids of all participants in this conversation
        participant_ids = [p.id for p in conversation.participants]
        # If the participant sets match, return the existing conversation
        if set(participant_ids) == set(all_participant_ids) and conversation.type == ConversationType.DIRECT:
            return serialize_conversation(conversation)
    
    # Create a new conversation
    conversation = Conversation(type=ConversationType.DIRECT)
    conversation.participants = participants
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return serialize_conversation(conversation)

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific conversation"""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Check if user is a participant
    if current_user.id not in [p.id for p in conversation.participants]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a participant in this conversation"
        )
    
    return serialize_conversation(conversation)

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    limit: int = 20,
    before_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a specific conversation with pagination"""
    # Check if the conversation exists and user is a participant
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if current_user.id not in [p.id for p in conversation.participants]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a participant in this conversation"
        )
    
    # Query messages with pagination
    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    
    if before_id:
        before_message = db.query(Message).filter(Message.id == before_id).first()
        if before_message:
            query = query.filter(Message.timestamp < before_message.timestamp)
    
    messages = query.order_by(desc(Message.timestamp)).limit(limit).all()
    
    # Format the response with sender information
    result = [serialize_message(message) for message in messages]
    
    return result

@router.post("/upload_url")
async def get_upload_url(
    request: GetUploadUrlRequest,
    current_user: User = Depends(get_current_user)
):
    """Get a presigned URL for uploading images to S3"""
    presigned_data = create_presigned_post_url(
        file_name=request.file_name,
        file_type=request.file_type,
        user_id=current_user.id
    )
    
    if not presigned_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate upload URL"
        )
    
    return presigned_data 