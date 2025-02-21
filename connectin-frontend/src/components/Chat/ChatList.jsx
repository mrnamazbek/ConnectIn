import React, { useState, useEffect } from "react";
import { fetchConversations } from "../../api/chatApi";

const ChatList = ({ onSelectConversation }) => {
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        const data = await fetchConversations();
        setConversations(data);
    };

    return (
        <div className="chat-list">
            <h2 className="text-lg font-semibold p-3">Chats</h2>
            {conversations.length === 0 ? (
                <p className="text-gray-500 p-3">No conversations</p>
            ) : (
                conversations.map((chat) => (
                    <div
                        key={chat.id}
                        className="chat-item p-3 border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => onSelectConversation(chat.id)}
                    >
                        <p className="font-semibold">{chat.name}</p>
                        <p className="text-sm text-gray-500">
                            Last message: {chat.last_message || "No messages"}
                        </p>
                    </div>
                ))
            )}
        </div>
    );
};

export default ChatList;
