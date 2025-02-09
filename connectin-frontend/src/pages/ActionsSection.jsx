import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import axios from "axios";

const ActionsSection = ({ userPosts, loading, setUserPosts }) => {
    const navigate = useNavigate();

    // 🔹 Delete Post Handler
    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // ✅ Remove post from state after successful deletion
            setUserPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

            alert("Post deleted successfully!");
        } catch (error) {
            console.error("Failed to delete post:", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Actions</h3>
                <button
                    className="border border-green-700 text-white bg-green-700 font-semibold px-2 shadow-sm rounded-md cursor-pointer hover:bg-green-600"
                    onClick={() => navigate("/post")} // ✅ Navigate to /post
                >
                    New Post
                </button>
            </div>

            <h4 className="font-semibold mb-2">Posts</h4>
            {loading ? (
                <p className="text-gray-600">Loading posts...</p>
            ) : userPosts.length > 0 ? (
                userPosts.map((post) => (
                    <div key={post.id} className="bg-white border border-gray-300 mb-4 last:mb-0 p-4 rounded-lg shadow-sm hover:shadow-md transition">
                        {/* Post Content */}
                        <div className="flex-1">
                            <h5 className="font-semibold text-lg">{post.title}</h5>
                            <p className="text-gray-600 mt-2 break-words" dangerouslySetInnerHTML={{ __html: post.content }} />

                            {/* Tags Section */}
                            {post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {post.tags.map((tag, index) => (
                                        <span key={index} className="text-xs bg-gray-200 px-2 py-1 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delete Button */}
                        <FontAwesomeIcon icon={faTrashAlt} className="text-red-500 cursor-pointer hover:text-red-700 mt-4" onClick={() => handleDeletePost(post.id)} />
                    </div>
                ))
            ) : (
                <p className="text-gray-700">No posts found.</p>
            )}
        </div>
    );
};

export default ActionsSection;
