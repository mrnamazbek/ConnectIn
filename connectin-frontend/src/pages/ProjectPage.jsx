import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";
import { toast } from "react-toastify";
import { formatDate, formatFullDate } from "../utils/dateFormat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faSpinner } from "@fortawesome/free-solid-svg-icons";

const ProjectPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState(null);

    const fetchProject = useCallback(async () => {
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
    }, [projectId]);

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (err) {
            console.error("Error fetching current user:", err);
        }
    };

    const fetchComments = useCallback(async () => {
        setCommentLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`);
            setComments(response.data);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
            setCommentError("Failed to load comments.");
            toast.error("Failed to load comments. Please try again.");
        } finally {
            setCommentLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
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
        }
    };

    const handleDownvote = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to vote");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
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
            <ProjectCard project={project} currentUser={currentUser} handleApply={handleApply} handleUpvote={handleUpvote} handleDownvote={handleDownvote} showViewProject={false} showCommentsLink={true} />

            {/* Comment Writing Form */}
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
                        disabled={commentLoading}
                    />
                    {commentError && <p className="text-red-500 text-sm">{commentError}</p>}
                    <button type="submit" disabled={commentLoading || !newComment.trim()} className="rounded-md shadow-sm text-sm px-4 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
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

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
                </div>
                {commentLoading ? (
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
                                        className="w-8 h-8 rounded-full border hover:ring-2 hover:ring-green-500 transition"
                                        onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png")}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm">{comment.user?.username || "Unknown User"}</p>
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
        </div>
    );
};

export default ProjectPage;
