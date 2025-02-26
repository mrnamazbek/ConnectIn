import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { faBookmark, faComment, faHeart } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function PostPage() {
    const { postId } = useParams(); 
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPost();
    }, [postId]);

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

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow container mx-auto">
                {loading ? (
                    <p className="text-center text-gray-500">Loading post...</p>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : !post ? (
                    <p className="text-center text-gray-500">Post not found.</p>
                ) : (
                    <div className="flex flex-col space-y-5">
                        <div className="bg-white border border-green-700 rounded-md shadow-md p-5">
                            {/* 🔹 Author & Avatar */}
                            <div className="flex items-center mb-4">
                                <img src={post.author.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                     alt={post.author.username || "User"} 
                                     className="w-8 h-8 rounded-full border" />
                                <p className="text-sm font-semibold ml-2">{post.author.username || "Unknown"}</p>
                            </div>

                            {/* 🔹 Tags */}
                            {post.tags.length > 0 && (
                                <div className="my-3">
                                    {post.tags.map((tag, index) => (
                                        <span key={index} className="text-xs text-gray-500 whitespace-nowrap">
                                            {tag}
                                            {index < post.tags.length - 1 ? " • " : ""}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* 🔹 Title */}
                            <p className="font-semibold mb-2">{post.title}</p>

                            {/* 🔹 Content */}
                            <p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: post.content }} />

                            {/* 🔹 Date */}
                            <p className="text-xs text-gray-500">{post.date ? `Posted on: ${new Date(post.date).toLocaleDateString()}` : "Date not available"}</p>

                            {/* 🔹 Buttons */}
                            <div className="flex justify-between">
                                <div className="space-x-5 mt-3">
                                    <button className="text-gray-500 hover:text-red-700 transition cursor-pointer">
                                        <FontAwesomeIcon icon={faHeart} />
                                    </button>
                                    <button className="text-gray-500 hover:text-gray-700 transition cursor-pointer">
                                        <FontAwesomeIcon icon={faComment} />
                                    </button>
                                    <button className="text-gray-500 hover:text-green-700 transition cursor-pointer">
                                        <FontAwesomeIcon icon={faBookmark} />
                                    </button>
                                </div>
                                <button className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition">
                                    Read More
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
