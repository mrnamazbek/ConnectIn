import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faSpinner, 
    faExclamationTriangle, 
    faSearch, 
    faUser, 
    faUsers, 
    faTimes,
    faEllipsisVertical,
    faComments
} from "@fortawesome/free-solid-svg-icons";
import ChatWindow from "../components/Chat/ChatWindow";
import ChatList from "../components/Chat/ChatList";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";

const ChatPage = () => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchedUsers, setSearchedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isStartingConversation, setIsStartingConversation] = useState(false); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showConversations, setShowConversations] = useState(true);

    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setShowConversations(true);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Debounce utility
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            // Check if user is authenticated
            if (!TokenService.isUserLoggedIn()) {
                setError("You need to be logged in to access chats");
                setLoading(false);
                return;
            }

            try {
                // Try to load cached users first
                const cachedUsers = localStorage.getItem("cachedUsers");
                if (cachedUsers) {
                    setUsers(JSON.parse(cachedUsers));
                } else {
                    await fetchUsers();
                }

                // Fetch current user and conversations
                const userResult = await fetchCurrentUser();
                if (userResult) {
                    await fetchConversations();
                }
            } catch (err) {
                console.error("Error initializing chat page:", err);
                setError("Failed to load chat data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const token = TokenService.getAccessToken();
            if (!token) {
                toast.error("Authentication required");
                navigate("/login");
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const newUsers = response.data;
            setUsers(newUsers);
            // Update cache with fresh data
            localStorage.setItem("cachedUsers", JSON.stringify(newUsers));
            return true;
        } catch (error) {
            console.error("Failed to fetch users", error);
            if (error.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                navigate("/login");
            }
            return false;
        } finally {
            setLoadingUsers(false);
        }
    };

    // Update fetchConversations to filter out empty conversations
    const fetchConversations = async () => {
        try {
            const token = TokenService.getAccessToken();
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            // Filter out conversations with no messages
            const filteredConversations = response.data.filter(
                conv => conv.last_message !== null
            );
            
            // Sort by most recent message
            filteredConversations.sort((a, b) => {
                if (!a.last_message) return 1;
                if (!b.last_message) return -1;
                return new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp);
            });
            
            setConversations(filteredConversations);
            return true;
        } catch (error) {
            console.error("Failed to fetch conversations", error);
            if (error.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                navigate("/login");
            } else if (error.response?.status === 404) {
                // API endpoint not found
                setError("Chat service is currently unavailable");
            }
            return false;
        }
    };

    // Improve search functionality
    const debouncedSearchUsers = useCallback(
        debounce(async () => {
            if (!searchQuery.trim()) {
                setSearchedUsers([]);
                return;
            }
            setIsSearching(true);
            try {
                const token = TokenService.getAccessToken();
                if (!token) {
                    navigate("/login");
                    return;
                }

                // If search API doesn't support partial matching, we can filter locally from all users
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                // Filter users based on partial search query match (case insensitive)
                const filteredUsers = response.data.filter(user => 
                    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
                );
                
                setSearchedUsers(filteredUsers);
            } catch (error) {
                console.error("Error searching users", error);
                if (error.response?.status === 401) {
                    toast.error("Your session has expired. Please log in again.");
                    navigate("/login");
                }
            } finally {
                setIsSearching(false);
            }
        }, 300),
        [searchQuery, navigate]
    );

    const fetchCurrentUser = async () => {
        try {
            const token = TokenService.getAccessToken();
            if (!token) {
                toast.error("Authentication required");
                navigate("/login");
                return null;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch current user", error);

            if (error.response?.status === 401) {
                TokenService.clearTokens();
                toast.error("Your session has expired. Please log in again.");
                navigate("/login");
            }
            return null;
        }
    };

    const startConversation = async (user) => {
        if (isStartingConversation) return; // Prevent multiple calls
        setIsStartingConversation(true);

        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Authentication required");
                navigate("/login");
                return;
            }

            if (!currentUser) {
                console.warn("Current user not loaded yet, trying again...");
                const userResult = await fetchCurrentUser();
                if (!userResult) {
                    toast.error("Unable to load your profile data");
                    return;
                }
            }

            setShowUserSearch(false);
            
            // Display loading toast
            const loadingToastId = toast.loading("Starting conversation...");
            
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const existingConversation = response.data.find(
                (conv) => conv.type === "direct" && 
                conv.participants.includes(currentUser.id) && 
                conv.participants.includes(user.id)
            );

            if (existingConversation) {
                // Update conversations list to ensure it's in sync
                setConversations((prev) => {
                    const exists = prev.some((c) => c.id === existingConversation.id);
                    if (!exists) {
                        return [...prev, existingConversation];
                    }
                    return prev;
                });
                setSelectedConversation(existingConversation.id);
                toast.update(loadingToastId, { 
                    render: "Conversation found", 
                    type: "success", 
                    isLoading: false, 
                    autoClose: 1500 
                });
                
                if (isMobile) {
                    setShowConversations(false);
                }
            } else {
                const newConversation = await axios.post(
                    `${import.meta.env.VITE_API_URL}/chats/`,
                    {
                        type: "direct",
                        participant_ids: [user.id],
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (newConversation.data) {
                    // Update conversations list with the new conversation
                    setConversations((prev) => [...prev, newConversation.data]);
                    setSelectedConversation(newConversation.data.id);
                    toast.update(loadingToastId, { 
                        render: "Conversation created", 
                        type: "success", 
                        isLoading: false, 
                        autoClose: 1500 
                    });
                    
                    if (isMobile) {
                        setShowConversations(false);
                    }
                }
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            if (error.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                navigate("/login");
            } else {
                toast.error("Failed to start conversation. Please try again.");
            }
        } finally {
            setIsStartingConversation(false);
        }
    };

    // Handle search input change with debouncing
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        debouncedSearchUsers();
    };

    const toggleUserSearch = () => {
        setShowUserSearch(!showUserSearch);
        setSearchQuery("");
        setSearchedUsers([]);
        if (!showUserSearch) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    };

    const handleSelectConversation = (conversationId) => {
        setSelectedConversation(conversationId);
        if (isMobile) {
            setShowConversations(false);
        }
    };

    const backToConversations = () => {
        setShowConversations(true);
    };

    // If there's an error or still loading
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-lg">Loading conversations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl mb-4" />
                    <h2 className="text-xl font-semibold mb-2 dark:text-white">Unable to Load Chats</h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => navigate("/login")} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            Log In
                        </button>
                        <button onClick={() => navigate("/")} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">
                            Return Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm py-3 px-4 flex items-center justify-between">
                <div className="flex items-center">
                    <FontAwesomeIcon icon={faComments} className="text-green-600 text-xl mr-2" />
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Messages</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500 transition-colors"
                        onClick={toggleUserSearch}
                        title="New Message"
                    >
                        <FontAwesomeIcon icon={faUsers} className="text-lg" />
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Conversations sidebar - conditionally shown on mobile */}
                {(showConversations || !isMobile) && (
                    <div className={`${isMobile ? 'w-full' : 'w-80'} border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800`}>
                        {/* User search overlay */}
                        {showUserSearch && (
                            <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 flex flex-col">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                                    <button 
                                        onClick={toggleUserSearch}
                                        className="p-2 mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            {isSearching ? (
                                                <FontAwesomeIcon icon={faSpinner} className="text-gray-400 animate-spin" />
                                            ) : (
                                                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                                            )}
                                        </div>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search users..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                        />
                                    </div>
                                </div>
                                
                                {/* Search results */}
                                <div className="overflow-y-auto flex-1 p-2">
                                    {searchQuery.trim() === "" ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <FontAwesomeIcon icon={faSearch} className="text-3xl mb-2" />
                                            <p>Search for users to start a conversation</p>
                                        </div>
                                    ) : searchedUsers.length === 0 && !isSearching ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <FontAwesomeIcon icon={faUser} className="text-3xl mb-2" />
                                            <p>No users found matching "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {searchedUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    onClick={() => startConversation(user)}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-semibold mr-3">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{user.username}</p>
                                                        {user.email && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Conversation list */}
                        <ChatList 
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={selectedConversation}
                        />
                    </div>
                )}

                {/* Chat content area */}
                <div className={`${isMobile && showConversations ? 'hidden' : 'flex flex-1'} flex-col h-full`}>
                    {selectedConversation ? (
                        <>
                            {isMobile && (
                                <div className="bg-white dark:bg-gray-800 p-2 shadow-sm flex items-center border-b border-gray-200 dark:border-gray-700">
                                    <button 
                                        onClick={backToConversations}
                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <span className="ml-2 text-gray-800 dark:text-white font-medium">Back to conversations</span>
                                </div>
                            )}
                            <ChatWindow conversationId={selectedConversation} key={selectedConversation} />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm text-center max-w-md">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FontAwesomeIcon icon={faComments} className="text-green-600 dark:text-green-400 text-3xl" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Your Messages</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">Select a conversation or start a new one to begin messaging</p>
                                <button 
                                    onClick={toggleUserSearch}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Start a new conversation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
