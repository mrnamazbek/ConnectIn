import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import ChatWindow from "../components/Chat/ChatWindow";

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
            // Try to load cached users first
            const cachedUsers = localStorage.getItem("cachedUsers");
            if (cachedUsers) {
                setUsers(JSON.parse(cachedUsers));
            } else {
                await fetchUsers();
            }
            await fetchCurrentUser();
            fetchConversations();
        };
        fetchData();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const newUsers = response.data;
            setUsers(newUsers);
            // Update cache with fresh data
            localStorage.setItem("cachedUsers", JSON.stringify(newUsers));
        } catch (error) {
            console.error("Failed to fetch users", error);
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
                const token = localStorage.getItem("access_token");
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/search?query=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSearchedUsers(response.data);
                // Update cache with search results
                localStorage.setItem("cachedUsers", JSON.stringify(response.data));
            } catch (error) {
                console.error("Error searching users", error);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        [searchQuery]
    );

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Failed to fetch current user", error);

            if (error.response && error.response.status === 401) {
                localStorage.removeItem("access_token");
                navigate("/login");
            }
        }
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConversations(response.data);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const startConversation = async (user) => {
        if (isStartingConversation) return; // Prevent multiple calls
        setIsStartingConversation(true);

        try {
            const token = localStorage.getItem("access_token");

            if (!currentUser) {
                console.warn("Current user not loaded yet, trying again...");
                await fetchCurrentUser();
            }

            if (!currentUser) {
                console.error("Failed to fetch current user. Aborting conversation start.");
                return;
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
        } finally {
            setIsStartingConversation(false);
        }
    };

    // Handle search input change with debouncing
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        debouncedSearchUsers();
    };

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
                    <ChatWindow conversationId={selectedConversation} key={selectedConversation} />
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
