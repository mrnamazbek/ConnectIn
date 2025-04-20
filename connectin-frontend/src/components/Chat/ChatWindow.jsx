// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { chatApi } from "../../api/chatApi";
import { ChatWebSocket } from "../../api/chatWebSocket";

// FontAwesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPaperPlane, 
    faSpinner, 
    faCheckCircle,
    faImage
} from "@fortawesome/free-solid-svg-icons";

const ChatWindow = ({ conversationId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [typingIndicator, setTypingIndicator] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [fullyLoaded, setFullyLoaded] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const webSocketRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = (behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    // Initialize WebSocket connection
    useEffect(() => {
        if (conversationId) {
            console.log(`Setting up WebSocket for conversation ${conversationId}`);
            const ws = setupWebSocket(conversationId);
            webSocketRef.current = ws;

            // Initial data loading
            const init = async () => {
                setFullyLoaded(false); // Reset loading state
                await validateAndSetup();
                await fetchCurrentUser();
                await fetchMessages();
                setFullyLoaded(true); // All data loaded successfully
                scrollToBottom("auto");
            };
            
            init();

            // Clean up WebSocket on unmount
            return () => {
                if (webSocketRef.current) {
                    webSocketRef.current.disconnect();
                }
            };
        }
    }, [conversationId]);

    // Setup WebSocket connection
    const setupWebSocket = (conversationId) => {
        try {
            const ws = new ChatWebSocket(conversationId, handleWebSocketMessage);
            ws.connect();
            return ws;
        } catch (error) {
            console.error("Error setting up WebSocket:", error);
            return null;
        }
    };

    // Validate and setup conversation
    const validateAndSetup = async () => {
        if (!conversationId) {
            setError("No conversation selected");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const conversation = await chatApi.getConversation(conversationId);
            
            if (!conversation) {
                console.error("Conversation not found:", conversationId);
                setError("Conversation not found");
                setLoading(false);
                return;
            }
            
            setParticipants(conversation.participants_info || []);
            setLoading(false);
        } catch (error) {
            console.error("Error validating conversation:", error);
            setError("Error loading conversation");
            setLoading(false);
        }
    };

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = (data) => {
        if (data.type === "message") {
            // Add new message to state
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    id: data.id,
                    content: data.content,
                    sender_id: data.sender_id,
                    timestamp: data.timestamp,
                    read: null,
                },
            ]);
            
            // Mark as read
            markMessagesAsRead([data.id]);
            
            // Scroll to bottom
            scrollToBottom();
        } else if (data.type === "typing") {
            handleTypingIndicator(data);
        } else if (data.type === "read_receipt") {
            handleReadReceipt(data);
        }
    };

    // Handle typing indicators
    const handleTypingIndicator = (data) => {
        if (data.is_typing) {
            setTypingIndicator({
                user_id: data.user_id,
                timestamp: new Date(),
            });
        } else {
            setTypingIndicator(null);
        }
    };

    // Send typing indicator (debounced)
    const sendTypingIndicator = useCallback(
        debounce((isTyping) => {
            if (webSocketRef.current) {
                webSocketRef.current.sendMessage({
                    type: "typing",
                    is_typing: isTyping,
                    conversation_id: conversationId,
                });
            }
        }, 500),
        [conversationId]
    );

    // Handle read receipts
    const handleReadReceipt = (data) => {
        const { user_id, message_ids } = data;
        if (user_id !== currentUserId) {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    message_ids.includes(msg.id) && !msg.read
                        ? { ...msg, read: new Date() }
                        : msg
                )
            );
        }
    };

    // Mark messages as read
    const markMessagesAsRead = async (messageIds) => {
        try {
            if (!messageIds.length) return;
            
            await chatApi.markAsRead(conversationId, messageIds);
            
            // Update local message state
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    messageIds.includes(msg.id) && !msg.read
                        ? { ...msg, read: new Date() }
                        : msg
                )
            );
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    // Fetch messages from API
    const fetchMessages = async (pageNum = 1) => {
        try {
            setLoadingMore(pageNum > 1);
            
            const response = await chatApi.getMessages(conversationId, pageNum);
            
            const newMessages = response.messages.reverse();
            
            if (pageNum === 1) {
                setMessages(newMessages);
            } else {
                setMessages((prevMessages) => [...newMessages, ...prevMessages]);
            }
            
            setHasMore(response.has_more);
            setPage(pageNum);
            
            // Mark newly loaded messages as read
            const unreadMessages = newMessages
                .filter((msg) => msg.sender_id !== currentUserId && !msg.read)
                .map((msg) => msg.id);
                
            if (unreadMessages.length) {
                markMessagesAsRead(unreadMessages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            if (error.response?.status === 404) {
                setError("Conversation not found");
            } else {
                setError("Failed to load messages");
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Get current user
    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUserId(response.data.id);
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    };

    // Load more messages when scrolling up
    const loadMoreMessages = () => {
        if (hasMore && !loadingMore) {
            const nextPage = page + 1;
            
            // Save scroll position
            const scrollContainer = messagesContainerRef.current;
            const scrollHeight = scrollContainer.scrollHeight;
            
            fetchMessages(nextPage).then(() => {
                // Restore scroll position after new messages load
                requestAnimationFrame(() => {
                    const newScrollHeight = scrollContainer.scrollHeight;
                    const heightDifference = newScrollHeight - scrollHeight;
                    scrollContainer.scrollTop = heightDifference;
                });
            });
        }
    };

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending) return;
        
        setSending(true);
        try {
            // Send the message via REST API
            const message = await chatApi.sendMessage(conversationId, newMessage);

            // Update local messages state
            setMessages((prev) => [...prev, message]);
            setNewMessage("");
            inputRef.current?.focus();
            scrollToBottom();

            // Clear typing indicator
            sendTypingIndicator(false);
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        const groups = {};
        
        messages.forEach((message) => {
            const date = new Date(message.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        
        return Object.entries(groups).map(([date, msgs]) => ({
            date,
            messages: msgs,
        }));
    };

    // Format message date for display
    const formatMessageDate = (dateString) => {
        // Parse the UTC date and adjust for timezone
        const date = parseISO(dateString);
        
        if (isToday(date)) {
            return "Today";
        } else if (isYesterday(date)) {
            return "Yesterday";
        } else {
            return format(date, "MMMM d, yyyy");
        }
    };

    // Handle scrolling to load more messages
    const handleScroll = (e) => {
        const { scrollTop } = e.currentTarget;
        
        if (scrollTop < 50 && hasMore && !loadingMore) {
            loadMoreMessages();
        }
    };

    // Convert UTC timestamp to local time
    const formatMessageTime = (timestamp) => {
        const date = parseISO(timestamp);
        return format(date, "h:mm a");
    };

    // Render messages grouped by date
    const renderMessages = () => {
        const messageGroups = groupMessagesByDate(messages);
        
        return messageGroups.map((group) => (
            <div key={group.date} className="message-group mb-6">
                <div className="message-date-divider flex justify-center mb-4">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                        {formatMessageDate(group.messages[0].timestamp)}
                    </span>
                </div>
                
                {group.messages.map((message, msgIndex) => {
                    const isCurrentUser = message.sender_id === currentUserId;
                    const previousMessage = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                    const isFirstInSequence = !previousMessage || previousMessage.sender_id !== message.sender_id;
                    const nextMessage = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : null;
                    const isLastInSequence = !nextMessage || nextMessage.sender_id !== message.sender_id;
                    
                    const sender = participants.find((p) => p.id === message.sender_id);
                    const username = sender ? sender.username : "Unknown User";
                    
                    return (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isCurrentUser={isCurrentUser}
                            showAvatar={isLastInSequence}
                            isFirstInSequence={isFirstInSequence}
                            isLastInSequence={isLastInSequence}
                            username={username}
                        />
                    );
                })}
            </div>
        ));
    };

    // Get username by ID
    const getUsernameById = (userId) => {
        const user = participants.find((p) => p.id === userId);
        return user ? user.username : "Unknown User";
    };

    // Handle input change and send typing indicator
    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);
        
        // Send typing indicator if changed from empty to non-empty or vice versa
        const wasEmpty = !newMessage.trim();
        const nowEmpty = !value.trim();
        
        if (wasEmpty !== nowEmpty) {
            sendTypingIndicator(!nowEmpty);
        }
    };

    // Focus input when conversation changes
    useEffect(() => {
        if (conversationId) {
            // Reset state for new conversation
            setMessages([]);
            setPage(1);
            setLoading(true);
            setError(null);
            setFullyLoaded(false);
            
            const init = async () => {
                await validateAndSetup();
                await fetchCurrentUser();
                await fetchMessages();
                setFullyLoaded(true);
                scrollToBottom("auto");
                
                // Focus input field after loading
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            };
            
            init();
        }
    }, [conversationId]);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        if (messages.length > 0 && !loadingMore) {
            scrollToBottom();
        }
    }, [messages.length, loadingMore]);

    // Render main component
    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                <div className="text-center p-6">
                    <div className="text-4xl mb-4">😕</div>
                    <p className="mb-2">{error}</p>
                    <p className="text-sm">Please try again or select another conversation</p>
                </div>
            </div>
        );
    }

    // Message bubble component
    const MessageBubble = ({ message, isCurrentUser, showAvatar, isFirstInSequence, isLastInSequence, username }) => {
        const sender = participants.find(p => p.id === message.sender_id);
        
        return (
            <div
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${
                    isFirstInSequence ? "mt-4" : "mt-1"
                }`}
            >
                {!isCurrentUser && showAvatar && (
                    <div className="flex-shrink-0 mr-2">
                        {sender?.avatar_url ? (
                            <img
                                src={sender.avatar_url}
                                alt={username}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 text-sm font-medium">
                                {username[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                )}

                <div
                    className={`group relative max-w-[75%] ${
                        isCurrentUser ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                    } ${isFirstInSequence ? "rounded-t-lg" : ""} ${
                        isLastInSequence ? (isCurrentUser ? "rounded-bl-lg rounded-tl-lg" : "rounded-br-lg rounded-tr-lg") : ""
                    } px-4 py-2 break-words`}
                >
                    {isFirstInSequence && !isCurrentUser && (
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{username}</div>
                    )}
                    <div>{message.content}</div>
                    <div className="text-xs opacity-70 text-right mt-1">
                        {formatMessageTime(message.timestamp)}
                        {isCurrentUser && message.read && (
                            <span className="ml-1">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800">
            {/* Conversation header */}
            <div className="flex items-center p-4 border-b dark:border-gray-700">
                {participants.length > 0 && (
                    <>
                        <div className="flex-shrink-0 mr-3">
                            {participants[0]?.avatar_url ? (
                                <img
                                    src={participants[0].avatar_url}
                                    alt={participants[0].username}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 font-medium">
                                    {participants[0]?.username?.[0]?.toUpperCase() || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium dark:text-white">{participants.map((p) => p.username).join(", ")}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {typingIndicator ? `${getUsernameById(typingIndicator.user_id)} is typing...` : ""}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
                onScroll={handleScroll}
                style={{ height: "calc(100vh - 170px)" }}
            >
                {loading || !fullyLoaded ? (
                    <div className="flex justify-center items-center h-full">
                        <FontAwesomeIcon icon={faSpinner} className="text-green-500 text-xl animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <div className="mb-4 text-5xl">💬</div>
                        <p className="mb-2">No messages yet</p>
                        <p className="text-sm">Send the first message to start the conversation</p>
                    </div>
                ) : (
                    <>
                        {loadingMore && (
                            <div className="text-center py-2">
                                <FontAwesomeIcon icon={faSpinner} className="text-green-500 animate-spin" />
                            </div>
                        )}
                        {renderMessages()}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input area */}
            <div className="border-t dark:border-gray-700 p-3">
                <form onSubmit={handleSendMessage} className="flex items-center">
                    <button
                        type="button"
                        onClick={() => {
                            // Directly trigger file input click instead of showing MediaUpload component
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'image/*';
                            fileInput.onchange = (e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const formData = new FormData();
                                    formData.append('file', e.target.files[0]);
                                    
                                    setSending(true);
                                    const token = localStorage.getItem('access_token');
                                    
                                    axios.post(
                                        `${import.meta.env.VITE_API_URL}/chats/${conversationId}/messages`,
                                        formData,
                                        {
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'multipart/form-data',
                                            }
                                        }
                                    ).then(response => {
                                        setMessages(prev => [...prev, response.data]);
                                        scrollToBottom();
                                        toast.success('Media sent successfully');
                                    }).catch(error => {
                                        console.error('Error sending media:', error);
                                        toast.error('Failed to send media. The server may not support file uploads yet.');
                                    }).finally(() => {
                                        setSending(false);
                                    });
                                }
                            };
                            fileInput.click();
                        }}
                        className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500"
                    >
                        <FontAwesomeIcon icon={faImage} />
                    </button>
                    <div className="flex-1 mx-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="w-full p-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                            disabled={sending}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`p-2 rounded-full ${
                            newMessage.trim() && !sending
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {sending ? (
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        ) : (
                            <FontAwesomeIcon icon={faPaperPlane} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
