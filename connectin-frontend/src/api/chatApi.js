import axios from "axios";

const API_URL = "http://127.0.0.1:8000/chats";

// 🔹 Fetch conversations
export const fetchConversations = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
};

export const fetchMessages = async (conversationId) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/${conversationId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.messages;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
};

export const sendMessage = async (conversationId, content) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(`${API_URL}/message`, { conversation_id: conversationId, content }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("Message sent successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending message:", error.response?.data || error.message);
        throw error;
    }
};
