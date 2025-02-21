from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

router = APIRouter()

active_connections: Dict[int, List[WebSocket]] = {}

@router.websocket("/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int):
    await websocket.accept()

    if conversation_id not in active_connections:
        active_connections[conversation_id] = []
    
    active_connections[conversation_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            # ✅ Broadcast the message to all connected users in the chat
            for connection in active_connections[conversation_id]:
                await connection.send_text(data)
    except WebSocketDisconnect:
        # ✅ Handle user disconnection
        active_connections[conversation_id].remove(websocket)
        if not active_connections[conversation_id]:  # Remove empty conversations
            del active_connections[conversation_id]
