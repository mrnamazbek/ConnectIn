import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router";
import axios from "axios";
import { PostCard, LoadingMessage, ErrorMessage, NoDataMessage } from "../components/Post/PostCard";

export default function PostPage() {
    const { postId } = useParams();
    const location = useLocation();
    const [post, setPost] = useState(location.state?.post || null);
    const [comments, setComments] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(!post);
    const [error, setError] = useState(null);
    const [commentContent, setCommentContent] = useState("");
    const [commentError, setCommentError] = useState(null);

    useEffect(() => {
        if (!post) fetchPost();
        fetchComments();
        fetchLikeStatus();
    }, [postId, post]);

    const fetchPost = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/posts/${postId}`);
            setPost(response.data);
        } catch (error) {
            console.error("Error fetching post:", error);
            setError("Failed to load the post. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/posts/${postId}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const fetchLikeStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await axios.get(`http://127.0.0.1:8000/posts/${postId}/is_liked`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIsLiked(response.data.is_liked);
        } catch (error) {
            console.error("Error fetching like status:", error);
        }
    };

    const handleLike = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await axios.post(`http://127.0.0.1:8000/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setIsLiked(!isLiked);
            setPost((prev) => ({
                ...prev,
                likes_count: prev.likes_count + (isLiked ? -1 : 1),
            }));
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) {
            setCommentError("Comment cannot be empty.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setCommentError("You must be logged in to comment.");
                return;
            }

            const response = await axios.post(`http://127.0.0.1:8000/posts/${postId}/comment`, { content: commentContent }, { headers: { Authorization: `Bearer ${token}` } });

            // Add the new comment to the list
            setComments((prev) => [...prev, response.data]);
            setPost((prev) => ({
                ...prev,
                comments_count: prev.comments_count + 1,
            }));
            setCommentContent("");
            setCommentError(null);
        } catch (error) {
            console.error("Error submitting comment:", error.response?.data || error.message);
            setCommentError(error.response?.data?.detail || "Failed to submit comment. Please try again.");
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex-grow container mx-auto">
                {loading ? (
                    <LoadingMessage />
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : !post ? (
                    <NoDataMessage message="Post not found." />
                ) : (
                    <div className="flex flex-col space-y-5">
                        <PostCard post={post} showReadButton={false} onLike={handleLike} isLiked={isLiked} />
                    </div>
                )}
            </div>

            {/* Comment Writing Form */}
            <div className="my-5">
                <h3 className="font-semibolb">Write a Comment</h3>
                <form onSubmit={handleCommentSubmit} className="flex flex-col space-y-2">
                    <textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder="Add your comment..." className="w-full bg-white my-2 p-2 border border-gray-200 rounded-md shadow-sm focus:outline-none" rows="3" />
                    {commentError && <p className="text-red-500 text-sm">{commentError}</p>}
                    <button type="submit" className="w-1/6 rounded-md shadow-sm text-sm px-4 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition">
                        Submit
                    </button>
                </form>
            </div>

            {/* Comments Section */}
            <div>
                <h3 className="font-semibold">Comments ({comments.length})</h3>
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="py-3 border-b border-gray-500 first:border-t-0 last:border-b-0">
                            <div className="flex items-center">
                                <img src={comment.user?.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={comment.user?.username || "User"} className="w-6 h-6 rounded-full border mr-2" />
                                <p className="text-sm font-semibold">{comment.user?.username || "Unknown User"}</p>
                            </div>
                            <p className="mt-2">{comment.content}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No comments yet.</p>
                )}
            </div>
        </div>
    );
}
