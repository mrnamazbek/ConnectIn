import React, { useState } from "react";
import { sendMessage } from "../../api/chatApi";

const ChatInput = ({ conversationId, socket }) => {
    const [message, setMessage] = useState("");

    const handleSend = async () => {
        if (message.trim()) {
            await sendMessage(conversationId, message);
            if (socket) socket.send(message); // ✅ Send real-time message
            setMessage("");
        }
    };

    return (
        <div className="chat-input p-3 border-t flex">
            <input
                type="text"
                className="flex-1 p-2 border rounded-md"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <button
                className="ml-2 px-4 py-2 bg-green-700 text-white rounded-md"
                onClick={handleSend}
            >
                Send
            </button>
        </div>
    );
};

export default ChatInput;
