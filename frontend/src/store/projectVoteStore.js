import { create } from "zustand";
import axios from "axios";
import TokenService from "../services/tokenService";
import { toast } from "react-toastify";

const useProjectVoteStore = create((set, get) => ({
    // State for tracking voted projects
    votedProjects: {},
    voteCounts: {},

    // Initialize state from cache or API
    initializeVoteState: async (projectIds) => {
        const token = TokenService.getAccessToken();
        if (!token) return;

        try {
            const responses = await Promise.all(projectIds.map((id) => axios.get(`${import.meta.env.VITE_API_URL}/projects/${id}/vote_status`, { headers: { Authorization: `Bearer ${token}` } })));

            const newVotedProjects = { ...get().votedProjects };
            const newVoteCounts = { ...get().voteCounts };

            projectIds.forEach((id, index) => {
                const status = responses[index].data;
                newVotedProjects[id] = status.has_voted ? status.is_upvote : null;
                newVoteCounts[id] = status.vote_count;
            });

            set({
                votedProjects: newVotedProjects,
                voteCounts: newVoteCounts,
            });
        } catch (error) {
            console.error("Error initializing vote state:", error);
        }
    },

    // Vote for a project
    voteProject: async (projectId, isUpvote) => {
        const token = TokenService.getAccessToken();
        if (!token) {
            toast.error("Please log in to vote");
            return false;
        }

        // Get current state
        const state = get();
        const currentVote = state.votedProjects[projectId];
        const currentCount = state.voteCounts[projectId] || 0;

        // Calculate the new vote count based on current state
        let newCount = currentCount;
        if (currentVote === null) {
            // No previous vote
            newCount = isUpvote ? currentCount + 1 : currentCount - 1;
        } else if (currentVote === isUpvote) {
            // Removing vote
            newCount = isUpvote ? currentCount - 1 : currentCount + 1;
        } else {
            // Changing vote direction
            newCount = isUpvote ? currentCount + 2 : currentCount - 2;
        }

        // Optimistically update the UI
        set((state) => ({
            votedProjects: {
                ...state.votedProjects,
                [projectId]: currentVote === isUpvote ? null : isUpvote,
            },
            voteCounts: {
                ...state.voteCounts,
                [projectId]: newCount,
            },
        }));

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects/${projectId}/vote`, { is_upvote: isUpvote }, { headers: { Authorization: `Bearer ${token}` } });

            // Update with actual count from server
            set((state) => ({
                voteCounts: {
                    ...state.voteCounts,
                    [projectId]: response.data.vote_count,
                },
            }));

            return response.data;
        } catch (error) {
            // Revert optimistic update on error
            set((state) => ({
                votedProjects: {
                    ...state.votedProjects,
                    [projectId]: currentVote,
                },
                voteCounts: {
                    ...state.voteCounts,
                    [projectId]: currentCount,
                },
            }));
            console.error("Error voting for project:", error);
            toast.error("Failed to vote");
            return false;
        }
    },

    // Get vote status for a project
    getVoteStatus: (projectId) => {
        const state = get();
        return {
            hasVoted: state.votedProjects[projectId] !== null,
            isUpvote: state.votedProjects[projectId],
            voteCount: state.voteCounts[projectId] || 0,
        };
    },
}));

export default useProjectVoteStore;
