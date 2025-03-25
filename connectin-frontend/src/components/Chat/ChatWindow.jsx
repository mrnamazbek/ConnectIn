import React, { useState, useEffect, useRef } from "react";
import { fetchMessages, sendMessage } from "../../api/chatApi";
import { connectToChat } from "../../api/chatWebSocket";
import axios from "axios";

const ChatWindow = ({ conversationId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false); // Track WebSocket connection state
    const [connectionError, setConnectionError] = useState(null); // Store WebSocket errors
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null); // Ref to manage a single WebSocket instance

    useEffect(() => {
        if (!conversationId) {
            console.warn("ChatWindow: No conversationId provided.");
            setConnectionError("Invalid conversation ID.");
            return;
        }

        // Validate conversation exists before connecting
        const validateConversation = async () => {
            try {
                const token = localStorage.getItem("access_token");
                await axios.get(`${import.meta.env.VITE_API_URL}/chats/${conversationId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (error) {
                console.error("Conversation validation failed:", error);
                setConnectionError("Conversation not found or inaccessible.");
                return false;
            }
            return true;
        };

        const setupWebSocket = async () => {
            setIsConnecting(true);
            setConnectionError(null);

            // Cleanup previous socket if it exists
            if (socketRef.current) {
                socketRef.current.close();
            }

            const isValid = await validateConversation();
            if (!isValid) return;

            loadCurrentUser();
            loadMessages();
            const chatSocket = connectToChat(conversationId, handleNewMessage);
            socketRef.current = chatSocket;
            setSocket(chatSocket);

            chatSocket.onopen = () => {
                console.log("Connected to chat WebSocket");
                setIsConnecting(false);
            };

            chatSocket.onerror = (error) => {
                console.error("WebSocket Error:", error);
                setConnectionError("Failed to connect to WebSocket.");
                setIsConnecting(false);
            };

            chatSocket.onclose = () => {
                console.log("WebSocket Disconnected");
                setIsConnecting(false);
                // Attempt to reconnect after a delay
                setTimeout(() => setupWebSocket(), 2000); // Reconnect after 2 seconds
            };
        };

        setupWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [conversationId]);

    const loadCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Failed to fetch current user", error);
        }
    };

    const loadMessages = async () => {
        if (!conversationId) return;
        setIsLoading(true);
        try {
            const data = await fetchMessages(conversationId);
            const uniqueMessages = Array.from(new Map(data.map((msg) => [msg.id, msg])).values());
            setMessages(uniqueMessages);
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (currentUser && parsedMessage.sender_id !== currentUser.id) {
                setMessages((prev) => {
                    const updatedMessages = [...prev, parsedMessage];
                    return Array.from(new Map(updatedMessages.map((msg) => [msg.id, msg])).values());
                });
            }
        } catch (error) {
            console.error("Failed to parse incoming message", error);
        }
    };

    const handleSend = async () => {
        if (newMessage.trim()) {
            try {
                const sentMessage = await sendMessage(conversationId, newMessage);
                setNewMessage("");
                setMessages((prev) => {
                    const updatedMessages = [...prev, sentMessage];
                    return Array.from(new Map(updatedMessages.map((msg) => [msg.id, msg])).values());
                });

                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify(sentMessage));
                }
            } catch (error) {
                console.error("Failed to send message", error);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            <div className="flex-1 p-4 overflow-y-auto">
                {isLoading || isConnecting ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                    </div>
                ) : connectionError ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-red-500">{connectionError}</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isCurrentUser = currentUser && msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id || index} className={`mb-4 ${isCurrentUser ? "text-right" : "text-left"}`}>
                                <div className={`inline-block max-w-[70%] p-3 rounded-lg ${isCurrentUser ? "bg-green-100 text-green-900" : "bg-gray-100 text-gray-900"}`}>
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <div className="flex items-center justify-end mt-1">
                                        <p className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef}></div>
            </div>

            <div className="p-4 border-t">
                <div className="flex">
                    <input
                        type="text"
                        className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isConnecting || connectionError}
                    />
                    <button className="px-4 bg-green-700 text-white rounded-r-lg hover:bg-green-800 transition-colors" onClick={handleSend} disabled={isConnecting || connectionError || !newMessage.trim()}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
