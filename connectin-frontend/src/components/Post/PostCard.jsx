import React from "react";
import { NavLink } from "react-router";
import { faBookmark as faBookmarkRegular, faComment, faHeart } from "@fortawesome/free-regular-svg-icons";
import { faBookmark as faBookmarkSolid, faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const PostCard = ({ post, showReadButton = true, onLike, onSave, isLiked = false, isSaved = false }) => {
    const { id, title, content, author, tags, date, likes_count, comments_count, saves_count } = post;

    return (
        <div className="bg-white dark:bg-zinc-800 border border-green-700 rounded-md shadow-md p-5">
            <div className="flex items-center mb-4">
                <img src={author.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={author.username || "User"} className="w-8 h-8 rounded-full border" />
                <p className="text-sm font-semibold ml-2">{author.username || "Unknown"}</p>
            </div>

            {tags.length > 0 && (
                <div className="my-3">
                    {tags.map((tag, index) => (
                        <span key={index} className="text-xs text-gray-500 whitespace-nowrap">
                            {tag}
                            {index < tags.length - 1 ? " • " : ""}
                        </span>
                    ))}
                </div>
            )}

            <p className="font-semibold mb-2">{title}</p>
            <p className="text-sm mb-3 line-clamp-6" dangerouslySetInnerHTML={{ __html: content }} />
            <p className="text-xs text-gray-500">{date ? `Posted on: ${new Date(date).toLocaleDateString()}` : "Date not available"}</p>

            <div className="flex justify-between items-center mt-3">
                <div className="space-x-5 flex items-center">
                    <button onClick={onLike} className="text-gray-500 hover:text-red-700 transition cursor-pointer">
                        <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeart} style={isLiked ? { color: "#ff0000" } : {}} /> <span>{likes_count || ""}</span>
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 transition cursor-pointer">
                        <FontAwesomeIcon icon={faComment} /> <span>{comments_count || ""}</span>
                    </button>
                    <button onClick={onSave} className="text-gray-500 hover:text-yellow-400 transition cursor-pointer">
                        <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmarkRegular} style={isSaved ? { color: "#facc15" } : {}} /> <span>{saves_count || ""}</span>
                    </button>
                </div>
                {showReadButton && (
                    <NavLink to={`/posts/${id}`} state={{ post }} className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition">
                        Read
                    </NavLink>
                )}
            </div>
        </div>
    );
};

export const LoadingMessage = () => <p className="text-center text-gray-500">Loading...</p>;
export const ErrorMessage = ({ message }) => <p className="text-center text-red-500">{message}</p>;
export const NoDataMessage = ({ message }) => <p className="text-center text-gray-500">{message}</p>;
