import { useState, useEffect } from "react";
import { useParams } from "react-router";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";

const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);
};

const ProjectPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState(null);

    useEffect(() => {
        fetchProject();
        fetchCurrentUser();
        fetchComments();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}`);
            setProject({
                ...response.data,
                vote_count: response.data.vote_count || 0, // Backend now provides this
                comments_count: response.data.comments_count || 0,
            });
        } catch (err) {
            console.error("Error fetching project:", err);
            setError("Failed to load project.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await axios.get("http://127.0.0.1:8000/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (err) {
            console.error("Error fetching current user:", err);
        }
    };

    const fetchComments = async () => {
        setCommentLoading(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}/comments`);
            setComments(response.data);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
            setCommentError("Failed to load comments.");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleApply = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to apply for a project.");
                return;
            }

            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/apply`, {}, { headers: { Authorization: `Bearer ${token}` } });
            alert("Application submitted!");
        } catch (err) {
            console.error("Failed to apply:", err);
            alert("Failed to apply. You may have already applied.");
        }
    };

    const handleUpvote = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to vote.");
                return;
            }

            const response = await axios.post(`http://127.0.0.1:8000/projects/${projectId}/vote`, { is_upvote: true }, { headers: { Authorization: `Bearer ${token}` } });
            setProject((prev) => ({
                ...prev,
                vote_count: response.data.detail === "Vote removed" ? prev.vote_count - 1 : prev.vote_count + 1,
            }));
        } catch (err) {
            console.error("Failed to upvote:", err);
            alert("Failed to upvote.");
        }
    };

    const handleDownvote = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to vote.");
                return;
            }

            const response = await axios.post(`http://127.0.0.1:8000/projects/${projectId}/vote`, { is_upvote: false }, { headers: { Authorization: `Bearer ${token}` } });
            setProject((prev) => ({
                ...prev,
                vote_count: response.data.detail === "Vote removed" ? prev.vote_count + 1 : prev.vote_count - 1,
            }));
        } catch (err) {
            console.error("Failed to downvote:", err);
            alert("Failed to downvote.");
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to comment.");
                return;
            }

            const response = await axios.post(`http://127.0.0.1:8000/projects/${projectId}/comment`, { content: newComment }, { headers: { Authorization: `Bearer ${token}` } });

            setNewComment("");
            setComments((prev) => [...prev, response.data]);
            setProject((prev) => ({ ...prev, comments_count: prev.comments_count + 1 }));
            setCommentError(null);
        } catch (err) {
            console.error("Failed to submit comment:", err);
            alert("Failed to submit comment.");
        }
    };

    if (loading) return <div className="text-center text-gray-500">Loading...</div>;
    if (error) return <div className="text-center text-red-500">{error}</div>;
    if (!project) return <div className="text-center text-gray-500">Project not found.</div>;

    return (
        <div>
            <ProjectCard project={project} currentUser={currentUser} handleApply={handleApply} handleUpvote={handleUpvote} handleDownvote={handleDownvote} showViewProject={false} showCommentsLink={true} />
            <div className="my-5">
                <h3 className="font-semibold text-lg mb-2">Comments ({comments.length})</h3>
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="w-full p-2 border border-gray-200 rounded-md shadow-sm bg-white focus:outline-none" />
                <button onClick={handleCommentSubmit} className="mt-2 border border-green-700 hover:bg-green-700 hover:text-white transition cursor-pointer px-4 py-2 rounded-md shadow-sm">
                    Submit
                </button>
            </div>
            {commentLoading ? (
                <p className="text-gray-500">Loading comments...</p>
            ) : commentError ? (
                <p className="text-red-500">{commentError}</p>
            ) : comments.length > 0 ? (
                comments.map((comment) => (
                    <div key={comment.id} className="border-b last:border-0 border-gray-300 py-2">
                        <div className="flex items-center space-x-2">
                            <p className="font-semibold">{comment.user?.username || "Unknown"}</p>
                            <p className="text-xs text-gray-500">on {formatDate(comment.created_at)}</p>
                        </div>
                        <p className="mt-1 text-gray-700">{comment.content}</p>
                    </div>
                ))
            ) : (
                <p className="text-gray-500">No comments yet.</p>
            )}
        </div>
    );
};

export default ProjectPage;
