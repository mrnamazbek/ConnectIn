import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";
import { toast } from "react-toastify";
import { formatDate, formatFullDate } from "../utils/dateFormat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faSpinner, faArrowLeft, faLink } from "@fortawesome/free-solid-svg-icons";

const ProjectPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [project, setProject] = useState(location.state?.project || null);
    const [currentUser, setCurrentUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [commentsListLoading, setCommentsListLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [voteLoading, setVoteLoading] = useState(false);
    const [isCopyLoading, setIsCopyLoading] = useState(false);

    const handleGoBack = () => {
        // Check if there's navigation history
        if (window.history.length > 1) {
            // Navigate back to preserve the scroll position and state
            navigate(-1);
        } else {
            // Fallback to projects page
            navigate("/projects");
        }
    };

    const fetchProject = useCallback(async () => {
        // If project is already available from location state, don't fetch again
        if (project) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${projectId}`);
            setProject({
                ...response.data,
                vote_count: response.data.vote_count || 0,
                comments_count: response.data.comments_count || 0,
            });
        } catch (err) {
            console.error("Error fetching project:", err);
            setError("Failed to load project.");
            toast.error("Failed to load project. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [projectId, project]);

    const fetchCurrentUser = async () => {
        setUserLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setUserLoading(false);
                return null; // Continue without user data
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (err) {
            console.error("Error fetching current user:", err);
            // Continue without user data on error
        } finally {
            setUserLoading(false);
        }
    };

    const fetchComments = useCallback(async () => {
        setCommentsListLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`);
            setComments(response.data);
            console.log(response.data);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
            setCommentError("Failed to load comments.");
            toast.error("Failed to load comments. Please try again.");
        } finally {
            setCommentsListLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        // Reset all loading states when projectId changes
        setLoading(true);
        setCommentsListLoading(true);
        setUserLoading(true);

        fetchProject();
        fetchCurrentUser();
        fetchComments();
    }, [projectId, fetchProject, fetchComments]);

    const handleApply = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to apply for a project");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/projects/${projectId}/apply`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Application submitted successfully!");
        } catch (err) {
            console.error("Failed to apply:", err);
            toast.error("Failed to apply. You may have already applied.");
        }
    };

    const handleUpvote = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to vote");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setVoteLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects/${projectId}/vote`, { is_upvote: true }, { headers: { Authorization: `Bearer ${token}` } });
            setProject((prev) => ({
                ...prev,
                vote_count: response.data.detail === "Vote removed" ? prev.vote_count - 1 : prev.vote_count + 1,
            }));
            toast.success(response.data.detail);
        } catch (err) {
            console.error("Failed to upvote:", err);
            toast.error("Failed to upvote. Please try again.");
        } finally {
            setVoteLoading(false);
        }
    };

    const handleDownvote = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to vote");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setVoteLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects/${projectId}/vote`, { is_upvote: false }, { headers: { Authorization: `Bearer ${token}` } });
            setProject((prev) => ({
                ...prev,
                vote_count: response.data.detail === "Vote removed" ? prev.vote_count + 1 : prev.vote_count - 1,
            }));
            toast.success(response.data.detail);
        } catch (err) {
            console.error("Failed to downvote:", err);
            toast.error("Failed to downvote. Please try again.");
        } finally {
            setVoteLoading(false);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) {
            toast.error("Comment cannot be empty");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to comment");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setCommentLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comment`, { content: newComment }, { headers: { Authorization: `Bearer ${token}` } });

            setNewComment("");
            setComments((prev) => [...prev, response.data]);
            setProject((prev) => ({ ...prev, comments_count: prev.comments_count + 1 }));
            setCommentError(null);
            toast.success("Comment added successfully");
        } catch (err) {
            console.error("Failed to submit comment:", err);
            setCommentError(err.response?.data?.detail || "Failed to submit comment. Please try again.");
            toast.error("Failed to submit comment. Please try again.");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleCopyLink = async () => {
        setIsCopyLoading(true);
        try {
            const url = `${window.location.origin}/projects/${projectId}`;
            await navigator.clipboard.writeText(url);
            toast.success("Project link copied to clipboard!");
        } catch (error) {
            toast.error("Failed to copy link");
            console.error("Copy failed:", error);
        } finally {
            setIsCopyLoading(false);
        }
    };

    // Add function to handle author profile navigation
    const handleAuthorClick = (user) => {
        if (!user) {
            console.error("Cannot navigate to profile: Author data is missing");
            toast.error("Cannot view profile: User data is missing");
            return;
        }

        // Debug: Log the user object to see its structure
        console.log("Comment user object:", user);

        // Check for different possible ID field formats
        const userId = user.id || user._id || user.user_id;

        if (!userId) {
            console.error("Cannot navigate to profile: Author ID is missing", user);
            toast.error("Cannot view profile: User ID is missing");
            return;
        }

        navigate(`/profile/${userId}`);
    };

    // Render auth-required UI elements based on login status
    const renderAuthRequiredUI = () => {
        if (!currentUser) {
            return (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Sign in to comment, vote, or apply to this project</p>
                    <button onClick={() => navigate("/login", { state: { from: window.location.pathname } })} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition">
                        Sign In
                    </button>
                </div>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-sm text-green-700 hover:text-green-800 underline">
                    Try again
                </button>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-gray-500">Project not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handleGoBack} className="flex items-center text-gray-600 hover:text-green-700 transition-colors">
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    <span>Back</span>
                </button>

                <button onClick={handleCopyLink} disabled={isCopyLoading} className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors disabled:opacity-50" title={isCopyLoading ? "Copying..." : "Copy project link"}>
                    <FontAwesomeIcon icon={faLink} className={`${isCopyLoading ? "animate-pulse" : ""}`} />
                    <span>Share</span>
                </button>
            </div>

            <div className={`transition-opacity duration-300 ${userLoading || voteLoading ? "opacity-70" : "opacity-100"}`}>
                <ProjectCard project={project} currentUser={currentUser} handleApply={handleApply} handleUpvote={handleUpvote} handleDownvote={handleDownvote} showViewProject={false} showCommentsLink={true} isLoading={userLoading || voteLoading} />
                {(userLoading || voteLoading) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                    </div>
                )}
            </div>

            {/* Comment Writing Form */}
            {currentUser ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                    <h3 className="font-semibold text-lg mb-4">Write a Comment</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCommentSubmit();
                        }}
                        className="space-y-3"
                    >
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add your comment..."
                            className="w-full bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                            rows="3"
                            disabled={commentLoading || loading}
                        />
                        {commentError && <p className="text-red-500 text-sm">{commentError}</p>}
                        <button
                            type="submit"
                            disabled={commentLoading || !newComment.trim() || loading}
                            className="rounded-md shadow-sm text-sm px-4 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {commentLoading ? (
                                <span className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    Submitting...
                                </span>
                            ) : (
                                "Submit"
                            )}
                        </button>
                    </form>
                </div>
            ) : null}

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
                </div>
                {commentsListLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                    </div>
                ) : commentError ? (
                    <div className="p-4 text-center text-red-500">
                        <p>{commentError}</p>
                    </div>
                ) : comments.length > 0 ? (
                    <div className="bg-gray-200 dark:bg-gray-800">
                        {comments.map((comment) => (
                            <div key={comment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-start gap-3">
                                    <img
                                        src={comment.user?.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt={comment.user?.username || "User"}
                                        className="w-8 h-8 rounded-full border hover:ring-2 hover:ring-green-500 transition cursor-pointer"
                                        onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png")}
                                        onClick={() => handleAuthorClick({ ...comment.user, id: comment.user_id })}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm cursor-pointer hover:text-green-700 transition-colors" onClick={() => handleAuthorClick({ ...comment.user, id: comment.user_id })}>
                                                    {comment.user?.username || "Unknown User"}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                                    {formatDate(comment.created_at)}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-400" title={formatFullDate(comment.created_at)}>
                                                {formatFullDate(comment.created_at)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                )}
            </div>

            {renderAuthRequiredUI()}
        </div>
    );
};

export default ProjectPage;
