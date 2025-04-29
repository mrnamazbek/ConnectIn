import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus, faTimes, faPaperPlane, faUserCircle, faImage, faSpinner, faTimes as faClose } from "@fortawesome/free-solid-svg-icons";

const ChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { accessToken, user } = useAuthStore();

    // Store active conversation in localStorage when it changes
    useEffect(() => {
        if (activeConversation) {
            localStorage.setItem("activeConversationId", activeConversation.id);
        }
    }, [activeConversation]);

    // Set active conversation from localStorage after conversations load
    useEffect(() => {
        if (conversations.length > 0 && !activeConversation) {
            const savedConversationId = localStorage.getItem("activeConversationId");
            if (savedConversationId) {
                const conversation = conversations.find((conv) => conv.id === parseInt(savedConversationId));
                if (conversation) {
                    setActiveConversation(conversation);
                }
            }
        }
    }, [conversations, activeConversation]);

    // Protect against rendering when user is not loaded
    useEffect(() => {
        if (!user && !loading) {
            setLoading(true);
        } else if (user && loading && conversations.length > 0) {
            setLoading(false);
        }
    }, [user, loading, conversations]);

    // Fetch all conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/conversations`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                // Sort conversations by the timestamp of the last message (most recent first)
                const sortedConversations = [...response.data].sort((a, b) => {
                    // If a conversation has no last_message, it should appear at the end
                    if (!a.last_message) return 1;
                    if (!b.last_message) return -1;

                    // Compare timestamps (most recent first)
                    return new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp);
                });

                // Only include conversations with messages
                const conversationsWithMessages = sortedConversations.filter((conv) => conv.last_message !== null);

                setConversations(sortedConversations);
                setFilteredConversations(conversationsWithMessages);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching conversations:", err);
                setError("Failed to load conversations");
                setLoading(false);
            }
        };

        fetchConversations();
    }, [accessToken]);

    // Filter conversations based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            // Only show conversations with messages by default
            setFilteredConversations(conversations.filter((conv) => conv.last_message !== null));
        } else {
            const filtered = conversations.filter((conversation) => {
                const name = getConversationName(conversation).toLowerCase();
                return name.includes(searchTerm.toLowerCase());
            });
            setFilteredConversations(filtered);
        }
    }, [searchTerm, conversations]);

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

            // Update conversation last message
            setConversations((prevConversations) => {
                const updatedConversations = prevConversations.map((conv) => {
                    if (conv.id === activeConversation.id) {
                        return {
                            ...conv,
                            last_message: data,
                        };
                    }
                    return conv;
                });

                // Re-sort conversations after updating the last message
                return updatedConversations.sort((a, b) => {
                    if (!a.last_message) return 1;
                    if (!b.last_message) return -1;
                    return new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp);
                });
            });
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

    // Search for users
    const searchUsers = async () => {
        if (!userSearchTerm.trim()) return;

        setUserSearchLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/search?query=${userSearchTerm}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Filter out the current user from results
            const filteredResults = response.data.filter((u) => u.id !== user.id);
            setUserSearchResults(filteredResults);
        } catch (err) {
            console.error("Error searching users:", err);
        } finally {
            setUserSearchLoading(false);
        }
    };

    // Handle user search input
    const handleUserSearchChange = (e) => {
        setUserSearchTerm(e.target.value);
    };

    // Start a new conversation with a user
    const startConversation = async (userId) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chats/conversations`,
                { participant_ids: [userId] },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Add to conversations list if it's new
            const isExisting = conversations.some((conv) => conv.id === response.data.id);
            if (!isExisting) {
                setConversations((prev) => [...prev, response.data]);
                setFilteredConversations((prev) => [...prev, response.data]);
            }

            // Set as active conversation
            handleSetActiveConversation(response.data);
            setIsSearchingUsers(false);
            setUserSearchTerm("");
            setUserSearchResults([]);
        } catch (err) {
            console.error("Error creating conversation:", err);
        }
    };

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type and size
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
            return;
        }

        if (file.size > maxSize) {
            alert("Image size should be less than 10MB");
            return;
        }

        // Compress and resize the image before upload
        compressImage(file).then((compressedFile) => {
            setSelectedImage(compressedFile);
            const imageUrl = URL.createObjectURL(compressedFile);
            setImagePreview(imageUrl);
        });
    };

    // Compress and resize image
    const compressImage = (file) => {
        return new Promise((resolve) => {
            // Create an image element to load the file
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                // Create a canvas to resize the image
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Define max dimensions
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * (MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw resized image on canvas
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to blob
                canvas.toBlob(
                    (blob) => {
                        // Create a new File object from the blob
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: new Date().getTime(),
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    0.8
                ); // 0.8 quality (80%)
            };
        });
    };

    // Cancel image selection
    const clearImageSelection = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Upload image to S3 and send message
    const uploadImageAndSendMessage = async () => {
        if (!selectedImage) return;

        setUploadingImage(true);
        try {
            // Get presigned URL
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chats/upload_url`,
                {
                    file_name: selectedImage.name,
                    file_type: selectedImage.type,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            console.log("Presigned URL response:", response.data);
            console.log("Uploading to S3 URL:", response.data.url);
            console.log("Fields from presigned URL:", response.data.fields);

            // Check if we have the expected structure
            if (!response.data.url || !response.data.fields) {
                throw new Error("Invalid presigned URL response structure");
            }

            // Upload to S3 - S3 is very picky about form order
            const formDataForS3 = new FormData();

            // Add all fields from the presigned post data in the right order
            // Don't include any ACL fields as the bucket doesn't support them
            if (response.data.fields.key) {
                formDataForS3.append("key", response.data.fields.key);
            }

            // Add all other fields except ACL
            Object.entries(response.data.fields || {}).forEach(([key, value]) => {
                if (key !== "key" && key !== "acl") {
                    // Skip key and acl
                    formDataForS3.append(key, value);
                }
            });

            // File must be the last field
            formDataForS3.append("file", selectedImage);

            // Debug the form data we're sending
            console.log("Form data entries:");
            for (let pair of formDataForS3.entries()) {
                console.log(pair[0] + ": " + (pair[0] === "file" ? "[File object]" : pair[1]));
            }

            // Use native fetch API instead of axios for S3 upload
            // This gives us complete control over headers
            const s3UploadResponse = await fetch(response.data.url, {
                method: "POST",
                // No headers - let the browser set the right Content-Type with boundary
                body: formDataForS3,
            });

            if (!s3UploadResponse.ok) {
                // If S3 responds with error
                const errorText = await s3UploadResponse.text();
                console.error("S3 upload failed:", errorText);
                throw new Error(`S3 upload failed: ${s3UploadResponse.status} ${s3UploadResponse.statusText}`);
            }

            console.log("S3 upload successful", s3UploadResponse);

            // Send message with image through WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
                const messageData = {
                    content: newMessage.trim(),
                    media_url: response.data.object_url,
                    media_type: selectedImage.type,
                    media_name: selectedImage.name,
                };
                socket.send(JSON.stringify(messageData));
                setNewMessage("");
                clearImageSelection();
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            // Show more details about the error
            if (error.response) {
                console.error("Error response:", error.response.data);
                console.error("Status:", error.response.status);
            }
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle message submission (with or without image)
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if ((!newMessage.trim() && !selectedImage) || !socket || socket.readyState !== WebSocket.OPEN) return;

        if (selectedImage) {
            await uploadImageAndSendMessage();
            return;
        }

        // Text-only message
        const messageData = {
            content: newMessage.trim(),
        };

        socket.send(JSON.stringify(messageData));
        setNewMessage("");
    };

    // Open image click handler
    const handleImageClick = (imageUrl) => {
        setExpandedImage(imageUrl);
    };

    // Close expanded image
    const closeExpandedImage = () => {
        setExpandedImage(null);
    };

    // Wrapper function for setActiveConversation to add safety
    const handleSetActiveConversation = (conversation) => {
        if (conversation && conversation.id) {
            setActiveConversation(conversation);
            localStorage.setItem("activeConversationId", conversation.id);
        }
    };

    const formatTime = (timestamp) => {
        try {
            // Parse the timestamp and display in 24-hour format
            const date = new Date(timestamp);

            // Option 1: Use 24-hour format
            return format(date, "HH:mm");

            // Option 2 (alternative): Show both 12-hour and 24-hour formats
            // return format(date, 'h:mm a (HH:mm)');
        } catch (error) {
            console.error("Error formatting time:", error);
            return "";
        }
    };

    const formatDate = (timestamp) => {
        try {
            // Parse the UTC timestamp and convert to local time
            const messageDate = new Date(timestamp);
            const today = new Date();

            // Reset hours to compare just the dates
            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

            // Check if the message is from today
            if (messageDateOnly.getTime() === todayDate.getTime()) {
                return "Today";
            }

            // Check if the message is from yesterday
            const yesterdayDate = new Date(todayDate);
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            if (messageDateOnly.getTime() === yesterdayDate.getTime()) {
                return "Yesterday";
            }

            // For older messages, show the full date
            return format(messageDate, "MMM d, yyyy");
        } catch (error) {
            console.error("Error formatting date:", error);
            return "";
        }
    };

    const getConversationName = (conversation) => {
        if (!conversation || !conversation.participants) return "Chat";
        if (!user) return "Loading...";

        // Filter out current user and get the other participant(s)
        const otherParticipants = conversation.participants.filter((p) => p?.id !== user?.id);

        if (otherParticipants.length === 0) return "Just you";

        return otherParticipants.map((p) => `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username).join(", ");
    };

    const getParticipantAvatar = (conversation) => {
        if (!conversation || !conversation.participants || !user) return null;

        // Find the other participant
        const otherParticipant = conversation.participants.find((p) => p?.id !== user?.id);

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
            <div className="w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Messages</h2>
                        <button onClick={() => setIsSearchingUsers(!isSearchingUsers)} className="text-green-500 hover:text-green-600 transition-colors p-1">
                            <FontAwesomeIcon icon={isSearchingUsers ? faTimes : faPlus} />
                        </button>
                    </div>

                    {isSearchingUsers ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={userSearchTerm}
                                    onChange={handleUserSearchChange}
                                    placeholder="Search for users..."
                                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <button onClick={searchUsers} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-600">
                                    <FontAwesomeIcon icon={faSearch} />
                                </button>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {userSearchLoading ? (
                                    <div className="flex justify-center p-4">
                                        <div className="animate-spin h-5 w-5 border-b-2 border-green-500"></div>
                                    </div>
                                ) : userSearchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {userSearchResults.map((userResult) => (
                                            <motion.div key={userResult.id} className="p-2 flex items-center space-x-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => startConversation(userResult.id)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                                {userResult.avatar_url ? (
                                                    <img
                                                        src={userResult.avatar_url}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://via.placeholder.com/40";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                        <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm dark:text-white">{`${userResult.first_name || ""} ${userResult.last_name || ""}`.trim() || userResult.username}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{userResult.username}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : userSearchTerm ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">No users found</p>
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">Search for users to chat with</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    )}
                </div>

                <div className="overflow-y-auto flex-1">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {!isSearchingUsers && filteredConversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                <div className="mb-2">
                                    <FontAwesomeIcon icon={faUserCircle} className="text-3xl text-gray-400" />
                                </div>
                                <p className="text-sm">No conversations yet</p>
                                <p className="text-xs mt-1">Click the + button to start chatting</p>
                            </div>
                        ) : (
                            !isSearchingUsers &&
                            filteredConversations.map((conversation) => (
                                <motion.div
                                    key={conversation.id}
                                    className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeConversation?.id === conversation.id ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                                    onClick={() => handleSetActiveConversation(conversation)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            {getParticipantAvatar(conversation) ? (
                                                <img
                                                    src={getParticipantAvatar(conversation)}
                                                    alt="Avatar"
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-transparent"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.parentNode.replaceWith(
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-transparent">
                                                                <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
                                                            </div>
                                                        );
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-transparent">
                                                    <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
                                                </div>
                                            )}
                                            {/* Online indicator - would need to be dynamic */}
                                            {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div> */}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{getConversationName(conversation)}</p>
                                                {conversation.last_message && <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-1">{formatDate(conversation.last_message.timestamp)}</span>}
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conversation.last_message?.content || "No messages yet"}</p>
                                                {/* Unread indicator - would need to be dynamic */}
                                                {/* <span className="ml-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span> */}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center space-x-3">
                                {getParticipantAvatar(activeConversation) ? (
                                    <img
                                        src={getParticipantAvatar(activeConversation)}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.parentNode.replaceWith(
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
                                                </div>
                                            );
                                        }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-medium text-gray-900 dark:text-white">{getConversationName(activeConversation)}</h2>
                                    {/* Status would need to be dynamic */}
                                    {/* <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p> */}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                            <AnimatePresence>
                                {messages.length === 0 && !loading ? (
                                    <div className="flex h-full items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <div className="mb-2">
                                                <FontAwesomeIcon icon={faPaperPlane} className="text-3xl text-gray-400" />
                                            </div>
                                            <p>No messages yet</p>
                                            <p className="text-sm mt-1">Send a message to start the conversation</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <motion.div key={message.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mb-4 flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                                            {message.sender_id !== user.id &&
                                                (message.sender_avatar ? (
                                                    <img
                                                        src={message.sender_avatar}
                                                        alt="Avatar"
                                                        className="w-8 h-8 rounded-full mr-2 self-end"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.parentNode.replaceWith(
                                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-2 self-end">
                                                                    <FontAwesomeIcon icon={faUserCircle} />
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-2 self-end">
                                                        <FontAwesomeIcon icon={faUserCircle} />
                                                    </div>
                                                ))}
                                            <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${message.sender_id === user.id ? "bg-green-500 text-white rounded-br-none" : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"}`}>
                                                {message.content && <p className="whitespace-pre-wrap break-words overflow-hidden">{message.content}</p>}

                                                {message.media_url && (
                                                    <div className="mt-2 mb-1 relative">
                                                        <img
                                                            src={message.media_url}
                                                            alt={message.media_name || "Image"}
                                                            className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => handleImageClick(message.media_url)}
                                                            loading="lazy"
                                                            onLoad={(e) => {
                                                                // Remove loading indicator when image loads
                                                                const parent = e.target.parentNode;
                                                                if (parent) {
                                                                    const loadingIndicator = parent.querySelector(".loading-indicator");
                                                                    if (loadingIndicator) {
                                                                        loadingIndicator.style.display = "none";
                                                                    }
                                                                }
                                                            }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.style.display = "none";
                                                                // Also hide loading indicator if present
                                                                const parent = e.target.parentNode;
                                                                if (parent) {
                                                                    const loadingIndicator = parent.querySelector(".loading-indicator");
                                                                    if (loadingIndicator) {
                                                                        loadingIndicator.style.display = "none";
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        {/* Loading indicator with automatic timeout */}
                                                        <div
                                                            className="loading-indicator absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 dark:bg-gray-700 dark:bg-opacity-60 rounded"
                                                            ref={(el) => {
                                                                if (el) {
                                                                    // Auto-hide after 15 seconds as a safety measure
                                                                    setTimeout(() => {
                                                                        el.style.display = "none";
                                                                    }, 15000);
                                                                }
                                                            }}
                                                        >
                                                            <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={`text-xs mt-1 ${message.sender_id === user.id ? "text-green-100" : "text-gray-500 dark:text-gray-400"}`}>{formatTime(message.timestamp)}</div>
                                            </div>
                                            {message.sender_id === user.id &&
                                                (user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt="Your Avatar"
                                                        className="w-8 h-8 rounded-full ml-2 self-end"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.parentNode.replaceWith(
                                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 ml-2 self-end">
                                                                    <FontAwesomeIcon icon={faUserCircle} />
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 ml-2 self-end">
                                                        <FontAwesomeIcon icon={faUserCircle} />
                                                    </div>
                                                ))}
                                        </motion.div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </AnimatePresence>
                        </div>

                        {/* Message Input */}
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="mb-3 relative">
                                    <div className="relative inline-block">
                                        <img src={imagePreview} alt="Preview" className="max-h-32 max-w-xs rounded border border-gray-300 dark:border-gray-600" />
                                        <button onClick={clearImageSelection} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none">
                                            <FontAwesomeIcon icon={faClose} className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white px-4 py-2"
                                />

                                {/* Image Upload Button */}
                                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" />
                                <motion.button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={uploadingImage}
                                >
                                    <FontAwesomeIcon icon={faImage} />
                                </motion.button>

                                <motion.button
                                    type="submit"
                                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={(!newMessage.trim() && !selectedImage) || uploadingImage}
                                >
                                    {uploadingImage ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faPaperPlane} />}
                                </motion.button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
                        <div className="text-center">
                            <div className="mb-3">
                                <FontAwesomeIcon icon={faUserCircle} className="text-5xl text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Your Messages</h3>
                            <p className="text-sm mt-1 max-w-md px-4">Select a conversation from the list or search for users to start a new chat</p>
                            <button onClick={() => setIsSearchingUsers(true)} className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm flex items-center mx-auto">
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Start a new conversation
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Lightbox Modal */}
            {expandedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closeExpandedImage}>
                    <div className="relative max-w-4xl max-h-screen p-2">
                        <button className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 focus:outline-none" onClick={closeExpandedImage}>
                            <FontAwesomeIcon icon={faClose} />
                        </button>

                        {/* Loading indicator for lightbox */}
                        <div className="loading-indicator-lightbox absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin h-12 w-12 border-4 border-white rounded-full border-t-transparent"></div>
                        </div>

                        <img
                            src={expandedImage}
                            alt="Enlarged image"
                            className="max-w-full max-h-[90vh] object-contain"
                            onClick={(e) => e.stopPropagation()}
                            onLoad={(e) => {
                                // Hide loading indicator when image loads
                                const parent = e.target.parentNode;
                                if (parent) {
                                    const loadingIndicator = parent.querySelector(".loading-indicator-lightbox");
                                    if (loadingIndicator) {
                                        loadingIndicator.style.display = "none";
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
