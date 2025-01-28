// src/pages/NewsPage.jsx
import React from "react";
import { faBookmark, faComment, faHeart } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function NewsPage({ fakeNews }) {
    if (!fakeNews || fakeNews.length === 0) {
        return <p className="text-center text-gray-500">No news articles found.</p>;
    }

    return (
        <>
            {fakeNews.map((article) => (
                <div key={article.id} className="bg-white shadow-lg p-5 mb-6">
                    {/* Author & Theme */}
                    <div className="flex items-center mb-4">
                        <img src="/pngimg.com - pokemon_PNG129.png" alt={article.author} className="w-10 h-10 rounded-full border border-black" />
                        <p className="text-md font-bold ml-2">{article.author}</p>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2">{article.title}</h3>

                    {/* Content */}
                    <p className="text-gray-700 mb-4">{article.content}</p>

                    {/* Date */}
                    <p className="text-xs text-gray-500">Posted on: {new Date(article.date).toLocaleDateString()}</p>

                    {/* Tags */}
                    <div className="mt-2">
                        {article.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full mr-2 whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-4 justify-between mt-4">
                        <div>
                            <button onClick={() => console.log("Read More!")} className="hover:text-green-700 transition duration-300 cursor-pointer underline underline-offset-4">
                                Read More
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
            ))}
        </>
    );
}
