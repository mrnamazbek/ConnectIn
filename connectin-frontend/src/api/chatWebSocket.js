export class ChatWebSocket {
    constructor(conversationId, callbacks) {
        this.conversationId = conversationId;

        // Handle both legacy and new callback formats
        if (typeof callbacks === "function") {
            // Legacy: Single onMessage callback
            this.onMessage = callbacks;
            this.onOpen = () => console.log("WebSocket connected");
            this.onClose = () => console.log("WebSocket disconnected");
            this.onError = (error) => console.error("WebSocket error:", error);
        } else {
            // New: Callback object with separate handlers
            this.onMessage = callbacks.onMessage;
            this.onOpen = callbacks.onOpen || (() => console.log("WebSocket connected"));
            this.onClose = callbacks.onClose || (() => console.log("WebSocket disconnected"));
            this.onError = callbacks.onError || ((error) => console.error("WebSocket error:", error));
        }

        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.useFallback = false;
    }

    connect() {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("No token found for WebSocket connection");
            this.onError(new Error("Authentication token not found"));
            return;
        }

        // Don't try WebSocket if we've already determined it's not available
        if (this.useFallback) {
            this.onClose();
            return;
        }

        try {
            //VITE_WS_URL=ws://127.0.0.1:8000/api/v1/ws/chats

            const url = `${import.meta.env.VITE_WS_URL}/${this.conversationId}?access_token=${token}`;

            console.log("Connecting to WebSocket URL:", url);

            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log("WebSocket connected");
                this.reconnectAttempts = 0;
                this.onOpen();
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.onMessage(message);
                } catch (error) {
                    console.error("Error parsing WebSocket message:", error);
                }
            };

            this.socket.onclose = (event) => {
                console.log(`WebSocket disconnected with code: ${event.code}`);
                this.onClose();

                // Don't auto-reconnect on normal closure (1000) or user navigated away (1001)
                if (event.code !== 1000 && event.code !== 1001) {
                    this.reconnect();
                }
            };

            this.socket.onerror = (error) => {
                console.error("WebSocket error:", error);
                this.onError(error);
            };
        } catch (error) {
            console.error("Error creating WebSocket:", error);
            this.onError(error);
        }
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error("Max reconnection attempts reached");
            this.useFallback = true; // Mark that we should use fallback mode
            this.onError(new Error("Could not establish WebSocket connection after maximum attempts"));
        }
    }

    sendMessage(message) {
        if (this.useFallback) {
            // Use REST API fallback for sending messages
            this.sendFallbackMessage(message);
            return false;
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(message));
                return true;
            } catch (error) {
                console.error("Error sending WebSocket message:", error);
                this.onError(error);
                return false;
            }
        } else {
            console.error("WebSocket is not connected - message not sent");
            // Attempt reconnection if socket is closed
            if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                this.reconnect();
            }
            return false;
        }
    }

    // Send message via REST API as fallback
    async sendFallbackMessage(message) {
        if (message.type === "message") {
            try {
                const token = localStorage.getItem("access_token");

                // Import fetch dynamically to avoid circular dependencies
                const response = await fetch(`${import.meta.env.VITE_API_URL}/chats/${this.conversationId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: message.content,
                        conversation_id: this.conversationId,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to send message: ${response.status}`);
                }

                const data = await response.json();

                // Simulate a WebSocket message response
                setTimeout(() => {
                    this.onMessage({
                        type: "message",
                        id: data.id,
                        content: data.content,
                        sender_id: data.sender_id,
                        conversation_id: this.conversationId,
                        timestamp: data.timestamp,
                    });
                }, 300);

                return true;
            } catch (error) {
                console.error("Fallback message send failed:", error);
                this.onError(error);
                return false;
            }
        }

        // For other message types (typing, read_receipt) - just ignore in fallback mode
        return false;
    }

    disconnect() {
        if (this.socket) {
            // Use a normal closure code
            this.socket.close(1000, "Intentional disconnect");
            this.socket = null;
        }
    }

    isConnected() {
        return !this.useFallback && this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}
