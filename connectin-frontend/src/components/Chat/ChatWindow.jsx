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
    const messagesEndRef = useRef(null); // Ref for auto-scrolling to the bottom

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
            const token = localStorage.getItem("access_token");
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
        setIsLoading(true);
        try {
            const data = await fetchMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setIsLoading(false);
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
                setMessages((prev) => [...prev, sentMessage]);

                // Send message via WebSocket
                if (socket) socket.send(JSON.stringify(sentMessage));
            } catch (error) {
                console.error("Failed to send message", error);
            }
        }
    };

    // Handle Enter key for sending messages
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    // Format timestamp to a user-friendly format
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); // Example: "14:30"
    };

    // Auto-scroll to the bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
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
                                        {/* {isCurrentUser && <span className="text-xs text-gray-500">{msg.status === "seen" ? "Seen" : "Delivered"}</span>} */}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {/* Empty div for auto-scrolling to the bottom */}
                <div ref={messagesEndRef}></div>
            </div>

            {/* Message Input Container */}
            <div className="p-4 border-t">
                <div className="flex">
                    <input type="text" className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} />
                    <button className="px-4 bg-green-700 text-white rounded-r-lg hover:bg-green-800 transition-colors" onClick={handleSend}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
