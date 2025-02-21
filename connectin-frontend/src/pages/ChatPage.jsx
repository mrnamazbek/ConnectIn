import { useState, useEffect } from "react";
import axios from "axios";
import ChatWindow from "../components/Chat/ChatWindow";

const ChatPage = () => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            await fetchCurrentUser(); 
            fetchUsers();
            fetchConversations();
        };
    
        fetchData();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://127.0.0.1:8000/users/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://127.0.0.1:8000/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data); // ✅ Store the logged-in user in state
        } catch (error) {
            console.error("Failed to fetch current user", error);
        }
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://127.0.0.1:8000/chats/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConversations(response.data);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const startConversation = async (user) => {
        try {
            const token = localStorage.getItem("token");
    
            // ✅ Ensure `currentUser` is loaded before proceeding
            if (!currentUser) {
                console.warn("Current user not loaded yet, trying again...");
                await fetchCurrentUser(); // Wait for currentUser to be fetched
            }
    
            if (!currentUser) {
                console.error("Failed to fetch current user. Aborting conversation start.");
                return;
            }
    
            // ✅ Check if an existing conversation exists
            const response = await axios.get("http://127.0.0.1:8000/chats/", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            const existingConversation = response.data.find((conv) => {
                return (
                    conv.type === "direct" &&
                    conv.participants.includes(currentUser.id) &&
                    conv.participants.includes(user.id)
                );
            });
    
            if (existingConversation) {
                setSelectedConversation(existingConversation.id);
                return;
            }
    
            // ✅ If no existing conversation, create a new one
            const newConversation = await axios.post(
                "http://127.0.0.1:8000/chats/",
                {
                    type: "direct",
                    participant_ids: [user.id],
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (newConversation.data) {
                setSelectedConversation(newConversation.data.id);
                fetchConversations(); // Refresh the conversation list
            }
        } catch (error) {
            console.error("Error starting conversation", error);
        }
    };
    
    // Group conversations by user
    const getConversationsForUser = (userId) => {
        return conversations.filter((conv) => conv.participants.includes(userId));
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Sidebar */}
            <div className="w-1/4 p-4 bg-white border-r">
                <h2 className="text-lg font-semibold mb-4">Users</h2>
                {users.map((user) => (
                    <div key={user.id} className="mb-4">
                        <div className="flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-md" onClick={() => startConversation(user)}>
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">{user.username[0].toUpperCase()}</div>
                            <div className="ml-3">
                                <p className="font-semibold">{user.username}</p>
                            </div>
                        </div>

                        {/* Display conversations for this user
                        {getConversationsForUser(user.id).map((conv) => (
                            <div key={conv.id} className="ml-8 p-2 cursor-pointer hover:bg-gray-50 rounded-md" onClick={() => setSelectedConversation(conv.id)}>
                                <p className="text-sm text-gray-600">Conversation #{conv.id}</p>
                            </div>
                        ))} */}
                    </div>
                ))}
            </div>

            {/* Chat Window */}
            <div className="flex-1 p-4">
                {selectedConversation ? (
                    <ChatWindow conversationId={selectedConversation} />
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
