import { create } from "zustand";
import axios from "axios";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";

const usePostStore = create((set, get) => ({
    // State for tracking liked and saved posts
    likedPosts: {},
    savedPosts: {},
    postCounts: {},

    // Initialize state from cache or API
    initializePostState: async (postIds) => {
        const token = TokenService.getAccessToken();
        if (!token) return;

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts/batch_status`, { post_ids: postIds }, { headers: { Authorization: `Bearer ${token}` } });

            const newLikedPosts = {};
            const newSavedPosts = {};
            const newPostCounts = {};

            postIds.forEach((id) => {
                const status = response.data[id] || {
                    is_liked: false,
                    is_saved: false,
                    likes_count: 0,
                    saves_count: 0,
                };
                newLikedPosts[id] = status.is_liked;
                newSavedPosts[id] = status.is_saved;
                newPostCounts[id] = {
                    likes: status.likes_count,
                    saves: status.saves_count,
                };
            });

            set({
                likedPosts: newLikedPosts,
                savedPosts: newSavedPosts,
                postCounts: newPostCounts,
            });
        } catch (error) {
            console.error("Error initializing post state:", error);
        }
    },

    // Like a post
    likePost: async (postId) => {
        const token = TokenService.getAccessToken();
        if (!token) {
            toast.error("Please log in to like posts");
            return false;
        }

        // Get current state
        const state = get();
        const currentIsLiked = state.likedPosts[postId] || false;
        const currentLikesCount = state.postCounts[postId]?.likes || 0;

        // Optimistically update the UI
        set((state) => ({
            likedPosts: {
                ...state.likedPosts,
                [postId]: !currentIsLiked,
            },
            postCounts: {
                ...state.postCounts,
                [postId]: {
                    ...state.postCounts[postId],
                    likes: currentIsLiked ? currentLikesCount - 1 : currentLikesCount + 1,
                },
            },
        }));

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });

            // Only update if the response is different from our optimistic update
            if (response.data.is_liked !== !currentIsLiked) {
                set((state) => ({
                    likedPosts: {
                        ...state.likedPosts,
                        [postId]: response.data.is_liked,
                    },
                    postCounts: {
                        ...state.postCounts,
                        [postId]: {
                            ...state.postCounts[postId],
                            likes: response.data.likes_count,
                        },
                    },
                }));
            }

            return response.data;
        } catch (error) {
            // Revert optimistic update on error
            set((state) => ({
                likedPosts: {
                    ...state.likedPosts,
                    [postId]: currentIsLiked,
                },
                postCounts: {
                    ...state.postCounts,
                    [postId]: {
                        ...state.postCounts[postId],
                        likes: currentLikesCount,
                    },
                },
            }));
            console.error("Error liking post:", error);
            toast.error("Failed to like post");
            return false;
        }
    },

    // Save a post
    savePost: async (postId) => {
        const token = TokenService.getAccessToken();
        if (!token) {
            toast.error("Please log in to save posts");
            return false;
        }

        // Get current state
        const state = get();
        const currentIsSaved = state.savedPosts[postId] || false;
        const currentSavesCount = state.postCounts[postId]?.saves || 0;

        // Optimistically update the UI
        set((state) => ({
            savedPosts: {
                ...state.savedPosts,
                [postId]: !currentIsSaved,
            },
            postCounts: {
                ...state.postCounts,
                [postId]: {
                    ...state.postCounts[postId],
                    saves: currentIsSaved ? currentSavesCount - 1 : currentSavesCount + 1,
                },
            },
        }));

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });

            // Only update if the response is different from our optimistic update
            if (response.data.is_saved !== !currentIsSaved) {
                set((state) => ({
                    savedPosts: {
                        ...state.savedPosts,
                        [postId]: response.data.is_saved,
                    },
                    postCounts: {
                        ...state.postCounts,
                        [postId]: {
                            ...state.postCounts[postId],
                            saves: response.data.saves_count,
                        },
                    },
                }));
            }

            return response.data;
        } catch (error) {
            // Revert optimistic update on error
            set((state) => ({
                savedPosts: {
                    ...state.savedPosts,
                    [postId]: currentIsSaved,
                },
                postCounts: {
                    ...state.postCounts,
                    [postId]: {
                        ...state.postCounts[postId],
                        saves: currentSavesCount,
                    },
                },
            }));
            console.error("Error saving post:", error);
            toast.error("Failed to save post");
            return false;
        }
    },

    // Get post status
    getPostStatus: (postId) => {
        const state = get();
        return {
            isLiked: state.likedPosts[postId] || false,
            isSaved: state.savedPosts[postId] || false,
            likesCount: state.postCounts[postId]?.likes || 0,
            savesCount: state.postCounts[postId]?.saves || 0,
        };
    },
}));

export default usePostStore;
