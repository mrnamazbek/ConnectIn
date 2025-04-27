# connectin-backend/app/services/chat_service.py
import logging
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, update, and_, func, desc, case, or_
from datetime import datetime, timezone
import asyncio
from typing import List, Optional, Dict, Set

# --- Импорты ---
from app.models.chat import Message, Conversation
from app.models.user import User
from app.schemas.chat import MessageCreate, ConversationCreate, UserBasicInfo, ConversationList, MessageOut, \
    ConversationType
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = logging.getLogger(__name__)


class ChatService:
    """
    Сервис для работы с чатами и сообщениями.
    Поддерживает асинхронные операции с базой данных.
    """

    # --- Участники ---
    @staticmethod
    async def is_user_participant(db: Session, user_id: int, conversation_id: int) -> bool:
        """
        Проверяет, является ли пользователь участником чата.

        :param db: Сессия базы данных
        :param user_id: ID пользователя
        :param conversation_id: ID разговора
        :return: True если пользователь участник, иначе False
        """

        def db_check():
            # Используем связь между беседами и пользователями через таблицу conversation_participants
            query = select(Conversation).join(Conversation.participants).where(
                Conversation.id == conversation_id,
                User.id == user_id
            ).limit(1)
            result = db.execute(query).first()
            return result is not None

        try:
            return await asyncio.to_thread(db_check)
        except SQLAlchemyError as e:
            logger.exception(f"Ошибка БД при проверке участия U:{user_id} C:{conversation_id}: {e}")
            return False

    # --- Сообщения ---
    # connectin-backend/app/services/chat_service.py

    @staticmethod
    async def save_message(db: Session, msg_data: MessageCreate, sender_id: int, conversation_id: int) -> Optional[
        Message]:
        """
        Сохраняет новое сообщение с поддержкой медиафайлов и обновляет время последнего обновления разговора.

        :param db: Сессия базы данных
        :param msg_data: Данные сообщения (включая медиа)
        :param sender_id: ID отправителя
        :param conversation_id: ID разговора
        :return: Созданное сообщение или None при ошибке
        """

        def db_save():
            try:
                # Проверяем участие отправителя в чате перед сохранением
                conversation = db.execute(
                    select(Conversation).join(Conversation.participants).where(
                        Conversation.id == conversation_id,
                        User.id == sender_id
                    )
                ).scalar_one_or_none()

                if not conversation:
                    logger.warning(
                        f"Пользователь U:{sender_id} пытается отправить сообщение в чат C:{conversation_id}, где он не участвует")
                    return None

                # Создаем и сохраняем сообщение
                now_utc = datetime.now(timezone.utc)

                # Проверяем тип сообщения (текст или медиа)
                is_media_message = bool(getattr(msg_data, 'media_url', None))

                # Убедимся, что у медиа-сообщения всегда есть какое-то содержимое
                content = msg_data.content if msg_data.content else ""
                if is_media_message and not content:
                    content = "[Медиа файл]"  # Добавляем заглушку для пустых медиа-сообщений

                # Создаем объект сообщения
                db_msg = Message(
                    sender_id=sender_id,
                    conversation_id=conversation_id,
                    content=content,
                    timestamp=now_utc,
                    # Добавляем медиа-данные, если они есть
                    media_url=getattr(msg_data, 'media_url', None),
                    media_type=getattr(msg_data, 'media_type', None),
                    media_name=getattr(msg_data, 'media_name', None)
                )

                db.add(db_msg)

                # Обновляем updated_at у разговора
                conversation.updated_at = now_utc

                db.commit()
                db.refresh(db_msg)

                logger.info(f"Сообщение сохранено: ID={db_msg.id} в C:{conversation_id} от U:{sender_id}" +
                            (f" (с медиа: {db_msg.media_type})" if is_media_message else ""))
                return db_msg
            except SQLAlchemyError as e:
                logger.exception(f"Ошибка БД при сохранении сообщения U:{sender_id} C:{conversation_id}: {e}")
                db.rollback()
                return None

        return await asyncio.to_thread(db_save)

    @staticmethod
    async def get_messages(db: Session, conversation_id: int, user_id: int, skip: int = 0, limit: int = 50) -> tuple[
        List[Message], bool]:
        """
        Получает историю сообщений чата с пагинацией.

        :param db: Сессия базы данных
        :param conversation_id: ID разговора
        :param user_id: ID пользователя, запрашивающего сообщения
        :param skip: Сколько сообщений пропустить (для пагинации)
        :param limit: Максимальное количество сообщений
        :return: Кортеж (список сообщений, флаг наличия еще сообщений)
        """
        # Проверяем доступ
        if not await ChatService.is_user_participant(db, user_id, conversation_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Не авторизован для этого разговора")

        def db_get():
            try:
                # Запрашиваем на 1 сообщение больше чем нужно, чтобы определить, есть ли еще
                stmt = (
                    select(Message)
                    .where(Message.conversation_id == conversation_id)
                    .order_by(desc(Message.timestamp))
                    .offset(skip)
                    .limit(limit + 1)
                    .options(selectinload(Message.sender).load_only(
                        User.id, User.username, User.avatar_url
                    ))
                )

                messages = db.execute(stmt).scalars().all()

                # Определяем, есть ли еще сообщения
                has_more = len(messages) > limit

                # Возвращаем только запрошенное количество
                return list(messages[:limit]), has_more

            except SQLAlchemyError as e:
                logger.exception(f"Ошибка БД при получении сообщений C:{conversation_id} для U:{user_id}: {e}")
                return [], False

        return await asyncio.to_thread(db_get)

    @staticmethod
    async def update_read_status(db: Session, conversation_id: int, user_id: int,
                                 message_ids: Optional[List[int]] = None):
        """
        Обновляет статус прочтения сообщений.
        Если message_ids не указаны, отмечает все непрочитанные сообщения как прочитанные.

        :param db: Сессия базы данных
        :param conversation_id: ID разговора
        :param user_id: ID пользователя, отмечающего сообщения как прочитанные
        :param message_ids: Список ID сообщений или None для всех непрочитанных
        """

        def db_update():
            try:
                now_utc = datetime.now(timezone.utc)

                # Базовый фильтр для обновления
                conditions = [
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,  # Не отмечаем свои сообщения
                    Message.read.is_(None)  # Только непрочитанные
                ]

                # Добавляем фильтр по ID сообщений, если они указаны
                if message_ids:
                    conditions.append(Message.id.in_(message_ids))

                # Запрос на обновление
                stmt = (
                    update(Message)
                    .where(and_(*conditions))
                    .values(read=now_utc)
                    .execution_options(synchronize_session=False)
                )

                result = db.execute(stmt)
                db.commit()

                updated_count = result.rowcount
                logger.info(
                    f"Обновлен статус прочтения для {updated_count} сообщений в C:{conversation_id} от U:{user_id}")

                return updated_count

            except SQLAlchemyError as e:
                logger.exception(f"Ошибка БД при обновлении статуса прочтения C:{conversation_id} U:{user_id}: {e}")
                db.rollback()
                return 0

        return await asyncio.to_thread(db_update)

    # --- Разговоры (Conversations) ---
    @staticmethod
    async def get_user_conversations(db: Session, user_id: int, skip: int = 0, limit: int = 20,
                                     search: Optional[str] = None) -> List[ConversationList]:
        """
        Получает список чатов пользователя с последними сообщениями и счетчиком непрочитанных.

        :param db: Сессия базы данных
        :param user_id: ID пользователя
        :param skip: Сколько чатов пропустить (для пагинации)
        :param limit: Максимальное количество чатов
        :param search: Строка поиска (для фильтрации чатов по имени собеседника)
        :return: Список чатов с дополнительной информацией
        """

        def db_get_convos():
            try:
                # 1. Сначала получаем ID всех бесед пользователя
                conversation_query = (
                    select(Conversation)
                    .join(Conversation.participants)
                    .where(User.id == user_id)
                    .order_by(desc(Conversation.updated_at))
                )

                # Добавляем поиск, если задан
                if search:
                    # Ищем собеседников по имени/username
                    conversation_query = conversation_query.join(
                        User, Conversation.participants
                    ).where(
                        and_(
                            User.id != user_id,
                            or_(
                                User.username.ilike(f"%{search}%"),
                                User.first_name.ilike(f"%{search}%"),
                                User.last_name.ilike(f"%{search}%")
                            )
                        )
                    )

                # Применяем пагинацию
                conversations = db.execute(
                    conversation_query.offset(skip).limit(limit)
                ).scalars().all()

                result = []

                # 2. Для каждой беседы получаем доп. информацию
                for conversation in conversations:
                    # Получаем всех участников, кроме текущего пользователя
                    other_participants = [
                        user for user in conversation.participants
                        if user.id != user_id
                    ]

                    # Получаем последнее сообщение
                    last_message = db.execute(
                        select(Message)
                        .where(Message.conversation_id == conversation.id)
                        .order_by(desc(Message.timestamp))
                        .limit(1)
                        .options(selectinload(Message.sender))
                    ).scalar_one_or_none()

                    # Считаем непрочитанные сообщения
                    unread_count = db.execute(
                        select(func.count(Message.id))
                        .where(
                            Message.conversation_id == conversation.id,
                            Message.sender_id != user_id,
                            Message.read.is_(None)
                        )
                    ).scalar_one() or 0

                    # Преобразуем в схему UserBasicInfo
                    participants_info = [
                        UserBasicInfo(
                            id=user.id,
                            username=user.username,
                            avatar_url=user.avatar_url
                        ) for user in other_participants
                    ]

                    # Создаем объект ответа
                    convo_data = ConversationList(
                        id=conversation.id,
                        type=conversation.type,
                        participants=[p.id for p in conversation.participants],
                        participants_info=participants_info,
                        last_message=last_message,
                        updated_at=conversation.updated_at or conversation.created_at,
                        unread_count=unread_count
                    )

                    result.append(convo_data)

                return result

            except SQLAlchemyError as e:
                logger.exception(f"Ошибка БД при получении чатов для U:{user_id}: {e}")
                return []

        return await asyncio.to_thread(db_get_convos)

    @staticmethod
    async def get_conversation_detail(db: Session, conversation_id: int, user_id: int) -> Optional[Conversation]:
        """
        Получает детальную информацию о конкретном чате.

        :param db: Сессия базы данных
        :param conversation_id: ID разговора
        :param user_id: ID пользователя, запрашивающего информацию
        :return: Объект разговора или None, если не найден/нет доступа
        """

        def db_get():
            try:
                # Получаем разговор с проверкой доступа
                conversation = db.execute(
                    select(Conversation)
                    .join(Conversation.participants)
                    .where(
                        Conversation.id == conversation_id,
                        User.id == user_id
                    )
                    .options(
                        # Загружаем участников и последние сообщения
                        selectinload(Conversation.participants),
                        selectinload(Conversation.messages).selectinload(Message.sender)
                    )
                ).scalar_one_or_none()

                if not conversation:
                    return None

                return conversation

            except SQLAlchemyError as e:
                logger.exception(f"Ошибка БД при получении чата C:{conversation_id} для U:{user_id}: {e}")
                return None

        return await asyncio.to_thread(db_get)

    @staticmethod
    async def create_conversation(db: Session, creator_id: int, convo_data: ConversationCreate) -> Optional[
        Conversation]:
        """
        Создает новый разговор или возвращает существующий для direct-чатов.

        :param db: Сессия базы данных
        :param creator_id: ID пользователя-создателя
        :param convo_data: Данные для создания разговора
        :return: Созданный или найденный разговор
        """

        def db_create():
            try:
                # Добавляем создателя к участникам, если его там нет
                all_participant_ids = list(convo_data.participant_ids)
                if creator_id not in all_participant_ids:
                    all_participant_ids.append(creator_id)

                # Для direct-чатов проверяем, что ровно 2 участника
                if convo_data.type == ConversationType.DIRECT.value and len(all_participant_ids) != 2:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Direct-разговор должен иметь ровно 2 участника"
                    )

                # Проверяем, существуют ли все пользователи
                users = db.execute(
                    select(User).where(User.id.in_(all_participant_ids))
                ).scalars().all()

                if len(users) != len(all_participant_ids):
                    missing_ids = set(all_participant_ids) - {user.id for user in users}
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Некоторые пользователи не найдены: {missing_ids}"
                    )

                # Для direct-чатов проверяем, существует ли уже чат между этими пользователями
                if convo_data.type == ConversationType.DIRECT.value:
                    # Получаем все чаты первого пользователя
                    user_conversations = db.execute(
                        select(Conversation)
                        .join(Conversation.participants)
                        .where(
                            Conversation.type == ConversationType.DIRECT.value,
                            User.id == all_participant_ids[0]
                        )
                    ).scalars().all()

                    # Проверяем, есть ли среди них чат с нужным составом участников
                    for conv in user_conversations:
                        participant_ids = [user.id for user in conv.participants]
                        if set(participant_ids) == set(all_participant_ids):
                            # Чат уже существует, возвращаем его
                            logger.info(f"Найден существующий direct-чат между пользователями {all_participant_ids}")
                            return conv

                # Создаем новый разговор
                new_conversation = Conversation(
                    type=convo_data.type,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                    participants=users  # SQLAlchemy автоматически обработает M2M связь
                )

                db.add(new_conversation)
                db.commit()
                db.refresh(new_conversation)

                logger.info(
                    f"Создан новый чат ID={new_conversation.id} типа {convo_data.type} с участниками {all_participant_ids}")
                return new_conversation

            except HTTPException:
                # Пробрасываем HTTP-исключения выше
                raise
            except SQLAlchemyError as e:
                db.rollback()
                logger.exception(f"Ошибка БД при создании чата: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Ошибка при создании чата"
                )

        return await asyncio.to_thread(db_create)

    """"
    ## Комментарии к изменениям:
1. **Исправлены ошибки в связях и классах**:
    - Убрал ссылки на `ConversationParticipant` - вместо этого мы используем ORM-связи через `Conversation.participants`
    - Заменил на из схем `ConversationTypeEnum``ConversationType`

2. **Оптимизированы SQL-запросы**:
    - Добавлены четкие условия загрузки связанных данных через `selectinload`
    - Исправлены запросы для корректной работы с таблицей `conversation_participants`

3. **Улучшена обработка ошибок**:
    - Добавлены понятные сообщения об ошибках на русском языке
    - Все SQL-исключения корректно логируются

4. **Улучшена документация**:
    - Добавлены подробные комментарии к методам
    - Указаны типы параметров и возвращаемых значений

5. **Расширен функционал**:
    - Метод `get_messages` теперь возвращает флаг наличия дополнительных сообщений
    - В добавлена возможность отметить все сообщения как прочитанные `update_read_status`
    - В добавлен параметр поиска `get_user_conversations`

6. **Оптимизация производительности**:
    - Запросы разделены на логические части для лучшего контроля кеширования
    - Используются более эффективные SQL-конструкции

    """
