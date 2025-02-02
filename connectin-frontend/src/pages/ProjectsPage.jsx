import { faBookmark, faComment, faHeart } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

const ProjectsPage = ({ fakeProjects }) => {
    return (
        <>
            {fakeProjects.length > 0 ? (
                fakeProjects.map((post) => (
                    <div key={post.id} className="bg-white shadow-lg p-5 mb-6">
                        {/* Author & Theme */}
                        <div className="flex items-center mb-4">
                            <img src="/pngimg.com - pokemon_PNG129.png" alt={post.author} className="w-10 h-10 rounded-full border border-black" />
                            <div className="ml-5">
                                <p className="text-md font-bold">{post.author}</p>
                                <p className="text-sm text-gray-500">{post.theme}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-gray-700 mb-4">{post.content}</p>
                        <p className="text-xs text-gray-500">Posted on: {new Date(post.date).toLocaleDateString()}</p>

                        {/* Tags */}
                        <div className="mt-2">
                            {post.tags.map((tag, idx) => (
                                <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full mr-2">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-4 justify-between mt-4">
                            <div>
                                <button onClick={() => console.log("Joined!")} className="hover:text-green-700 transition duration-300 cursor-pointer underline underline-offset-4">
                                    Join
                                </button>
                            </div>
                            <div className="space-x-5">
                                <button onClick={() => console.log("Liked!")} className="text-gray-500 hover:text-red-700 transition duration-300 cursor-pointer">
                                    <FontAwesomeIcon icon={faHeart} />
                                </button>
                                <button onClick={() => console.log("Comment clicked!")} className="text-gray-500 hover:text-blue-700 transition duration-300 cursor-pointer">
                                    <FontAwesomeIcon icon={faComment} />
                                </button>
                                <button onClick={() => console.log("Saved!")} className="text-gray-500 hover:text-green-700 transition duration-300 cursor-pointer">
                                    <FontAwesomeIcon icon={faBookmark} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500">No posts found.</p>
            )}
        </>
    );
};

export default ProjectsPage;
