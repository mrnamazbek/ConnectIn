import React, { useState, useEffect } from "react";
import { fetchMessages, sendMessage } from "../../api/chatApi";
import { connectToChat } from "../../api/chatWebSocket";
import axios from "axios";

const ChatWindow = ({ conversationId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (!conversationId) {
            console.warn("ChatWindow: No conversationId provided. Skipping WebSocket connection.");
            return;
        }

        loadCurrentUser();
        loadMessages();
        const chatSocket = connectToChat(conversationId, handleNewMessage);
        setSocket(chatSocket);

        return () => chatSocket && chatSocket.close();
    }, [conversationId]);

    // Fetch the current user
    const loadCurrentUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://127.0.0.1:8000/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Failed to fetch current user", error);
        }
    };

    // Load messages from API and set state
    const loadMessages = async () => {
        if (!conversationId) return;
        try {
            const data = await fetchMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    // Handle new messages via WebSocket
    const handleNewMessage = (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            setMessages((prev) => [...prev, parsedMessage]);
        } catch (error) {
            console.error("Failed to parse incoming message", error);
        }
    };

    // Send message and update UI
    const handleSend = async () => {
        if (newMessage.trim()) {
            try {
                const sentMessage = await sendMessage(conversationId, newMessage);
                setNewMessage("");
                // Optionally, update the UI immediately
                setMessages((prev) => [...prev, sentMessage]);

                // Send message via WebSocket
                if (socket) socket.send(JSON.stringify(sentMessage));
            } catch (error) {
                console.error("Failed to send message", error);
            }
        }
    };

    // Optional: Handle Enter key for sending messages
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, index) => {
                    const isCurrentUser = currentUser && msg.sender_id === currentUser.id;
                    // Prefer a unique key if available (e.g., msg.id)
                    return (
                        <div key={msg.id || index} className={`mb-4 ${isCurrentUser ? "text-right" : "text-left"}`}>
                            <div className={`inline-block p-3 rounded-lg ${isCurrentUser ? "bg-green-100 text-green-900" : "bg-gray-100 text-gray-900"}`}>
                                <p className="text-sm">{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t">
                <div className="flex">
                    <input
                        type="text"
                        className="flex-1 p-2 border rounded-l-lg focus:outline-none"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress} // Added Enter key handler
                    />
                    <button className="px-4 bg-green-700 text-white rounded-r-lg hover:bg-green-800" onClick={handleSend}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
