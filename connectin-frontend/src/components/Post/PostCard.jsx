import { faBookmark as faBookmarkRegular, faComment, faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faBookmark as faBookmarkSolid, faHeart as faHeartSolid, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useNavigate } from "react-router";
import usePostStore from "../../store/postStore";

export const PostCard = ({ post, showReadButton = true }) => {
    const { id, title, content, author, tags, comments_count } = post;
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const navigate = useNavigate();

    // Select individual values from the store to prevent unnecessary re-renders
    const isLiked = usePostStore((state) => state.likedPosts[id] || false);
    const isSaved = usePostStore((state) => state.savedPosts[id] || false);
    const likesCount = usePostStore((state) => state.postCounts[id]?.likes || 0);
    const savesCount = usePostStore((state) => state.postCounts[id]?.saves || 0);
    const likePost = usePostStore((state) => state.likePost);
    const savePost = usePostStore((state) => state.savePost);

    const handleLike = async () => {
        setIsLikeLoading(true);
        try {
            await likePost(id);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaveLoading(true);
        try {
            await savePost(id);
        } finally {
            setIsSaveLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 dark:text-gray-300 border border-green-700 rounded-md shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
                <div className="relative w-8 h-8 flex items-center justify-center rounded-full border-2 border-green-700 dark:border-green-500 bg-gray-100 dark:bg-gray-700">
                    {author.avatar_url ? (
                        <img
                            src={author.avatar_url}
                            alt={author.username || "User"}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                                e.target.src = "";
                            }}
                        />
                    ) : (
                        <FontAwesomeIcon icon={faUser} className="text-gray-500 dark:text-gray-400" />
                    )}
                </div>
                <p className="text-sm font-semibold ml-2">{author.username || "Unknown"}</p>
            </div>

            {tags.length > 0 && (
                <div className="my-3 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <p className="font-semibold mb-2 text-lg hover:text-green-700 transition-colors">{title}</p>
            <p className="text-sm mb-3 line-clamp-6 prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />

            <div className="flex justify-between items-center mt-3">
                <div className="space-x-5 flex items-center">
                    <button onClick={handleLike} disabled={isLikeLoading} className="group relative text-gray-500 hover:text-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title={isLikeLoading ? "Processing..." : "Like post"}>
                        <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} className={`${isLikeLoading ? "animate-pulse" : ""}`} style={isLiked ? { color: "#ff0000" } : {}} />
                        <span className="ml-1">{likesCount}</span>
                    </button>
                    <button className="group relative text-gray-500 hover:text-gray-700 transition cursor-pointer" title="View comments">
                        <FontAwesomeIcon icon={faComment} />
                        <span className="ml-1">{comments_count || 0}</span>
                    </button>
                    <button onClick={handleSave} disabled={isSaveLoading} className="group relative text-gray-500 hover:text-yellow-400 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title={isSaveLoading ? "Processing..." : "Save post"}>
                        <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmarkRegular} className={`${isSaveLoading ? "animate-pulse" : ""}`} style={isSaved ? { color: "#facc15" } : {}} />
                        <span className="ml-1">{savesCount}</span>
                    </button>
                </div>
                {showReadButton && (
                    <button onClick={() => navigate(`/feed/post/${id}`)} className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition">
                        Read
                    </button>
                )}
            </div>
        </div>
    );
};

export const LoadingMessage = () => (
    <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
    </div>
);

export const ErrorMessage = ({ message }) => (
    <div className="text-center py-8">
        <p className="text-red-500">{message}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-green-700 hover:text-green-800 underline">
            Try again
        </button>
    </div>
);

export const NoDataMessage = ({ message }) => (
    <div className="text-center py-8 border border-dashed rounded-md">
        <p className="text-gray-500">{message}</p>
    </div>
);
