import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import ChatWindow from "../components/Chat/ChatWindow";
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
    const [isStartingConversation, setIsStartingConversation] = useState(false); // Prevent multiple calls
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

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

    // Debounced search function
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
                
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/search?query=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSearchedUsers(response.data);
                // Update cache with search results
                localStorage.setItem("cachedUsers", JSON.stringify(response.data));
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
            setConversations(response.data);
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

    const startConversation = async (user) => {
        if (isStartingConversation) return; // Prevent multiple calls
        setIsStartingConversation(true);

        try {
            const token = TokenService.getAccessToken();
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

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const existingConversation = response.data.find((conv) => conv.type === "direct" && conv.participants.includes(currentUser.id) && conv.participants.includes(user.id));

            if (existingConversation) {
                setSelectedConversation(existingConversation.id);
            } else {
                const newConversation = await axios.post(
                    `${import.meta.env.VITE_API_URL}/chats`,
                    {
                        type: "direct",
                        participant_ids: [user.id],
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (newConversation.data) {
                    setSelectedConversation(newConversation.data.id);
                    // Do NOT call fetchConversations here; manually update conversations state instead
                    setConversations((prev) => [...prev, newConversation.data]);
                }
            }
        } catch (error) {
            console.error("Error starting conversation", error);
            
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

    // If there's an error or still loading
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-green-600 text-4xl mb-4" />
                    <p className="text-gray-700">Loading chats...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Unable to Load Chats</h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <div className="flex justify-center space-x-4">
                        <button 
                            onClick={() => navigate("/login")} 
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Log In
                        </button>
                        <button 
                            onClick={() => navigate("/")} 
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Sidebar */}
            <div className="w-1/4 p-4 bg-white border-r flex flex-col">
                {/* 🔍 Search Input & Button */}
                <div className="flex space-x-2 mb-3">
                    <input type="text" placeholder="Search users..." className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" value={searchQuery} onChange={handleSearchChange} />
                    <button onClick={debouncedSearchUsers} className="px-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition" disabled={isSearching}>
                        {isSearching ? <FontAwesomeIcon icon={faSpinner} spin className="text-white" /> : "Search"}
                    </button>
                </div>

                {/* Scrollable Users List */}
                <div className="overflow-y-auto h-[80vh] space-y-1">
                    {/* 🔹 Display Searched Users */}
                    {searchedUsers.length > 0 && (
                        <div className="border-b border-gray-300 pb-2 mb-2">
                            <p className="text-sm font-semibold text-gray-600">Search Results:</p>
                            {searchedUsers.map((user) => (
                                <div key={user.id} className="flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-md" onClick={() => startConversation(user)}>
                                    <div className="w-6 h-6 bg-blue-300 rounded-full flex items-center justify-center text-xs font-semibold">{user.username[0].toUpperCase()}</div>
                                    <div className="ml-2">
                                        <p className="text-sm font-medium">{user.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🔹 Display All Users */}
                    <p className="text-sm font-semibold text-gray-600">All Users:</p>
                    {loadingUsers ? (
                        <div className="flex justify-center py-2">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-green-600" />
                        </div>
                    ) : users.length > 0 ? (
                        users.map((user) => (
                            <div key={user.id} className="flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-md" onClick={() => startConversation(user)}>
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">{user.username[0].toUpperCase()}</div>
                                <div className="ml-2">
                                    <p className="text-sm font-medium">{user.username}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 mt-2">No users found</p>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 p-4">
                {selectedConversation ? (
                    <ChatWindow 
                        conversationId={selectedConversation} 
                        conversations={conversations}
                        key={selectedConversation} 
                    />
                ) : (
                    <div className="flex flex-col justify-center items-center h-full">
                        <p className="text-gray-500">Select a user to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
