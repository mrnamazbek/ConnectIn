import logging
from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from contextlib import suppress

router = APIRouter()
logger = logging.getLogger("chat")
active_connections = defaultdict(set)  # Оптимизированное хранение подключений


class WebSocketManager:
    """Менеджер управления WebSocket-подключениями"""

    @staticmethod
    async def connect(websocket: WebSocket, conversation_id: int):
        await websocket.accept()
        active_connections[conversation_id].add(websocket)
        logger.info(f"Новое подключение к чату {conversation_id}")

    @staticmethod
    async def broadcast(message: str, conversation_id: int):
        """Рассылка сообщений всем участникам чата"""
        for connection in active_connections.get(conversation_id, []):
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Ошибка отправки сообщения: {e}")
                await WebSocketManager.disconnect(connection, conversation_id)

    @staticmethod
    async def disconnect(websocket: WebSocket, conversation_id: int):
        with suppress(KeyError, ValueError):
            active_connections[conversation_id].remove(websocket)
            logger.info(f"Отключение от чата {conversation_id}")

            # Удаляем пустые чаты
            if not active_connections[conversation_id]:
                del active_connections[conversation_id]


@router.websocket("/{conversation_id}")
async def websocket_handler(websocket: WebSocket, conversation_id: int):
    await WebSocketManager.connect(websocket, conversation_id)

    try:
        while True:
            message = await websocket.receive_text()
            await WebSocketManager.broadcast(message, conversation_id)
            logger.debug(f"Получено сообщение в чате {conversation_id}")

    except WebSocketDisconnect as e:
        logger.info(f"Клиент отключился: {e}")
    finally:
        await WebSocketManager.disconnect(websocket, conversation_id)