import json
import logging
from typing import Dict, Set, List, Optional, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.chat import Message, Conversation
from app.models import User
from app.api.v1.auth import get_current_user_ws
from datetime import datetime
from pydantic import ValidationError

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map of conversation_id to set of WebSocket connections
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
        # Map of user_id to set of conversation_ids they're connected to
        self.user_connections: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        await websocket.accept()
        
        # Initialize dictionaries if needed
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = {}
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
            
        # Store the connection
        self.active_connections[conversation_id][user_id] = websocket
        self.user_connections[user_id].add(conversation_id)
        
        logger.info(f"User {user_id} connected to conversation {conversation_id}")
        
        # Notify other participants that this user is online
        await self.broadcast_status(conversation_id, user_id, "online")

    def disconnect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        try:
            # Remove from active connections
            if conversation_id in self.active_connections and user_id in self.active_connections[conversation_id]:
                del self.active_connections[conversation_id][user_id]
                if not self.active_connections[conversation_id]:
                    del self.active_connections[conversation_id]
            
            # Remove from user connections
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(conversation_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
                    
            logger.info(f"User {user_id} disconnected from conversation {conversation_id}")
        except Exception as e:
            logger.error(f"Error disconnecting user {user_id} from conversation {conversation_id}: {e}")

    async def broadcast(self, message: Dict[str, Any], conversation_id: int, sender_id: Optional[int] = None):
        """Broadcast a message to all participants in a conversation except the sender."""
        if conversation_id in self.active_connections:
            for user_id, connection in list(self.active_connections[conversation_id].items()):
                if user_id != sender_id:  # Don't send to the sender
                    try:
                        await connection.send_json(message)
                        logger.debug(f"Message sent to user {user_id} in conversation {conversation_id}")
                    except Exception as e:
                        logger.error(f"Error sending message to user {user_id}: {e}")
                        self.disconnect(connection, conversation_id, user_id)

    async def broadcast_status(self, conversation_id: int, user_id: int, status: str):
        """Broadcast a user's status to others in the conversation."""
        await self.broadcast(
            {
                "type": "status",
                "user_id": user_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
            },
            conversation_id,
            user_id
        )

    async def send_typing_indicator(self, conversation_id: int, user_id: int, is_typing: bool):
        """Send typing indicator to other participants."""
        await self.broadcast(
            {
                "type": "typing",
                "user_id": user_id,
                "is_typing": is_typing,
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            conversation_id,
            user_id
        )

    async def send_read_receipt(self, conversation_id: int, user_id: int, message_ids: List[int]):
        """Send read receipt to other participants."""
        await self.broadcast(
            {
                "type": "read_receipt",
                "user_id": user_id,
                "message_ids": message_ids,
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            conversation_id,
            user_id
        )

    def get_user_status(self, user_id: int) -> str:
        """Check if a user is online in any conversation."""
        return "online" if user_id in self.user_connections else "offline"

    def get_online_users(self, conversation_id: int) -> List[int]:
        """Get list of online users in a conversation."""
        if conversation_id in self.active_connections:
            return list(self.active_connections[conversation_id].keys())
        return []

manager = ConnectionManager()

@router.websocket("/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    db: Session = Depends(get_db),
):
    user = None
    try:
        # Authenticate user
        user = await get_current_user_ws(websocket)
        if not user:
            logger.warning(f"WebSocket authentication failed for conversation {conversation_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Verify conversation access
        conversation = (
            db.query(Conversation)
            .join(Conversation.participants)
            .filter(
                Conversation.id == conversation_id,
                User.id == user.id,
            )
            .first()
        )

        if not conversation:
            logger.warning(f"User {user.id} attempted to access unauthorized conversation {conversation_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Accept the connection and add to manager
        await manager.connect(websocket, conversation_id, user.id)

        # Send initial online status of all participants
        for participant in conversation.participants:
            if participant.id != user.id:  # Don't send status about current user to themselves
                await websocket.send_json({
                    "type": "status",
                    "user_id": participant.id,
                    "status": manager.get_user_status(participant.id),
                    "timestamp": datetime.utcnow().isoformat(),
                })

        # Main message loop
        async for data in websocket.iter_text():
            try:
                # Parse the incoming message
                message_data = json.loads(data)
                message_type = message_data.get("type", "message")
                
                # Handle different message types
                if message_type == "message":
                    # Get content and ensure it's not empty
                    content = message_data.get("content", "").strip()
                    if not content:
                        content = "(empty message)"
                        
                    # Create and save message to database
                    message = Message(
                        content=content,
                        conversation_id=conversation_id,
                        sender_id=user.id,
                    )
                    db.add(message)
                    
                    # Update conversation timestamp
                    conversation.updated_at = datetime.utcnow()
                    db.commit()
                    db.refresh(message)

                    # Broadcast message to all connected clients
                    await manager.broadcast(
                        {
                            "type": "message",
                            "id": message.id,
                            "content": message.content,
                            "sender_id": message.sender_id,
                            "conversation_id": conversation_id,
                            "timestamp": message.timestamp.isoformat(),
                        },
                        conversation_id,
                        user.id,
                    )
                elif message_type == "typing":
                    # Handle typing indicator
                    is_typing = message_data.get("is_typing", False)
                    await manager.send_typing_indicator(conversation_id, user.id, is_typing)
                    
                elif message_type == "read_receipt":
                    # Handle read receipts
                    message_ids = message_data.get("message_ids", [])
                    if message_ids:
                        # Update database
                        now = datetime.utcnow()
                        db.query(Message).filter(
                            Message.id.in_(message_ids),
                            Message.conversation_id == conversation_id,
                            Message.sender_id != user.id,
                            Message.read.is_(None)
                        ).update({Message.read: now}, synchronize_session=False)
                        db.commit()
                        
                        # Broadcast to other users
                        await manager.send_read_receipt(conversation_id, user.id, message_ids)

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from user {user.id}")
            except ValidationError as e:
                logger.error(f"Validation error for message from user {user.id}: {e}")
            except Exception as e:
                logger.error(f"Error processing message from user {user.id}: {e}")

    except WebSocketDisconnect:
        if user:
            manager.disconnect(websocket, conversation_id, user.id)
            await manager.broadcast_status(conversation_id, user.id, "offline")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if user:
            manager.disconnect(websocket, conversation_id, user.id)
            await manager.broadcast_status(conversation_id, user.id, "offline") 