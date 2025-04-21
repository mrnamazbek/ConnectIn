import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import axios from "axios";
import { LoadingMessage, ErrorMessage, NoDataMessage } from "../components/Post/PostCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faBookmark as faBookmarkSolid, faClock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { faHeart, faComment, faBookmark } from "@fortawesome/free-regular-svg-icons";
import { toast } from "react-toastify";
import { formatDate, formatFullDate } from "../utils/dateFormat";

export default function PostPage() {
    const { postId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [post, setPost] = useState(location.state?.post || null);
    const [comments, setComments] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentContent, setCommentContent] = useState("");
    const [commentError, setCommentError] = useState(null);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [isCommentLoading, setIsCommentLoading] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const fetchPost = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${postId}`);
            setPost(response.data);
        } catch (error) {
            console.error("Error fetching post:", error);
            setError("Failed to load the post. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [postId]);

    const fetchComments = useCallback(async () => {
        setCommentsLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${postId}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error("Error fetching comments:", error);
            toast.error("Failed to load comments");
        } finally {
            setCommentsLoading(false);
        }
    }, [postId]);

    const fetchLikeStatus = useCallback(async () => {
        setStatusLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${postId}/is_liked`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIsLiked(response.data.is_liked);
        } catch (error) {
            console.error("Error fetching like status:", error);
        } finally {
            setStatusLoading(false);
        }
    }, [postId]);

    const fetchSaveStatus = useCallback(async () => {
        setStatusLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${postId}/is_saved`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIsSaved(response.data.is_saved);
        } catch (error) {
            console.error("Error fetching save status:", error);
        } finally {
            setStatusLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        // Reset states on postId change
        setLoading(true);
        setCommentsLoading(true);
        setStatusLoading(true);
        
        fetchPost();
        fetchComments();
        fetchLikeStatus();
        fetchSaveStatus();
    }, [postId, fetchPost, fetchComments, fetchLikeStatus, fetchSaveStatus]);

    const handleLike = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to like posts");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setIsLikeLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setIsLiked(!isLiked);
            setPost((prev) => ({
                ...prev,
                likes_count: prev.likes_count + (isLiked ? -1 : 1),
            }));
            toast.success(isLiked ? "Post unliked" : "Post liked");
        } catch (error) {
            console.error("Error liking post:", error);
            toast.error("Failed to like post");
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to save posts");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setIsSaveLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setIsSaved(!isSaved);
            setPost((prev) => ({
                ...prev,
                saves_count: prev.saves_count + (isSaved ? -1 : 1),
            }));
            toast.success(isSaved ? "Post unsaved" : "Post saved");
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error("Failed to save post");
        } finally {
            setIsSaveLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) {
            setCommentError("Comment cannot be empty.");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            toast.error("Please log in to comment");
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        setIsCommentLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/comment`, { content: commentContent }, { headers: { Authorization: `Bearer ${token}` } });

            setComments((prev) => [...prev, response.data]);
            setPost((prev) => ({
                ...prev,
                comments_count: prev.comments_count + 1,
            }));
            setCommentContent("");
            setCommentError(null);
            toast.success("Comment added successfully");
        } catch (error) {
            console.error("Error submitting comment:", error);
            setCommentError(error.response?.data?.detail || "Failed to submit comment. Please try again.");
            toast.error("Failed to submit comment");
        } finally {
            setIsCommentLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex-grow container mx-auto">
                {loading ? (
                    <LoadingMessage />
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : !post ? (
                    <NoDataMessage message="Post not found." />
                ) : (
                    <div className="flex flex-col space-y-5">
                        <div className="bg-white dark:bg-gray-800 border border-green-700 rounded-md shadow-md p-5">
                            <div className="flex items-center mb-4">
                                <img
                                    src={post.author.avatar_url || "default-avatar.png"}
                                    alt={post.author.username || "User"}
                                    className="w-8 h-8 rounded-full border hover:ring-2 hover:ring-green-500 transition"
                                    onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png")}
                                />
                                <p className="text-sm font-semibold ml-2">{post.author.username || "Unknown"}</p>
                            </div>

                            {post.tags.length > 0 && (
                                <div className="my-3 flex flex-wrap gap-2">
                                    {post.tags.map((tag, index) => (
                                        <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <h2 className="font-semibold mb-2 text-xl">{post.title}</h2>
                            <div className="prose dark:prose-invert max-w-none mb-3" dangerouslySetInnerHTML={{ __html: post.content }} />

                            <div className="flex justify-between items-center mt-3">
                                <div className="space-x-5 flex items-center">
                                    <button onClick={handleLike} disabled={isLikeLoading || statusLoading} className="group relative text-gray-500 hover:text-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title={isLikeLoading ? "Processing..." : "Like post"}>
                                        <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeart} className={`${isLikeLoading ? "animate-pulse" : ""}`} style={isLiked ? { color: "#ff0000" } : {}} />
                                        <span className="ml-1">{post.likes_count || ""}</span>
                                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{isLiked ? "Unlike" : "Like"}</span>
                                    </button>
                                    <button className="group relative text-gray-500 hover:text-gray-700 transition cursor-pointer" title="View comments">
                                        <FontAwesomeIcon icon={faComment} />
                                        <span className="ml-1">{post.comments_count || ""}</span>
                                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Comments</span>
                                    </button>
                                    <button onClick={handleSave} disabled={isSaveLoading || statusLoading} className="group relative text-gray-500 hover:text-yellow-400 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title={isSaveLoading ? "Processing..." : "Save post"}>
                                        <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmark} className={`${isSaveLoading ? "animate-pulse" : ""}`} style={isSaved ? { color: "#facc15" } : {}} />
                                        <span className="ml-1">{post.saves_count || ""}</span>
                                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{isSaved ? "Unsave" : "Save"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Comment Writing Form */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-lg">Write a Comment</h3>
                <form onSubmit={handleCommentSubmit} className="flex flex-col space-y-2">
                    <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Add your comment..."
                        className="w-full bg-white dark:bg-gray-800 my-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                        rows="3"
                        disabled={isCommentLoading || loading}
                    />
                    {commentError && <p className="text-red-500 text-sm">{commentError}</p>}
                    <button
                        type="submit"
                        disabled={isCommentLoading || !commentContent.trim() || loading}
                        className="w-1/6 rounded-md shadow-sm text-sm px-4 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCommentLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                <span>Submitting...</span>
                            </span>
                        ) : "Submit"}
                    </button>
                </form>
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
                </div>
                {commentsLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                    </div>
                ) : comments.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
                                            <span className="text-xs text-gray-400" title={formatFullDate(comment.date)}>
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
}
