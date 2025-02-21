from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas.chat import MessageCreate, MessageOut, ConversationCreate, ConversationOut
from app.api.auth import get_current_user
from app.models.associations import conversation_participants

router = APIRouter()

# ✅ Get all conversations for the current user
@router.get("/", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    conversations = (
        db.query(Conversation)
        .options(joinedload(Conversation.participants), joinedload(Conversation.messages))
        .join(conversation_participants, Conversation.id == conversation_participants.c.conversation_id)
        .filter(conversation_participants.c.user_id == current_user.id)
        .distinct()
        .all()
    )

    return [
        ConversationOut(
            id=conv.id,
            type=conv.type.value,
            project_id=conv.project_id,
            team_id=conv.team_id,
            participants=[user.id for user in conv.participants],
            messages=[MessageOut.from_orm(msg) for msg in sorted(conv.messages, key=lambda m: m.timestamp)]
        ) for conv in conversations
    ]

# ✅ Get a single conversation's details
@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    conversation = (
        db.query(Conversation)
        .options(joinedload(Conversation.participants), joinedload(Conversation.messages))
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # ✅ Ensure user is a participant
    if current_user.id not in [user.id for user in conversation.participants]:
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation")

    return ConversationOut(
        id=conversation.id,
        type=conversation.type.value,
        project_id=conversation.project_id,
        team_id=conversation.team_id,
        participants=[user.id for user in conversation.participants],
        messages=[MessageOut.from_orm(msg) for msg in sorted(conversation.messages, key=lambda m: m.timestamp)]
    )

# ✅ Create a new conversation or get existing one
@router.post("/", response_model=ConversationOut)
def create_conversation(
    conversation_data: ConversationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if conversation_data.type not in {"direct", "project", "team"}:
        raise HTTPException(status_code=400, detail="Invalid conversation type")

    # ✅ If it's a direct conversation, check if it already exists
    if conversation_data.type == "direct":
        existing_conversation = (
            db.query(Conversation)
            .join(conversation_participants)
            .filter(
                Conversation.type == "direct",
                conversation_participants.c.user_id.in_([current_user.id] + conversation_data.participant_ids)
            )
            .group_by(Conversation.id)
            .having(
                func.count(conversation_participants.c.user_id) == len(conversation_data.participant_ids) + 1
            )
            .first()
        )

        if existing_conversation:
            return ConversationOut(
                id=existing_conversation.id,
                type=existing_conversation.type.value,
                project_id=existing_conversation.project_id,
                team_id=existing_conversation.team_id,
                participants=[user.id for user in existing_conversation.participants],
                messages=[MessageOut.from_orm(msg) for msg in sorted(existing_conversation.messages, key=lambda m: m.timestamp)]
            )

    # ✅ Create a new conversation
    conversation = Conversation(
        type=conversation_data.type,
        project_id=conversation_data.project_id,
        team_id=conversation_data.team_id,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    # ✅ Add participants (including the current user)
    all_participants = list(set(conversation_data.participant_ids + [current_user.id]))

    participants = db.query(User).filter(User.id.in_(all_participants)).all()

    if not participants:
        raise HTTPException(status_code=404, detail="No valid participants found")

    conversation.participants = participants
    db.commit()
    db.refresh(conversation)

    return ConversationOut(
        id=conversation.id,
        type=conversation.type.value,
        project_id=conversation.project_id,
        team_id=conversation.team_id,
        participants=[user.id for user in conversation.participants],
        messages=[]
    )

# ✅ Send a message in a conversation
@router.post("/message", response_model=MessageOut)
def send_message(
    message_data: MessageCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    conversation = (
        db.query(Conversation)
        .options(joinedload(Conversation.participants))
        .filter(Conversation.id == message_data.conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # ✅ Ensure user is a participant
    participant_ids = [user.id for user in conversation.participants]
    
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation")

    # ✅ Send message
    message = Message(
        conversation_id=message_data.conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return message
