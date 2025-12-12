# connectin-backend/app/websockets/manager.py
import logging
from typing import Dict, Set, List, Optional, Any
from datetime import datetime, timezone
from fastapi import WebSocket
from collections import defaultdict
import json

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Управляет активными WebSocket соединениями для чатов."""
    def __init__(self):
        # conversation_id -> {user_id: WebSocket}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = defaultdict(dict)
        # user_id -> {conversation_id} # Отслеживаем, в каких чатах юзер онлайн
        self.user_conversations: Dict[int, Set[int]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        """Принимает и регистрирует новое соединение."""
        await websocket.accept()
        self.active_connections[conversation_id][user_id] = websocket
        self.user_conversations[user_id].add(conversation_id)
        logger.info(f"WS Connected: User {user_id} to Conversation {conversation_id}. "
                    f"Total in room: {len(self.active_connections[conversation_id])}")
        # Оповещаем других о подключении
        await self.broadcast_status(conversation_id, user_id, "online", sender_websocket=websocket)

    def disconnect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        """Отключает и удаляет соединение."""
        disconnected = False
        if conversation_id in self.active_connections:
            if user_id in self.active_connections[conversation_id]:
                del self.active_connections[conversation_id][user_id]
                disconnected = True
                if not self.active_connections[conversation_id]:
                    del self.active_connections[conversation_id] # Удаляем пустую комнату

        if user_id in self.user_conversations:
            self.user_conversations[user_id].discard(conversation_id)
            if not self.user_conversations[user_id]:
                del self.user_conversations[user_id]

        if disconnected:
            logger.info(f"WS Disconnected: User {user_id} from Conversation {conversation_id}.")

    async def broadcast_to_conversation(
        self,
        conversation_id: int,
        message_json: str, # Сообщение уже в формате JSON строки
        sender_user_id: Optional[int] = None # ID отправителя, чтобы не слать ему обратно
    ):
        """Рассылает JSON-строку всем активным участникам чата, кроме отправителя."""
        if conversation_id in self.active_connections:
            # Копируем словарь соединений для безопасной итерации
            connections_to_send = dict(self.active_connections[conversation_id])
            disconnected_users = []

            for user_id, connection in connections_to_send.items():
                if user_id == sender_user_id:
                    continue # Пропускаем отправителя
                try:
                    await connection.send_text(message_json)
                    # logger.debug(f"Message broadcasted to user {user_id} in convo {conversation_id}")
                except Exception as e:
                    logger.warning(f"WS Send Error user {user_id} in C:{conversation_id}: {e}. Removing.")
                    disconnected_users.append((connection, user_id)) # Собираем "мертвые" соединения

            # Удаляем "мертвые" соединения после итерации
            for ws, uid in disconnected_users:
                 self.disconnect(ws, conversation_id, uid)
                 # Оповещаем остальных, что пользователь ушел
                 await self.broadcast_status(conversation_id, uid, "offline", sender_user_id=uid)

    async def broadcast_status(self, conversation_id: int, user_id: int, status: str, sender_user_id: Optional[int] = None, sender_websocket: Optional[WebSocket] = None):
        """Рассылает статус пользователя."""
        # Используем sender_user_id для исключения из рассылки
        message = {
            "type": "status", "user_id": user_id, "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(), # Используем timezone.utc
        }
        await self.broadcast_to_conversation(conversation_id, json.dumps(message), sender_user_id=user_id)

    async def send_typing_indicator(self, conversation_id: int, user_id: int, username: str, is_typing: bool):
        """Отправляет индикатор печати другим участникам."""
        message = {
            "type": "typing", "user_id": user_id, "username": username,
            "is_typing": is_typing, "conversation_id": conversation_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await self.broadcast_to_conversation(conversation_id, json.dumps(message), sender_user_id=user_id)

    async def send_read_receipt(self, conversation_id: int, user_id: int, message_ids: List[int]):
        """Отправляет подтверждение прочтения другим участникам."""
        message = {
            "type": "read", "user_id": user_id, "message_ids": message_ids,
            "conversation_id": conversation_id, "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await self.broadcast_to_conversation(conversation_id, json.dumps(message), sender_user_id=user_id)

    def get_user_status(self, user_id: int) -> str:
        """Проверяет онлайн-статус пользователя."""
        return "online" if user_id in self.user_conversations and self.user_conversations[user_id] else "offline"

    def get_online_users_in_conversation(self, conversation_id: int) -> List[int]:
        """Возвращает список ID онлайн пользователей в чате."""
        return list(self.active_connections.get(conversation_id, {}).keys())

# Создаем единственный экземпляр менеджера
manager = ConnectionManager()