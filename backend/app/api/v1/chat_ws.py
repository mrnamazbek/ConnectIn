from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user_ws
from app.models.user import User
from app.models.chat import Conversation, Message
from app.database.connection import get_db
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Store active connections as {conversation_id: {user_id: WebSocket}}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        """Accept and register a new connection"""
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = {}
        self.active_connections[conversation_id][user_id] = websocket

    def disconnect(self, conversation_id: int, user_id: int):
        """Close and remove a connection"""
        if conversation_id in self.active_connections and user_id in self.active_connections[conversation_id]:
            del self.active_connections[conversation_id][user_id]
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]

    async def broadcast(self, message_data: dict, conversation_id: int, sender_id: int):
        """Send a message to all users in the conversation"""
        if conversation_id in self.active_connections:
            for user_id, connection in self.active_connections[conversation_id].items():
                # Add metadata to indicate if it's the sender's own message
                message_with_meta = {
                    **message_data,
                    "is_self": user_id == sender_id
                }
                await connection.send_json(message_with_meta)


# Initialize the connection manager
manager = ConnectionManager()

@router.websocket("/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    conversation_id: int,
    db: Session = Depends(get_db)
):
    # Authenticate the user from the token
    user = await get_current_user_ws(websocket)
    if not user:
        await websocket.close(code=1008)  # Policy violation
        return
    
    # Check if the user is part of this conversation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation or user.id not in [p.id for p in conversation.participants]:
        await websocket.close(code=1003)  # Not authorized
        return
    
    # Accept connection
    await manager.connect(websocket, conversation_id, user.id)
    
    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_json()
            content = data.get("content", "")
            
            # Extract media information if present
            media_url = data.get("media_url")
            media_type = data.get("media_type")
            media_name = data.get("media_name")
            
            # Skip empty messages without media
            if not content.strip() and not media_url:
                continue
                
            # Create and save the message to the database
            message = Message(
                content=content,
                conversation_id=conversation_id,
                sender_id=user.id,
                media_url=media_url,
                media_type=media_type,
                media_name=media_name
            )
            db.add(message)
            db.commit()
            db.refresh(message)
            
            # Prepare message data for broadcast
            message_data = {
                "id": message.id,
                "content": message.content,
                "timestamp": message.timestamp.isoformat(),
                "sender_id": user.id,
                "sender_name": f"{user.first_name} {user.last_name}",
                "sender_avatar": user.avatar_url,
                "conversation_id": conversation_id,
                "media_url": message.media_url,
                "media_type": message.media_type,
                "media_name": message.media_name
            }
            
            # Broadcast the message to all participants
            await manager.broadcast(message_data, conversation_id, user.id)
            
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, user.id) 