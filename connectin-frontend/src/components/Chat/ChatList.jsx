import { useState, useEffect, useCallback } from "react";
import { chatApi } from "../../api/chatApi";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { debounce } from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faUser } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const ChatList = ({ onSelectConversation, selectedConversationId }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [participantsLoading, setParticipantsLoading] = useState({});

    // Fetch conversations from the API
    const fetchConversations = async (pageNum = 1, search = "") => {
        try {
            setLoading(pageNum === 1);

            // Include search parameter if provided
            const params = { page: pageNum, search };
            const data = await chatApi.getConversations(params);

            // Filter out conversations with no messages
            const filteredData = data.filter(conv => conv.last_message !== null);
            
            // Sort by most recent message
            filteredData.sort((a, b) => {
                if (!a.last_message) return 1;
                if (!b.last_message) return -1;
                return new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp);
            });

            // Mark which conversations need participant data loading
            const loadingState = {};
            filteredData.forEach(conv => {
                if (!conv.participants_info || conv.participants_info.length === 0) {
                    loadingState[conv.id] = true;
                    
                    // Fetch participant info if missing
                    fetchParticipantInfo(conv.id, conv.participants);
                } else {
                    loadingState[conv.id] = false;
                }
            });
            
            setParticipantsLoading(prev => ({...prev, ...loadingState}));

            if (pageNum === 1) {
                setConversations(filteredData);
            } else {
                setConversations((prev) => [...prev, ...filteredData]);
            }

            setHasMore(filteredData.length === 20); // Assuming 20 is the page size
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching conversations:", error);
            toast.error("Failed to load conversations");
        } finally {
            setLoading(false);
            setSearching(false);
        }
    };

    // Fetch participant info if missing
    const fetchParticipantInfo = async (conversationId, participantIds) => {
        try {
            const token = localStorage.getItem("access_token");
            const promises = participantIds.filter(id => id !== currentUser?.id).map(id => 
                axios.get(`${import.meta.env.VITE_API_URL}/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            );
            
            const responses = await Promise.all(promises);
            const participants = responses.map(res => res.data);
            
            // Update conversations with participant info
            setConversations(prevConversations => 
                prevConversations.map(conv => 
                    conv.id === conversationId 
                        ? {...conv, participants_info: participants}
                        : conv
                )
            );
            
            // Mark conversation as loaded
            setParticipantsLoading(prev => ({...prev, [conversationId]: false}));
        } catch (error) {
            console.error(`Error fetching participant info for conversation ${conversationId}:`, error);
        }
    };

    // Fetch current user
    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    };

    // Search conversations (debounced)
    const searchConversations = useCallback(
        debounce((query) => {
            if (query.length > 0) {
                setSearching(true);
                fetchConversations(1, query);
            } else {
                fetchConversations(1);
            }
        }, 500),
        []
    );

    // Initialize conversations
    useEffect(() => {
        fetchCurrentUser();
        fetchConversations();
    }, []);

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchConversations(query);
    };

    // Format the last message content
    const formatLastMessage = (message) => {
        if (!message) return "No messages yet";
        return message.content.length > 30 ? `${message.content.substring(0, 30)}...` : message.content;
    };

    // Get other participants in conversation (excluding current user)
    const getOtherParticipants = (conversation) => {
        if (!currentUser || !conversation.participants_info) return [];
        return conversation.participants_info;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b dark:border-gray-700">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {searching ? 
                            <FontAwesomeIcon icon={faSpinner} className="text-gray-400 dark:text-gray-500 animate-spin" /> : 
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400 dark:text-gray-500" />
                        }
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search conversations..." 
                        value={searchQuery} 
                        onChange={handleSearchChange} 
                        className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {loading && page === 1 ? (
                    <div className="flex justify-center items-center h-24">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-green-500 text-xl" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 text-gray-500 dark:text-gray-400 p-4">
                        <div className="text-5xl mb-4">💬</div>
                        <p className="text-center">{searchQuery ? "No conversations found matching your search" : "No conversations yet. Start chatting with someone!"}</p>
                    </div>
                ) : (
                    <div className="divide-y dark:divide-gray-700">
                        {conversations.map((conversation) => {
                            const otherParticipants = getOtherParticipants(conversation);
                            const hasUnread = conversation.unread_count > 0;
                            const isLoading = participantsLoading[conversation.id];

                            return (
                                <div 
                                    key={conversation.id} 
                                    onClick={() => onSelectConversation(conversation.id)} 
                                    className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                        selectedConversationId === conversation.id 
                                            ? "bg-green-50 dark:bg-gray-700" 
                                            : hasUnread 
                                                ? "bg-green-50/30 dark:bg-gray-800" 
                                                : ""
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="relative">
                                            {isLoading ? (
                                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-green-500" />
                                                </div>
                                            ) : otherParticipants[0]?.avatar_url ? (
                                                <img 
                                                    src={otherParticipants[0].avatar_url} 
                                                    alt={otherParticipants[0].username}
                                                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 font-semibold">
                                                    {otherParticipants[0]?.username?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />}
                                                </div>
                                            )}
                                            {hasUnread && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className={`font-medium truncate dark:text-white ${hasUnread ? "font-semibold" : ""}`}>
                                                    {isLoading ? 
                                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div> : 
                                                        otherParticipants.map((p) => p.username).join(", ") || "Loading..."}
                                                </h3>
                                                {conversation.last_message && !isLoading && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                                        {formatDistanceToNow(new Date(conversation.last_message.timestamp), { addSuffix: true })}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-1">
                                                {isLoading ? (
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                                                ) : (
                                                    <p className={`text-sm truncate ${
                                                        hasUnread 
                                                            ? "text-gray-900 dark:text-white font-medium" 
                                                            : "text-gray-500 dark:text-gray-400"
                                                    }`}>
                                                        {conversation.last_message?.sender_id === currentUser?.id && (
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">You: </span>
                                                        )}
                                                        {formatLastMessage(conversation.last_message)}
                                                    </p>
                                                )}

                                                {hasUnread && !isLoading && (
                                                    <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                        {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMore && !loading && (
                    <button
                        onClick={() => {
                            const nextPage = page + 1;
                            fetchConversations(nextPage, searchQuery);
                        }}
                        className="w-full p-3 text-center text-green-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Load More
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatList;
