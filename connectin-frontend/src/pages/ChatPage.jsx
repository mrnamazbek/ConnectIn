import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";
import { format } from "date-fns";

const ChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const { accessToken, user } = useAuthStore();

    // Fetch all conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/conversations`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                setConversations(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching conversations:", err);
                setError("Failed to load conversations");
                setLoading(false);
            }
        };

        fetchConversations();
    }, [accessToken]);

    // Fetch messages for active conversation
    useEffect(() => {
        if (!activeConversation) return;

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/conversations/${activeConversation.id}/messages`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                // Reverse to show oldest first
                setMessages(response.data.reverse());
            } catch (err) {
                console.error("Error fetching messages:", err);
                setError("Failed to load messages");
            }
        };

        fetchMessages();

        // Connect to WebSocket
        const wsUrl = `${import.meta.env.VITE_WS_URL}/api/v1/chat/ws/${activeConversation.id}?token=${accessToken}`;
        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
            console.log("WebSocket connection established");
        };

        newSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, data]);
        };

        newSocket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        newSocket.onclose = () => {
            console.log("WebSocket connection closed");
        };

        setSocket(newSocket);

        // Cleanup
        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, [activeConversation, accessToken]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

        const messageData = {
            content: newMessage,
        };

        socket.send(JSON.stringify(messageData));
        setNewMessage("");
    };

    const formatTime = (timestamp) => {
        try {
            return format(new Date(timestamp), "h:mm a");
        } catch {
            return "";
        }
    };

    const getConversationName = (conversation) => {
        if (!conversation || !conversation.participants) return "Chat";

        // Filter out current user and get the other participant(s)
        const otherParticipants = conversation.participants.filter((p) => p.id !== user.id);

        if (otherParticipants.length === 0) return "Just you";

        return otherParticipants.map((p) => `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username).join(", ");
    };

    const getParticipantAvatar = (conversation) => {
        if (!conversation || !conversation.participants) return null;

        // Find the other participant
        const otherParticipant = conversation.participants.find((p) => p.id !== user.id);

        return otherParticipant?.avatar_url;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Messages</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No conversations yet</div>
                    ) : (
                        conversations.map((conversation) => (
                            <motion.div
                                key={conversation.id}
                                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeConversation?.id === conversation.id ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                                onClick={() => setActiveConversation(conversation)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={getParticipantAvatar(conversation)}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/40";
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{getConversationName(conversation)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conversation.last_message?.content || "No messages yet"}</p>
                                    </div>
                                    {conversation.last_message && <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(conversation.last_message.timestamp)}</span>}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={getParticipantAvatar(activeConversation)}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/40";
                                    }}
                                />
                                <div>
                                    <h2 className="font-medium text-gray-900 dark:text-white">{getConversationName(activeConversation)}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                            <AnimatePresence>
                                {messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-gray-500">No messages yet</div>
                                ) : (
                                    messages.map((message) => (
                                        <motion.div key={message.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mb-4 flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                                            {message.sender_id !== user.id && (
                                                <img
                                                    src={message.sender_avatar || "https://via.placeholder.com/32"}
                                                    alt="Avatar"
                                                    className="w-8 h-8 rounded-full mr-2 self-end"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://via.placeholder.com/32";
                                                    }}
                                                />
                                            )}
                                            <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${message.sender_id === user.id ? "bg-green-500 text-white rounded-br-none" : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"}`}>
                                                <p>{message.content}</p>
                                                <div className={`text-xs mt-1 ${message.sender_id === user.id ? "text-green-100" : "text-gray-500 dark:text-gray-400"}`}>{formatTime(message.timestamp)}</div>
                                            </div>
                                            {message.sender_id === user.id && (
                                                <img
                                                    src={user.avatar_url || "https://via.placeholder.com/32"}
                                                    alt="Your Avatar"
                                                    className="w-8 h-8 rounded-full ml-2 self-end"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://via.placeholder.com/32";
                                                    }}
                                                />
                                            )}
                                        </motion.div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </AnimatePresence>
                        </div>

                        {/* Message Input */}
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white px-4 py-2"
                                />
                                <motion.button type="submit" className="bg-green-500 hover:bg-green-600 text-white rounded-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!newMessage.trim()}>
                                    Send
                                </motion.button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">Select a conversation to start chatting</div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
