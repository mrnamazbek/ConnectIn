export class ChatWebSocket {
    constructor(conversationId, onMessage) {
        this.conversationId = conversationId;
        this.onMessage = onMessage;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    connect() {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("No token found for WebSocket connection");
            return;
        }

        this.socket = new WebSocket(
            `${import.meta.env.VITE_WS_URL}/${this.conversationId}?access_token=${token}`
        );

        this.socket.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.onMessage(message);
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        this.socket.onclose = () => {
            console.log("WebSocket disconnected");
            this.reconnect();
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error("Max reconnection attempts reached");
        }
    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error("WebSocket is not connected");
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
} 