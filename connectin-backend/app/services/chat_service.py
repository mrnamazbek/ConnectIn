# connectin-backend/app/services/chat_service.py
import logging
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, update, and_, func, desc # Добавили desc
from datetime import datetime, timezone
import asyncio
from typing import List, Optional, Set

# --- Импорты ---
from app.models.chat import Message, Conversation, ConversationParticipant
from app.models.user import User
from app.schemas.chat import MessageCreate, ConversationCreate, UserBasicInfo, ConversationList, MessageOut # Импортируем нужные схемы
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = logging.getLogger(__name__)

class ChatService:

    # --- Участники ---
    @staticmethod
    async def is_user_participant(db: Session, user_id: int, conversation_id: int) -> bool:
        """Асинхронно проверяет, является ли пользователь участником чата."""
        def db_check():
            q = select(ConversationParticipant.user_id).where(
                ConversationParticipant.user_id == user_id,
                ConversationParticipant.conversation_id == conversation_id
            ).limit(1)
            return db.execute(select(q.exists())).scalar_one() # scalar_one вернет True/False
        try:
            return await asyncio.to_thread(db_check)
        except SQLAlchemyError as e:
            logger.exception(f"DB error checking participation U:{user_id} C:{conversation_id}: {e}")
            return False

    # --- Сообщения ---
    @staticmethod
    async def save_message(db: Session, msg_data: MessageCreate, sender: User) -> Optional[Message]:
        """Асинхронно сохраняет сообщение и обновляет время разговора."""
        def db_save():
            try:
                # Проверяем участие отправителя в чате перед сохранением
                conversation = db.scalar(
                    select(Conversation).join(Conversation.participants_assoc).where(
                        Conversation.id == msg_data.conversation_id,
                        ConversationParticipant.user_id == sender.id
                    )
                )
                if not conversation:
                    logger.warning(f"U:{sender.id} attempt save message to non-existent/unauthorized C:{msg_data.conversation_id}")
                    return None

                # Создаем и сохраняем сообщение
                with db.begin_nested(): # Транзакция для сообщения и обновления conversation
                    db_msg = Message(
                        sender_id=sender.id,
                        conversation_id=msg_data.conversation_id,
                        content=msg_data.content,
                        media_url=msg_data.media_url,
                        media_type=msg_data.media_type,
                        media_name=msg_data.media_name,
                        timestamp=datetime.now(timezone.utc)
                    )
                    db.add(db_msg)
                    # Обновляем updated_at у разговора
                    conversation.updated_at = db_msg.timestamp
                    db.add(conversation)
                # Commit nested transaction

                db.refresh(db_msg) # Получаем ID и timestamp
                logger.info(f"Message saved: ID={db_msg.id} in C:{db_msg.conversation_id} by U:{sender.id}")
                return db_msg
            except SQLAlchemyError as e:
                 logger.exception(f"DB error saving message U:{sender.id} C:{msg_data.conversation_id}: {e}")
                 db.rollback()
                 return None

        saved_message = await asyncio.to_thread(db_save)
        return saved_message

    @staticmethod
    async def get_messages(db: Session, conversation_id: int, user_id: int, skip: int = 0, limit: int = 50) -> List[Message]:
        """Асинхронно получает историю сообщений чата с пагинацией."""
        # Проверяем доступ
        if not await ChatService.is_user_participant(db, user_id, conversation_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this conversation")

        def db_get():
            try:
                stmt = (
                    select(Message)
                    .where(Message.conversation_id == conversation_id)
                    .order_by(Message.timestamp.desc())
                    .offset(skip)
                    .limit(limit)
                    # Опционально: сразу подгружаем отправителя
                    .options(selectinload(Message.sender).load_only(User.id, User.username, User.avatar_url))
                )
                messages = db.scalars(stmt).all()
                return list(messages) # Возвращаем список
            except SQLAlchemyError as e:
                 logger.exception(f"DB error fetching messages C:{conversation_id} for U:{user_id}: {e}")
                 return [] # Возвращаем пустой список при ошибке

        messages = await asyncio.to_thread(db_get)
        return messages

    @staticmethod
    async def update_read_status(db: Session, conversation_id: int, user_id: int, message_ids: List[int]):
        """Асинхронно обновляет статус прочтения сообщений."""
        if not message_ids: return
        def db_update():
            updated_count = 0
            try:
                with db.begin_nested(): # Используем транзакцию
                    now_utc = datetime.now(timezone.utc)
                    stmt = update(Message).where(
                        Message.id.in_(message_ids),
                        Message.conversation_id == conversation_id,
                        Message.sender_id != user_id,
                        Message.read.is_(None)
                    ).values(read=now_utc).execution_options(synchronize_session=False)
                    result = db.execute(stmt)
                    updated_count = result.rowcount
                logger.info(f"Updated read status for {updated_count} messages in C:{conversation_id} by U:{user_id}")
            except SQLAlchemyError as e:
                 logger.exception(f"DB error updating read status C:{conversation_id} U:{user_id}: {e}")
                 db.rollback()

        await asyncio.to_thread(db_update)

    # --- Разговоры (Conversations) ---

    @staticmethod
    async def get_user_conversations(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[ConversationList]:
        """Асинхронно получает список чатов пользователя с доп. информацией."""

        def db_get_convos():
            try:
                # Сложный запрос для получения списка чатов с последним сообщением,
                # информацией об участниках и счетчиком непрочитанных.
                # Это пример, возможно, потребует оптимизации или разделения на части.

                # Подзапрос для последнего сообщения в каждом чате
                last_msg_subq = (
                    select(
                        Message.conversation_id,
                        func.max(Message.timestamp).label('max_ts')
                    )
                    .group_by(Message.conversation_id)
                    .subquery('last_msg_subq')
                )

                # Подзапрос для подсчета непрочитанных сообщений
                unread_subq = (
                    select(
                        Message.conversation_id,
                        func.count(Message.id).label('unread_count')
                    )
                    .where(
                        Message.read.is_(None),
                        Message.sender_id != user_id # Не считаем свои непрочитанные
                    )
                    .group_by(Message.conversation_id)
                    .subquery('unread_subq')
                )

                # Основной запрос
                stmt = (
                    select(
                        Conversation,
                        Message, # Последнее сообщение
                        User, # Информация об участниках (нужен join)
                        unread_subq.c.unread_count
                    )
                    # Присоединяем таблицу участников, чтобы выбрать чаты пользователя
                    .join(Conversation.participants_assoc)
                    .where(ConversationParticipant.user_id == user_id)
                    # Присоединяем последнее сообщение (опционально)
                    .outerjoin(last_msg_subq, last_msg_subq.c.conversation_id == Conversation.id)
                    .outerjoin(Message, and_(
                        Message.conversation_id == Conversation.id,
                        Message.timestamp == last_msg_subq.c.max_ts
                    ))
                     # Присоединяем участников для получения их данных
                     # ВАЖНО: Этот join вернет несколько строк на один чат, если участников > 2
                     # Нужно будет группировать на стороне Python или изменить запрос
                    .outerjoin(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
                    .outerjoin(User, User.id == ConversationParticipant.user_id)
                     # Присоединяем счетчик непрочитанных
                    .outerjoin(unread_subq, unread_subq.c.conversation_id == Conversation.id)
                    # Загружаем данные отправителя последнего сообщения
                    .options(selectinload(Message.sender).load_only(User.id, User.username, User.avatar_url))
                    .order_by(desc(Conversation.updated_at)) # Сортируем по последнему обновлению
                    .offset(skip)
                    .limit(limit * 3) # Загружаем с запасом из-за join'ов
                )

                results = db.execute(stmt).mappings().all() # Получаем все строки

                # --- Группировка результатов на стороне Python ---
                # Так как join с участниками возвращает несколько строк на чат,
                # нам нужно сгруппировать их.
                convo_map: Dict[int, Dict] = {}
                for row in results:
                    convo_id = row['Conversation'].id
                    if convo_id not in convo_map:
                         # Создаем запись для нового чата
                         last_msg_obj = MessageOut.model_validate(row['Message']) if row['Message'] else None
                         convo_map[convo_id] = {
                             "id": convo_id,
                             "type": row['Conversation'].type,
                             "updated_at": row['Conversation'].updated_at or row['Conversation'].created_at,
                             "last_message": last_msg_obj,
                             "unread_count": row['unread_count'] or 0,
                             "participants_info": set() # Используем set для уникальности участников
                         }
                    # Добавляем информацию об участнике (если есть)
                    if row['User']:
                         user_info = UserBasicInfo.model_validate(row['User'])
                         convo_map[convo_id]["participants_info"].add(user_info) # Добавляем в set

                # Преобразуем результат в нужный формат ConversationListOut
                output_list: List[ConversationListOut] = []
                for convo_id, convo_data in convo_map.items():
                     participants_info = list(convo_data["participants_info"])
                     display_name = "Group Chat" # Имя по умолчанию для групп
                     avatar_url = None # Аватар по умолчанию
                     if convo_data["type"] == Conversation.type.DIRECT.value and len(participants_info) == 2:
                          # Для личного чата находим собеседника
                          other_participant = next((p for p in participants_info if p.id != user_id), None)
                          if other_participant:
                               display_name = other_participant.username
                               avatar_url = other_participant.avatar_url
                     elif len(participants_info) == 1: # Если в чате только мы
                          display_name = participants_info[0].username # Или "Saved Messages"

                     output_list.append(
                         ConversationListOut(
                             id=convo_id,
                             type=convo_data["type"],
                             updated_at=convo_data["updated_at"],
                             last_message=convo_data["last_message"],
                             unread_count=convo_data["unread_count"],
                             display_name=display_name,
                             avatar_url=avatar_url
                             # participants_info=participants_info # Можно вернуть и полный список участников
                         )
                     )
                # Сортируем финальный список по дате обновления
                output_list.sort(key=lambda x: x.updated_at, reverse=True)

                # Применяем лимит уже к обработанному списку
                return output_list[:limit]

            except SQLAlchemyError as e:
                logger.exception(f"DB error fetching conversations for U:{user_id}: {e}")
                return []

        conversations = await asyncio.to_thread(db_get_convos)
        return conversations


    @staticmethod
    async def create_conversation(db: Session, creator: User, convo_data: ConversationCreate) -> Conversation:
        """Асинхронно создает новый разговор."""
        def db_create():
            # Проверка: Убедимся, что создатель есть в списке участников
            if creator.id not in convo_data.participant_ids:
                 convo_data.participant_ids.add(creator.id)

            if convo_data.type == ConversationTypeEnum.DIRECT and len(convo_data.participant_ids) != 2:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Direct conversation must have exactly 2 participants")

            # Проверка: Существуют ли все участники?
            participants_q = select(User.id).where(User.id.in_(convo_data.participant_ids))
            existing_user_ids = set(db.scalars(participants_q).all())
            if len(existing_user_ids) != len(convo_data.participant_ids):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more participants not found")

            # Проверка: Существует ли уже такой direct чат?
            if convo_data.type == ConversationTypeEnum.DIRECT:
                 # Ищем чат, где есть ОБА участника и ТОЛЬКО они
                 existing_direct_q = (
                     select(Conversation.id)
                     .join(Conversation.participants_assoc)
                     .where(Conversation.type == ConversationTypeEnum.DIRECT)
                     .group_by(Conversation.id)
                     .having(
                         func.count(ConversationParticipant.user_id) == 2,
                         func.sum(case((ConversationParticipant.user_id.in_(convo_data.participant_ids), 1), else_=0)) == 2
                         # Убеждаемся, что количество участников = 2 И оба они из нашего списка
                     )
                 ).limit(1)
                 existing_convo_id = db.scalar(existing_direct_q)
                 if existing_convo_id:
                      # Если чат уже есть, просто возвращаем его
                      logger.warning(f"Direct conversation between users {convo_data.participant_ids} already exists (ID: {existing_convo_id}). Returning existing.")
                      existing_convo = db.get(Conversation, existing_convo_id)
                      # Подгружаем участников для ответа
                      db.refresh(existing_convo, relationship_names=["participants"])
                      return existing_convo

            # Создаем новый разговор
            try:
                with db.begin_nested():
                     new_convo = Conversation(type=convo_data.type.value) # Используем .value для Enum
                     db.add(new_convo)
                     # Flush, чтобы получить new_convo.id для связи
                     db.flush()
                     # Добавляем участников
                     participants_to_add = [
                         ConversationParticipant(user_id=uid, conversation_id=new_convo.id)
                         for uid in convo_data.participant_ids
                     ]
                     db.add_all(participants_to_add)
                # Commit nested transaction
                db.refresh(new_convo) # Обновляем объект
                # Подгружаем участников для ответа
                db.refresh(new_convo, relationship_names=["participants"])
                logger.info(f"Conversation {new_convo.id} created by user {creator.id} with participants {convo_data.participant_ids}")
                return new_convo
            except IntegrityError as e: # Ловим ошибки уникальности, если что-то пошло не так
                 db.rollback()
                 logger.exception(f"Integrity error creating conversation: {e}")
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Conversation could not be created due to conflict.")
            except SQLAlchemyError as e:
                 db.rollback()
                 logger.exception(f"DB error creating conversation: {e}")
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error creating conversation.")

        new_conversation = await asyncio.to_thread(db_create)
        return new_conversation