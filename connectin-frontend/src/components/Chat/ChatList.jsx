import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const ChatList = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();

    const fetchConversations = async (pageNum = 1, search = "") => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pageNum,
                    per_page: 20,
                    search: search,
                },
            });

            if (pageNum === 1) {
                setConversations(response.data);
            } else {
                setConversations((prev) => [...prev, ...response.data]);
            }
            setHasMore(response.data.length === 20);
        } catch (error) {
            toast.error("Failed to load conversations");
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setConversations([]);
        fetchConversations(1, searchQuery);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchConversations(nextPage, searchQuery);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) {
            // Less than 24 hours
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (diff < 604800000) {
            // Less than 7 days
            return date.toLocaleDateString([], { weekday: "short" });
        } else {
            return date.toLocaleDateString();
        }
    };

    if (loading && conversations.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <form onSubmit={handleSearch} className="p-4 border-b">
                <div className="relative">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                </div>
            </form>

            <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                    <div key={conversation.id} onClick={() => navigate(`/chat/${conversation.id}`)} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-medium">{conversation.participants.map((p) => p.username).join(", ")}</h3>
                                {conversation.last_message && <p className="text-sm text-gray-600 truncate">{conversation.last_message.content}</p>}
                            </div>
                            <div className="flex flex-col items-end">
                                {conversation.last_message && <span className="text-xs text-gray-500">{formatTimestamp(conversation.last_message.timestamp)}</span>}
                                {conversation.unread_count > 0 && <span className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">{conversation.unread_count}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button onClick={handleLoadMore} className="p-4 text-center text-blue-500 hover:bg-gray-50">
                    Load More
                </button>
            )}
        </div>
    );
};

export default ChatList;
