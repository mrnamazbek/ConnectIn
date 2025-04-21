import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/chats`;

// Conversation endpoints
export const chatApi = {
    // Get all conversations for the current user
    getConversations: async (params = {}) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${API_URL}/`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching conversations:", error);
            throw error;
        }
    },

    // Get a specific conversation
    getConversation: async (conversationId) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${API_URL}/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching conversation:", error);
            throw error;
        }
    },

    // Create a new direct conversation
    createConversation: async (participantId) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${API_URL}/`,
                {
                    type: "direct",
                    participant_ids: [participantId],
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error("Error creating conversation:", error);
            throw error;
        }
    },

    // Get messages for a conversation
    getMessages: async (conversationId, page = 1, limit = 50) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(
                `${API_URL}/${conversationId}/messages`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page, limit },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    },

    // Send a message
    sendMessage: async (conversationId, content) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${API_URL}/${conversationId}/messages`,
                { content, conversation_id: conversationId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    // Mark messages as read
    markAsRead: async (conversationId, messageIds = []) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${API_URL}/${conversationId}/read`,
                { 
                    conversation_id: conversationId,
                    message_ids: messageIds,
                    read_at: new Date().toISOString()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error("Error marking messages as read:", error);
            throw error;
        }
    },

    // Delete a message (if implemented in the backend)
    deleteMessage: async (conversationId, messageId) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.delete(
                `${API_URL}/${conversationId}/messages/${messageId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error("Error deleting message:", error);
            throw error;
        }
    }
}; 