import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";

const PopularPosts = () => {
    const [popularPosts, setPopularPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPopularPosts = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/`, {
                    params: {
                        page: 1,
                        page_size: 3,
                        sort_by: "likes_count",
                        sort_order: "desc",
                    },
                });
                setPopularPosts(response.data.items);
            } catch (error) {
                console.error("Error fetching popular posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPopularPosts();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 col-span-2 dark:text-gray-300 flex flex-col border border-green-700 rounded-md p-5 shadow-md">
            <h2 className="font-semibold mb-2">Popular Posts</h2>
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-4">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-green-700 text-2xl" />
                    </div>
                ) : popularPosts.length > 0 ? (
                    popularPosts.map((post) => (
                        <div key={post.id} className="py-2 last:border-b-0 border-t border-gray-300">
                            {post.tags && post.tags.length > 0 && (
                                <div className="my-1 flex flex-wrap gap-1">
                                    {post.tags.map((tag, index) => (
                                        <span key={index} className="text-xs text-gray-500">
                                            {tag.name}
                                            {index < post.tags.length - 1 && <span className="mx-1">•</span>}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <h3 className="font-semibold text-sm mb-2">{post.title}</h3>
                            <p className="text-sm mb-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content }}></p>
                            <div className="flex justify-between items-center text-xs">
                                <NavLink to={`/feed/post/${post.id}`} className="text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                                    View Post
                                </NavLink>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No popular posts available.</p>
                )}
            </div>
        </div>
    );
};

export default PopularPosts;
