export const connectToChat = (conversationId, onMessageReceived) => {
    if (!conversationId) {
        console.error("Error: conversationId is undefined. Cannot connect to WebSocket.");
        return null;
    }

    const socket = new WebSocket(`ws://127.0.0.1:8000/chats/ws/${conversationId}`);

    socket.onopen = () => {
        console.log("Connected to chat WebSocket");
    };

    socket.onmessage = (event) => {
        onMessageReceived(event.data);
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
        console.log("WebSocket Disconnected");
    };

    return socket;
};
