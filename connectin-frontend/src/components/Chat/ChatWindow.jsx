// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { chatApi } from "../../api/chatApi";
import { ChatWebSocket } from "../../api/chatWebSocket";
import { motion } from "framer-motion";

// FontAwesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

// Memoized message bubble component to prevent re-renders
const MessageBubble = memo(({ message, isCurrentUser, showAvatar, isFirstInSequence, username }) => {
    return (
        <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-1`}>
            <motion.div
                key={message.id}
                initial={message.isNew ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} max-w-[80%]`}
            >
                {showAvatar && !isCurrentUser && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-medium text-sm mr-2">
                        {username ? username[0].toUpperCase() : "?"}
                    </div>
                )}
                
                <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                    {isFirstInSequence && !isCurrentUser && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 mb-1">{username}</div>
                    )}
                    
                    <div className={`px-3 py-2 rounded-lg bg-opacity-100 dark:bg-opacity-100 ${isCurrentUser 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                    }`}>
                        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                    </div>
                    
                    <div className={`flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <span className="mx-1">{format(parseISO(message.timestamp), "h:mm a")}</span>
                        
                        {isCurrentUser && message.read && (
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 ml-1" title="Read" />
                        )}
                    </div>
                </div>
                
                {showAvatar && isCurrentUser && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-medium text-sm ml-2">
                        {username ? username[0].toUpperCase() : "?"}
                    </div>
                )}
            </motion.div>
        </div>
    );
});

// Add display name for debugging
MessageBubble.displayName = 'MessageBubble';

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
    const [wsConnected, setWsConnected] = useState(false);
    const [wsStatus, setWsStatus] = useState("connecting"); // "connecting", "connected", "fallback", "disconnected"
    const [receivedMessages, setReceivedMessages] = useState(new Set()); // Track received message IDs

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const webSocketRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const connectionTimeoutRef = useRef(null);
    const initialLoadCompletedRef = useRef(false);

    // Scroll to bottom of messages
    const scrollToBottom = (behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    // Clear all timeouts and intervals
    const clearTimers = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
    };

    // Handle socket connection and message reception
    useEffect(() => {
        initialLoadCompletedRef.current = false;
        setWsStatus("connecting");
        setWsConnected(false);
        setMessages([]);
        setReceivedMessages(new Set());
        
        // Clear any existing WebSocket and timers
            if (webSocketRef.current) {
                webSocketRef.current.disconnect();
            webSocketRef.current = null;
            }

        clearTimers();

        // Initialize
            const init = async () => {
            try {
                // Fetch current user first
                await fetchCurrentUser();
                
                // Fetch initial messages
                await fetchMessages();
                initialLoadCompletedRef.current = true;
                
                // Set up WebSocket connection after messages load
                setupWebSocket(conversationId);
                
                // Scroll to bottom
                setTimeout(() => {
                scrollToBottom("auto");
                }, 100);
            } catch (err) {
                console.error("Error initializing chat:", err);
                setError("Failed to load messages. Please try refreshing.");
                setLoading(false);
            }
            };

            init();

            // Clean up WebSocket on unmount
            return () => {
            clearTimers();
            
                if (webSocketRef.current) {
                    webSocketRef.current.disconnect();
                webSocketRef.current = null;
                }
            };
    }, [conversationId]);

    // Set up WebSocket connection
    const setupWebSocket = (conversationId) => {
        try {
            // Don't create multiple WebSocket connections
            if (webSocketRef.current) {
                webSocketRef.current.disconnect();
                webSocketRef.current = null;
            }
            
            setWsStatus("connecting");
            
            // Create a new WebSocket connection
            const socket = new ChatWebSocket(conversationId, {
                onOpen: () => {
                    console.log(`WebSocket connected for conversation ${conversationId}`);
                    
                    // Clear any existing connection timeout
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                    }
                    
                    // Clear any existing polling interval
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    
                    setWsConnected(true);
                    setWsStatus("connected");
                },
                onMessage: (data) => {
                    handleWebSocketMessage(data);
                },
                onClose: () => {
                    console.log(`WebSocket disconnected for conversation ${conversationId}`);
                    setWsConnected(false);
                    setWsStatus("disconnected");
                    
                    // If we weren't explicitly disconnected, try to fall back to polling
                    if (initialLoadCompletedRef.current) {
                        setupPolling();
                    }
                },
                onError: (error) => {
                    console.error(`WebSocket error: ${error}`);
                    setWsStatus("fallback");
                    
                    // Set up polling if WebSocket fails
                    if (initialLoadCompletedRef.current) {
                        setupPolling();
                    }
                }
            });
            
            // Store reference to disconnect later
            webSocketRef.current = socket;
            
            // Connect to the WebSocket server
            socket.connect();
            
            // Set a timeout to check connection status and fall back if needed
            connectionTimeoutRef.current = setTimeout(() => {
                validateAndSetup();
            }, 5000);
            
        } catch (error) {
            console.error("Failed to set up WebSocket:", error);
            setWsStatus("fallback");
            
            // Set up polling if WebSocket setup fails
            if (initialLoadCompletedRef.current) {
                setupPolling();
            }
        }
    };

    // Set up polling for new messages
    const setupPolling = () => {
        // Don't set up polling if it's already active
        if (pollIntervalRef.current) {
            return;
        }

        console.log("Setting up message polling");
        setWsStatus("fallback");
        
        // Poll for new messages every 10 seconds
        pollIntervalRef.current = setInterval(async () => {
            try {
                if (document.visibilityState === "visible") {
                    // Only poll when page is visible
                    const response = await chatApi.getMessages(conversationId, 1, 10);
                    
                    if (response && response.messages) {
                        // Filter out messages we've already received
                        const newMessages = response.messages.filter(
                            newMsg => !receivedMessages.has(newMsg.id)
                        );
                        
                        if (newMessages.length > 0) {
                            // Update our set of received message IDs
                            const updatedReceivedMessages = new Set(receivedMessages);
                            newMessages.forEach(msg => updatedReceivedMessages.add(msg.id));
                            setReceivedMessages(updatedReceivedMessages);
                            
                            // Add new messages
                            setMessages(prev => [...prev, ...newMessages]);
                            
                            // Scroll to bottom
                            setTimeout(() => {
                                scrollToBottom();
                            }, 100);
                        }
                    }
                }
            } catch (err) {
                console.error("Error polling messages:", err);
            }
        }, 10000); // 10 seconds interval
    };

    // Validate WebSocket connection and set up fallback if needed
    const validateAndSetup = async () => {
        // If WebSocket isn't connected after timeout, fall back to polling
        if (!wsConnected && initialLoadCompletedRef.current) {
            console.log("WebSocket not connected, using fallback mode");
            setupPolling();
        }
    };

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = (data) => {
        try {
            const messageType = data.type;
            
            if (messageType === "message") {
                // New message received
                const newMessage = {
                        id: data.id,
                    content: data.content || "",
                        sender_id: data.sender_id,
                    conversation_id: data.conversation_id,
                        timestamp: data.timestamp,
                        read: null,
                    isNew: true,
                };
                
                // Don't add duplicate messages
                if (!receivedMessages.has(newMessage.id)) {
                    // Update our set of received message IDs
                    setReceivedMessages(prev => new Set(prev).add(newMessage.id));
                    
                    // Add the new message
                    setMessages(prev => [...prev, newMessage]);
                    
                    // Scroll to bottom when receiving new messages
                    setTimeout(() => {
            scrollToBottom();
                    }, 100);
                    
                    // Mark message as read
                    if (newMessage.sender_id !== currentUserId) {
                        markMessagesAsRead([newMessage.id]);
                    }
                }
            } else if (messageType === "typing") {
            handleTypingIndicator(data);
            } else if (messageType === "read_receipt") {
            handleReadReceipt(data);
            }
        } catch (err) {
            console.error("Error handling WebSocket message:", err);
        }
    };

    // Handle typing indicator messages
    const handleTypingIndicator = (data) => {
        if (data.user_id === currentUserId) return;
        
        // Find username for the typing user
        const username = getUsernameById(data.user_id);
        
        if (data.is_typing) {
            setTypingIndicator({
                userId: data.user_id,
                username: username || "Someone",
                timestamp: new Date()
            });
            
            // Auto-clear typing indicator after 5 seconds of inactivity
            setTimeout(() => {
                setTypingIndicator(prevState => {
                    if (prevState && prevState.userId === data.user_id) {
                        return null;
                    }
                    return prevState;
                });
            }, 5000);
        } else {
            // Clear typing indicator for this user
            setTypingIndicator(prevState => {
                if (prevState && prevState.userId === data.user_id) {
                    return null;
                }
                return prevState;
            });
        }
    };

    // Handle read receipt messages
    const handleReadReceipt = (data) => {
        // Update read status for messages that were read
        setMessages(prevMessages => 
            prevMessages.map(msg => 
                data.message_ids.includes(msg.id) ? { ...msg, read: data.timestamp } : msg
            )
        );
    };

    // Mark messages as read on server
    const markMessagesAsRead = async (messageIds) => {
        try {
            if (!messageIds || messageIds.length === 0) return;
            
            // Send read receipt over WebSocket if connected
            if (webSocketRef.current && webSocketRef.current.isConnected()) {
                webSocketRef.current.sendMessage({
                    type: "read_receipt",
                    message_ids: messageIds,
                    conversation_id: conversationId
                });
            } else {
                // Fallback to REST API
                await chatApi.markAsRead(conversationId, messageIds);
            }
        } catch (err) {
            console.error("Error marking messages as read:", err);
        }
    };

    // Fetch messages from the API
    const fetchMessages = async (pageNum = 1) => {
        try {
            setLoadingMore(pageNum > 1);

            const response = await chatApi.getMessages(conversationId, pageNum);

            // Process messages
            if (response.messages && response.messages.length > 0) {
                // Update our set of received message IDs
                const updatedReceivedMessages = new Set(receivedMessages);
                response.messages.forEach(msg => updatedReceivedMessages.add(msg.id));
                setReceivedMessages(updatedReceivedMessages);
                
                // Add isNew = false flag to prevent animation
                const processedMessages = response.messages.map(msg => ({
                    ...msg,
                    isNew: false
                }));
                
                // Update messages state
            if (pageNum === 1) {
                    setMessages(processedMessages || []);
            } else {
                    // Add older messages at the beginning
                    setMessages(prev => [...processedMessages, ...prev]);
                }
            }

            // Update page and hasMore status
            setPage(pageNum);
            setHasMore(response.has_more);
            
            // Get conversation details including participants
            const conversation = await chatApi.getConversation(conversationId);
            if (conversation && conversation.participants_info) {
                setParticipants(conversation.participants_info);
            }
            
            return response;
        } catch (err) {
            console.error("Error fetching messages:", err);
                setError("Failed to load messages");
            toast.error("Could not load messages");
            throw err;
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Fetch current user info
    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No authentication token found");
            }
            
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setCurrentUserId(response.data.id);
            return response.data;
        } catch (err) {
            console.error("Error fetching current user:", err);
            throw err;
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
        
        // Check if we have text to send
        if (!newMessage.trim() || sending) return;

        setSending(true);

        try {
                // Optimistically add message to UI first
                const optimisticId = `temp-${Date.now()}`;
                const optimisticMessage = {
                    id: optimisticId,
                    content: newMessage.trim(),
                    sender_id: currentUserId,
                    timestamp: new Date().toISOString(),
                    read: null,
                    optimistic: true,
                    isNew: true,
                };

                setMessages((prev) => [...prev, optimisticMessage]);
                setNewMessage("");
                scrollToBottom();

            // Send message via WebSocket if connected
                let messageSent = false;
            if (webSocketRef.current && webSocketRef.current.isConnected()) {
                    messageSent = webSocketRef.current.sendMessage({
                        type: "message",
                    content: optimisticMessage.content,
                    conversation_id: conversationId
                    });
                }

            // If WebSocket failed, fall back to REST API
                if (!messageSent) {
                const response = await chatApi.sendMessage(conversationId, optimisticMessage.content);
                
                // Add to received messages set
                setReceivedMessages(prev => new Set(prev).add(response.id));

                    // Replace optimistic message with real one
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === optimisticId ? { ...response, isNew: true } : msg
                    )
                );
            }
        } catch (err) {
            console.error("Error sending message:", err);
            
            // Remove failed optimistic message
            setMessages((prev) => prev.filter((msg) => !msg.optimistic));
            
            toast.error("Failed to send message");
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

        // Convert to array of [date, messages] pairs
        return Object.entries(groups).map(([date, messages]) => ({
            date,
            messages
        }));
    };

    // Format message date for display
    const formatMessageDate = (dateString) => {
        try {
            const date = new Date(dateString);

        if (isToday(date)) {
            return "Today";
        } else if (isYesterday(date)) {
            return "Yesterday";
        } else {
            return format(date, "MMMM d, yyyy");
            }
        } catch (err) {
            console.error("Error formatting date", err);
            return "Unknown date";
        }
    };

    // Handle scroll for loading more messages
    const handleScroll = (e) => {
        const { scrollTop } = e.currentTarget;

        if (scrollTop === 0 && hasMore && !loadingMore) {
            loadMoreMessages();
        }
    };

    // Get username by user id
    const getUsernameById = (userId) => {
        const participant = participants.find(p => p.id === userId);
        return participant ? participant.username : "Unknown";
    };

    // Memoize grouped messages to prevent re-renders during typing
    const messageGroups = useMemo(() => {
        return groupMessagesByDate(messages);
    }, [messages]);

    // Handle input change and send typing indicator
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        
        // Send typing indicator over WebSocket
        if (webSocketRef.current && webSocketRef.current.isConnected()) {
            sendTypingIndicator(e.target.value.length > 0);
        }
    };
    
    // Debounce typing indicator to avoid too many messages
    const sendTypingIndicator = useCallback(
        debounce((isTyping) => {
            if (webSocketRef.current && webSocketRef.current.isConnected()) {
                webSocketRef.current.sendMessage({
                    type: "typing",
                    is_typing: isTyping,
                    conversation_id: conversationId
                });
            }
        }, 500),
        [webSocketRef.current, conversationId]
    );

    // Memoize message rendering to prevent re-renders during typing
    const renderedMessages = useMemo(() => {
        if (messages.length === 0) {
            return (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            );
        }

        return messageGroups.map((group, groupIndex) => (
            <div key={`group-${group.date}-${groupIndex}`} className="message-group mb-4">
                <div className="date-separator flex items-center justify-center my-3">
                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                        {formatMessageDate(group.date)}
                    </div>
                        </div>
                {group.messages.map((message, index) => {
                    const isCurrentUser = message.sender_id === currentUserId;
                    const prevMessage = index > 0 ? group.messages[index - 1] : null;
                    const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;
                    
                    const isFirstInSequence = !prevMessage || prevMessage.sender_id !== message.sender_id;
                    const isLastInSequence = !nextMessage || nextMessage.sender_id !== message.sender_id;
                    
                    return (
                        <MessageBubble
                            key={`msg-${message.id}-${groupIndex}-${index}`}
                            message={message}
                            isCurrentUser={isCurrentUser}
                            isFirstInSequence={isFirstInSequence}
                            showAvatar={isLastInSequence}
                            username={getUsernameById(message.sender_id)}
                        />
                    );
                })}
                    </div>
        ));
    }, [messageGroups, currentUserId, participants]);

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="text-red-500 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Error Loading Chat</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Chat header with participant info */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-3 flex items-center justify-between">
                <div className="flex items-center">
                    <div>
                        <h3 className="font-medium text-gray-800 dark:text-white">
                            {participants.map(p => p.username).join(", ")}
                        </h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {wsStatus === "connected" ? (
                                <span>WebSocket Connected</span>
                            ) : wsStatus === "fallback" ? (
                                <span>Using HTTP Fallback</span>
                            ) : wsStatus === "connecting" ? (
                                <span>Connecting...</span>
                            ) : (
                                <span>Disconnected</span>
                            )}
                        </div>
                    </div>
                        </div>
            </div>

            {/* Messages container with scroll */}
            <div
                ref={messagesContainerRef}
                className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900"
                onScroll={handleScroll}
            >
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {loadingMore && (
                            <div className="flex justify-center py-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                            </div>
                        )}
                        
                        {renderedMessages}
                        
                        {/* Show typing indicator */}
                        {typingIndicator && (
                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm animate-pulse mt-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-medium text-sm mr-2">
                                    {typingIndicator.username[0].toUpperCase()}
                                </div>
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span className="ml-2">{typingIndicator.username} is typing...</span>
                            </div>
                        )}
                        
                        {/* Element to scroll to */}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
                
            {/* Message input */}
            <div className="border-t dark:border-gray-700 p-3">                
                <form onSubmit={handleSendMessage} className="flex items-center">
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
                            !newMessage.trim() || sending
                                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                                : "bg-green-500 text-white hover:bg-green-600"
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

