from typing import List, cast
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas.chat import MessageCreate, MessageOut, ConversationCreate, ConversationOut
from app.api.auth import get_current_user
from app.models.associations import conversation_participants

router = APIRouter()


def _sort_and_convert_messages(messages: List[Message]) -> List[MessageOut]:
    """Сортировка сообщений по времени и преобразование в схему"""
    return [
        MessageOut.model_validate(msg)
        for msg in sorted(messages, key=lambda m: m.timestamp)
    ]


@router.get("/", response_model=List[ConversationOut])
def get_conversations(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> List[ConversationOut]:
    """
    Получение всех бесед пользователя с оптимизированными запросами:
    - Использование cast для явного указания типа отношений
    - Оптимизированная проверка участия
    - Снижение нагрузки на БД
    """
    conversations = (
        db.query(Conversation)
        .options(
            joinedload(cast(str, Conversation.participants)),
            joinedload(cast(str, Conversation.messages))
        )
        .join(conversation_participants)
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
            messages=_sort_and_convert_messages(conv.messages)
        )
        for conv in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
        conversation_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> ConversationOut:
    """Оптимизированная проверка прав доступа с использованием генератора"""
    conversation = (
        db.query(Conversation)
        .options(
            joinedload(cast(str, Conversation.participants)),
            joinedload(cast(str, Conversation.messages))
        )
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Беседа не найдена")

    # Быстрая проверка через генератор
    if not any(p.id == current_user.id for p in conversation.participants):
        raise HTTPException(status_code=403, detail="Нет доступа к беседе")

    return ConversationOut(
        id=conversation.id,
        type=conversation.type.value,
        project_id=conversation.project_id,
        team_id=conversation.team_id,
        participants=[user.id for user in conversation.participants],
        messages=_sort_and_convert_messages(conversation.messages)
    )


@router.post("/", response_model=ConversationOut)
def create_conversation(
        conversation_data: ConversationCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> ConversationOut:
    """Оптимизация поиска существующих бесед через множества"""
    if conversation_data.type not in {"direct", "project", "team"}:
        raise HTTPException(status_code=400, detail="Недопустимый тип беседы")

    if conversation_data.type == "direct":
        participant_ids = set(conversation_data.participant_ids) | {current_user.id}
        existing = _find_existing_direct_conversation(db, participant_ids)
        if existing:
            return existing

    # Оптимизированное создание беседы
    conversation = _create_new_conversation(db, conversation_data, current_user)
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
) -> ConversationOut | None:
    """Оптимизированный поиск существующей direct-беседы"""
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


def _create_new_conversation(
        db: Session,
        data: ConversationCreate,
        user: User
) -> Conversation:
    """Оптимизированное создание беседы с валидацией участников"""
    conversation = Conversation(
        type=data.type,
        project_id=data.project_id,
        team_id=data.team_id,
    )
    db.add(conversation)
    db.commit()

    participant_ids = set(data.participant_ids) | {user.id}
    participants = db.query(User).filter(User.id.in_(participant_ids)).all()

    if len(participants) != len(participant_ids):
        db.rollback()
        raise HTTPException(status_code=404, detail="Участники не найдены")

    conversation.participants = participants
    db.commit()
    return conversation


@router.post("/message", response_model=MessageOut)
def send_message(
        message_data: MessageCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> MessageOut:
    """Оптимизированная проверка прав через EXISTS"""
    exists = db.query(Conversation).filter(
        Conversation.id == message_data.conversation_id
    ).join(
        conversation_participants
    ).filter(
        conversation_participants.c.user_id == current_user.id
    ).exists()

    if not db.query(exists).scalar():
        raise HTTPException(status_code=403, detail="Нет доступа к беседе")

    message = Message(
        conversation_id=message_data.conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return MessageOut.model_validate(message)