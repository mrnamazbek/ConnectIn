// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { chatApi } from "../../api/chatApi";
import { ChatWebSocket } from "../../api/chatWebSocket";
import { motion, AnimatePresence } from "framer-motion";

// FontAwesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner, faCheckCircle, faImage, faTimes } from "@fortawesome/free-solid-svg-icons";

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
    const [wsConnected, setWsConnected] = useState(false);
    const [wsStatus, setWsStatus] = useState("connecting"); // "connecting", "connected", "fallback", "disconnected"
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

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

            // Clean up previous WebSocket if exists
            if (webSocketRef.current) {
                webSocketRef.current.disconnect();
            }

            setWsStatus("connecting");
            const ws = setupWebSocket(conversationId);
            webSocketRef.current = ws;

            // Initial data loading
            const init = async () => {
                setFullyLoaded(false); // Reset loading state
                await fetchCurrentUser();
                await validateAndSetup();
                await fetchMessages();
                setFullyLoaded(true); // All data loaded successfully
                scrollToBottom("auto");
            };

            init();

            // Clean up WebSocket on unmount
            return () => {
                if (webSocketRef.current) {
                    webSocketRef.current.disconnect();
                    setWsConnected(false);
                    setWsStatus("disconnected");
                }
            };
        }
    }, [conversationId]);

    // Setup WebSocket connection
    const setupWebSocket = (conversationId) => {
        try {
            const wsCallbacks = {
                onOpen: () => {
                    console.log("WebSocket connected successfully!");
                    setWsConnected(true);
                    setWsStatus("connected");
                },
                onClose: () => {
                    console.log("WebSocket disconnected");
                    setWsConnected(false);
                    setWsStatus("disconnected");
                },
                onError: (error) => {
                    console.error("WebSocket error:", error);
                    setWsConnected(false);

                    // If we're using fallback mode, update status
                    if (webSocketRef.current && webSocketRef.current.useFallback) {
                        setWsStatus("fallback");
                    } else {
                        setWsStatus("disconnected");
                    }
                },
                onMessage: handleWebSocketMessage,
            };

            const ws = new ChatWebSocket(conversationId, wsCallbacks);
            ws.connect();
            return ws;
        } catch (error) {
            console.error("Error setting up WebSocket:", error);
            setWsStatus("fallback");
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
        console.log("Received WebSocket message:", data);

        if (data.type === "message") {
            // Add new message to state
            setMessages((prevMessages) => {
                // Check if message already exists to prevent duplicates
                const exists = prevMessages.some((msg) => msg.id === data.id);
                if (exists) return prevMessages;

                return [
                    ...prevMessages,
                    {
                        id: data.id,
                        content: data.content,
                        sender_id: data.sender_id,
                        timestamp: data.timestamp,
                        read: null,
                        isNew: true, // Flag for animation
                    },
                ];
            });

            // Remove the isNew flag after animation
            setTimeout(() => {
                setMessages((prevMessages) => prevMessages.map((msg) => (msg.id === data.id ? { ...msg, isNew: false } : msg)));
            }, 1000);

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
            if (webSocketRef.current && wsConnected) {
                webSocketRef.current.sendMessage({
                    type: "typing",
                    is_typing: isTyping,
                    conversation_id: conversationId,
                });
            }
        }, 500),
        [conversationId, wsConnected]
    );

    // Handle read receipts
    const handleReadReceipt = (data) => {
        const { user_id, message_ids } = data;
        if (user_id !== currentUserId) {
            setMessages((prevMessages) => prevMessages.map((msg) => (message_ids.includes(msg.id) && !msg.read ? { ...msg, read: new Date() } : msg)));
        }
    };

    // Mark messages as read
    const markMessagesAsRead = async (messageIds) => {
        try {
            if (!messageIds.length) return;

            await chatApi.markAsRead(conversationId, messageIds);

            // Update local message state
            setMessages((prevMessages) => prevMessages.map((msg) => (messageIds.includes(msg.id) && !msg.read ? { ...msg, read: new Date() } : msg)));

            // Send read receipt via WebSocket
            if (webSocketRef.current && wsConnected) {
                webSocketRef.current.sendMessage({
                    type: "read_receipt",
                    message_ids: messageIds,
                    conversation_id: conversationId,
                });
            }
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
            const unreadMessages = newMessages.filter((msg) => msg.sender_id !== currentUserId && !msg.read).map((msg) => msg.id);

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

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size should be less than 10MB");
            return;
        }

        setMediaFile(file);

        // Create preview for images
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setMediaPreview(null);
        }
    };

    // Clear selected media
    const clearMediaSelection = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setUploadProgress(0);
    };

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        
        // Check if we have text or media to send
        if ((!newMessage.trim() && !mediaFile) || sending) return;

        setSending(true);

        try {
            if (mediaFile) {
                // Handle media upload
                const formData = new FormData();
                formData.append("file", mediaFile);
                
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
                    media_name: mediaFile.name,
                    media_type: mediaFile.type,
                };

                setMessages((prev) => [...prev, optimisticMessage]);
                setNewMessage("");
                clearMediaSelection();
                scrollToBottom();

                // Upload media using axios
                const token = localStorage.getItem("access_token");
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/chats/${conversationId}/media`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    },
                });

                // Replace optimistic message with real one
                setMessages((prev) => prev.map((msg) => 
                    (msg.id === optimisticId ? { ...response.data, isNew: true } : msg)
                ));

                // Remove the isNew flag after animation
                setTimeout(() => {
                    setMessages((prevMessages) => 
                        prevMessages.map((msg) => 
                            (msg.id === response.data.id ? { ...msg, isNew: false } : msg)
                        )
                    );
                }, 1000);
            } else {
                // Handle text message
                const messageContent = newMessage.trim();
                
                // Optimistically add message to UI first
                const optimisticId = `temp-${Date.now()}`;
                const optimisticMessage = {
                    id: optimisticId,
                    content: messageContent,
                    sender_id: currentUserId,
                    timestamp: new Date().toISOString(),
                    read: null,
                    optimistic: true, // Flag for optimistic update
                    isNew: true, // For animation
                };

                setMessages((prev) => [...prev, optimisticMessage]);
                setNewMessage("");
                scrollToBottom();

                // Try sending via WebSocket first
                let messageSent = false;
                if (webSocketRef.current && wsConnected) {
                    messageSent = webSocketRef.current.sendMessage({
                        type: "message",
                        content: messageContent,
                        conversation_id: conversationId,
                    });
                }

                // If WebSocket fails, fallback to REST API
                if (!messageSent) {
                    // Send the message via REST API
                    const message = await chatApi.sendMessage(conversationId, messageContent);

                    // Replace optimistic message with real one
                    setMessages((prev) => prev.map((msg) => (msg.id === optimisticId ? { ...message, isNew: true } : msg)));

                    // Remove the isNew flag after animation
                    setTimeout(() => {
                        setMessages((prevMessages) => prevMessages.map((msg) => (msg.id === message.id ? { ...msg, isNew: false } : msg)));
                    }, 1000);
                }
            }

            inputRef.current?.focus();

            // Clear typing indicator
            sendTypingIndicator(false);
            } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message. Please try again.");

            // Remove optimistic message on error
            setMessages((prev) => prev.filter((msg) => !msg.optimistic));
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
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">{formatMessageDate(group.messages[0].timestamp)}</span>
                </div>

                {group.messages.map((message, msgIndex) => {
                    const isCurrentUser = message.sender_id === currentUserId;
                    const previousMessage = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                    const isFirstInSequence = !previousMessage || previousMessage.sender_id !== message.sender_id;
                    const nextMessage = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : null;
                    const isLastInSequence = !nextMessage || nextMessage.sender_id !== message.sender_id;

                    const sender = participants.find((p) => p.id === message.sender_id);
                    const username = sender ? sender.username : "Unknown User";

                    return <MessageBubble key={message.id} message={message} isCurrentUser={isCurrentUser} showAvatar={isLastInSequence} isFirstInSequence={isFirstInSequence} isLastInSequence={isLastInSequence} username={username} />;
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
        if (conversationId && fullyLoaded) {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [conversationId, fullyLoaded]);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        if (messages.length > 0 && !loadingMore) {
            scrollToBottom();
        }
    }, [messages.length, loadingMore]);

    // Message bubble component (updated to support media)
    const MessageBubble = ({ message, isCurrentUser, showAvatar, isFirstInSequence, isLastInSequence, username }) => {
        const sender = participants.find((p) => p.id === message.sender_id);
        const isNew = message.isNew;
        const hasMedia = message.media_url || message.media_type;

    return (
            <motion.div initial={isNew ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${isFirstInSequence ? "mt-4" : "mt-1"}`}>
                {!isCurrentUser && showAvatar && (
                    <div className="flex-shrink-0 mr-2">
                        {sender?.avatar_url ? (
                            <img src={sender.avatar_url} alt={username} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 text-sm font-medium">{username[0].toUpperCase()}</div>
                        )}
                    </div>
                )}

                <div className={`relative max-w-[75%] ${isCurrentUser ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"} px-4 py-2 rounded-lg ${isCurrentUser ? "rounded-tr-none" : "rounded-tl-none"} ${isLastInSequence ? "mb-2" : "mb-0.5"}`}>
                    {!isCurrentUser && isFirstInSequence && <div className="absolute -top-5 left-0 text-xs text-gray-500 dark:text-gray-400 font-medium">{username}</div>}
                    
                    {/* Media content */}
                    {hasMedia && message.media_type?.startsWith("image/") && (
                        <div className="mb-2">
                            <img src={message.media_url} alt={message.media_name || "Image"} className="max-w-full rounded-lg" />
                        </div>
                    )}
                    
                    {hasMedia && !message.media_type?.startsWith("image/") && (
                        <div className="mb-2 flex items-center text-sm">
                            <FontAwesomeIcon icon={faImage} className="mr-2" />
                            <span className="truncate">{message.media_name || "File"}</span>
                        </div>
                    )}
                    
                    {/* Text content */}
                    {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                    
                    <div className="text-right mt-1">
                        <span className={`text-xs ${isCurrentUser ? "text-green-100" : "text-gray-500 dark:text-gray-400"}`}>{formatMessageTime(message.timestamp)}</span>
                        {isCurrentUser && message.read && <FontAwesomeIcon icon={faCheckCircle} className="ml-1 text-green-100" />}
                    </div>
                </div>

                {isCurrentUser && showAvatar && (
                    <div className="flex-shrink-0 ml-2">
                        {sender?.avatar_url ? (
                            <img src={sender.avatar_url} alt={username} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 text-sm font-medium">{username[0].toUpperCase()}</div>
                        )}
                    </div>
                )}
            </motion.div>
        );
    };

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

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800">
            {/* Conversation header */}
            <div className="flex items-center p-4 border-b dark:border-gray-700">
                {participants.length > 0 && (
                    <>
                        <div className="flex-shrink-0 mr-3">
                            {participants[0]?.avatar_url ? (
                                <img src={participants[0].avatar_url} alt={participants[0].username} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 font-medium">{participants[0]?.username?.[0]?.toUpperCase() || "?"}</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium dark:text-white">{participants.map((p) => p.username).join(", ")}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {typingIndicator ? (
                                    `${getUsernameById(typingIndicator.user_id)} is typing...`
                                ) : wsStatus === "connected" ? (
                                    <span className="text-green-500">Connected</span>
                                ) : wsStatus === "connecting" ? (
                                    <span className="text-yellow-500">Connecting...</span>
                                ) : wsStatus === "fallback" ? (
                                    <span className="text-orange-500">Using HTTP (WebSocket unavailable)</span>
                                ) : (
                                    <span className="text-red-500">Disconnected</span>
                                )}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Messages area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" onScroll={handleScroll} style={{ height: "calc(100vh - 170px)" }}>
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
                        <AnimatePresence>{renderMessages()}</AnimatePresence>
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input area */}
            <div className="border-t dark:border-gray-700 p-3">
                {/* Media preview */}
                {mediaFile && (
                    <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                {mediaPreview ? (
                                    <div className="w-12 h-12 mr-2 rounded overflow-hidden">
                                        <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 mr-2 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faImage} className="text-gray-500 dark:text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{mediaFile.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{(mediaFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button 
                                onClick={clearMediaSelection}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-center">
                    <label className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 cursor-pointer">
                        <FontAwesomeIcon icon={faImage} />
                        <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*,audio/*,video/*,application/pdf" />
                    </label>
                    <div className="flex-1 mx-2">
                    <input
                            ref={inputRef}
                        type="text"
                        value={newMessage}
                            onChange={handleInputChange}
                            placeholder={wsStatus === "fallback" ? "Using HTTP mode (typing indicators disabled)" : "Type a message..."}
                            className="w-full p-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                            disabled={sending || (wsStatus !== "connected" && wsStatus !== "fallback")}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !mediaFile) || sending || (wsStatus !== "connected" && wsStatus !== "fallback")}
                        className={`p-2 rounded-full ${(newMessage.trim() || mediaFile) && !sending && (wsStatus === "connected" || wsStatus === "fallback") ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}
                    >
                        {sending ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faPaperPlane} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;

