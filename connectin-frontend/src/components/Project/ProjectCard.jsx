import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown, faComment, faUser } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

const ProjectCard = ({ project, currentUser, handleApply, handleUpvote, handleDownvote, showViewProject = true, showCommentsLink = false }) => {
    const [voteStatus, setVoteStatus] = useState({ has_voted: false, is_upvote: null });
    const [isVoteLoading, setIsVoteLoading] = useState(false);
    const [isApplyLoading, setIsApplyLoading] = useState(false);
    const navigate = useNavigate();

    const fetchVoteStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${project.id}/vote_status`, { headers: { Authorization: `Bearer ${token}` } });
            setVoteStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch vote status:", error);
        }
    }, [project.id]);

    useEffect(() => {
        if (currentUser) {
            fetchVoteStatus();
        }
    }, [currentUser, project.id, project.vote_count, fetchVoteStatus]);

    const handleVote = async (isUpvote) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to vote");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setIsVoteLoading(true);
        try {
            if (isUpvote) {
                await handleUpvote(project.id);
            } else {
                await handleDownvote(project.id);
            }
            await fetchVoteStatus();
        } catch (error) {
            console.error("Failed to vote:", error);
            toast.error("Failed to vote. Please try again.");
        } finally {
            setIsVoteLoading(false);
        }
    };

    const handleApplyClick = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to apply");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setIsApplyLoading(true);
        try {
            await handleApply(project.id);
            toast.success("Application submitted successfully!");
        } catch (error) {
            console.error("Failed to apply:", error);
            toast.error("Failed to apply. You may have already applied.");
        } finally {
            setIsApplyLoading(false);
        }
    };

    const owner = project.owner || {
        avatar_url: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        username: "Unknown",
        id: null,
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-md border border-green-700 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-2 mb-4">
                <div className="relative w-10 h-10 flex items-center justify-center rounded-full border-2 border-green-700 dark:border-green-500 bg-gray-100 dark:bg-gray-700">
                    {owner.avatar_url ? (
                        <img
                            src={owner.avatar_url}
                            alt={owner.username}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                                e.target.src = "";
                                e.target.onerror = null;
                            }}
                        />
                    ) : (
                        <FontAwesomeIcon icon={faUser} className="text-gray-500 dark:text-gray-400" />
                    )}
                </div>
                <div>
                    <p className="font-semibold">{owner.username}</p>
                </div>
            </div>

            {project.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {project.tags.map((tag) => (
                        <span key={tag.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                            {tag.name}
                        </span>
                    ))}
                </div>
            )}

            <h3 className="text-lg font-bold mb-2">{project.name || "Untitled Project"}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: project.description || "No description available." }} />

            <div className="mt-3 flex flex-wrap gap-2 mb-4">
                {project.skills?.length > 0 ? (
                    project.skills.map((skill) => (
                        <span key={skill.id} className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md">
                            {skill.name}
                        </span>
                    ))
                ) : (
                    <span className="text-gray-500 text-xs">No skills</span>
                )}
            </div>

            <div className="flex justify-between items-center mt-3">
                <div className="space-x-3">
                    <button
                        onClick={() => handleVote(true)}
                        disabled={isVoteLoading}
                        className={`group relative transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${voteStatus.has_voted && voteStatus.is_upvote ? "text-green-700" : "text-gray-500 hover:text-green-700"}`}
                        title={isVoteLoading ? "Processing..." : "Upvote"}
                    >
                        <FontAwesomeIcon icon={faArrowUp} className={`${isVoteLoading ? "animate-pulse" : ""}`} />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{voteStatus.has_voted && voteStatus.is_upvote ? "Remove upvote" : "Upvote"}</span>
                    </button>
                    <span className="text-gray-700 dark:text-gray-300 font-bold">{project.vote_count || 0}</span>
                    <button
                        onClick={() => handleVote(false)}
                        disabled={isVoteLoading}
                        className={`group relative transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${voteStatus.has_voted && !voteStatus.is_upvote ? "text-red-700" : "text-gray-500 hover:text-red-700"}`}
                        title={isVoteLoading ? "Processing..." : "Downvote"}
                    >
                        <FontAwesomeIcon icon={faArrowDown} className={`${isVoteLoading ? "animate-pulse" : ""}`} />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {voteStatus.has_voted && !voteStatus.is_upvote ? "Remove downvote" : "Downvote"}
                        </span>
                    </button>
                    {showCommentsLink && (
                        <NavLink to={`/project/${project.id}`} className="group relative text-gray-500 hover:text-blue-700 transition cursor-pointer" title="View comments">
                            <FontAwesomeIcon icon={faComment} />
                            <span className="ml-1">{project.comments_count || ""}</span>
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Comments</span>
                        </NavLink>
                    )}
                </div>

                <div className="space-x-3">
                    {currentUser && currentUser.id !== owner.id && (
                        <button
                            onClick={handleApplyClick}
                            disabled={isApplyLoading}
                            className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isApplyLoading ? "Processing..." : "Apply to project"}
                        >
                            {isApplyLoading ? "Applying..." : "Apply"}
                        </button>
                    )}
                    {showViewProject && (
                        <NavLink to={`/project/${project.id}`} className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition" title="View project details">
                            View Project
                        </NavLink>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
