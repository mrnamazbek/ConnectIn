import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { connectToChat } from "../../api/chatWebSocket";

const ChatWindow = () => {
    const { conversationId } = useParams();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const socketRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async (pageNum = 1) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pageNum,
                    per_page: 50,
                },
            });

            if (pageNum === 1) {
                setMessages(response.data.messages);
            } else {
                setMessages((prev) => [...response.data.messages, ...prev]);
            }
            setHasMore(response.data.has_more);
        } catch (error) {
            toast.error("Failed to load messages");
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (conversationId) {
            setLoading(true);
            setMessages([]);
            setPage(1);
            fetchMessages();
        }
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop } = messagesContainerRef.current;
            if (scrollTop === 0 && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchMessages(nextPage);
            }
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            const token = localStorage.getItem("token");
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/chats/${conversationId}/messages`, { content: newMessage }, { headers: { Authorization: `Bearer ${token}` } });

            setMessages((prev) => [...prev, response.data]);
            setNewMessage("");

            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify(response.data));
            }
        } catch (error) {
            toast.error("Failed to send message");
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    useEffect(() => {
        if (!conversationId) {
            console.warn("ChatWindow: No conversationId provided.");
            setConnectionError("Invalid conversation ID.");
            return;
        }

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
                setTimeout(() => setupWebSocket(), 2000);
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
        setLoading(true);
        try {
            const data = await fetchMessages(page);
            const uniqueMessages = Array.from(new Map(data.map((msg) => [msg.id, msg])).values());
            setMessages(uniqueMessages);
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setLoading(false);
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

    if (loading && messages.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.is_sender ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${message.is_sender ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                            <p className="text-sm">{message.content}</p>
                            <span className={`text-xs mt-1 block ${message.is_sender ? "text-blue-100" : "text-gray-500"}`}>{formatTimestamp(message.timestamp)}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" disabled={sending || !newMessage.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                        <FontAwesomeIcon icon={sending ? faSpinner : faPaperPlane} className={sending ? "animate-spin" : ""} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;
