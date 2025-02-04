import React from "react";
import { faBookmark, faComment, faHeart } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function NewsPage({ fakeNews }) {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Main Content Wrapper - Pushes Footer Down */}
            <div className="flex-grow container mx-auto">
                {(!fakeNews || fakeNews.length === 0) ? (
                    <p className="text-center text-gray-500">No news articles found.</p>
                ) : (
                    <div className="flex flex-col space-y-5">
                        {fakeNews.map((article) => (
                            <div key={article.id} className="bg-white border border-green-700 rounded-md shadow-md p-5">
                                {/* Author & Theme */}
                                <div className="flex items-center mb-4">
                                    <img src="https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif" alt={article.author} className="w-10 h-10 rounded-full" />
                                    <p className="font-semibold ml-2">{article.author}</p>
                                </div>

                                {/* Title */}
                                <p className="font-semibold mb-2">{article.title}</p>

                                {/* Content */}
                                <p className="text-gray-700 mb-3">{article.content}</p>

                                {/* Date */}
                                <p className="text-xs text-gray-500">Posted on: {new Date(article.date).toLocaleDateString()}</p>

                                {/* Tags */}
                                <div className="mt-3">
                                    {article.tags.map((tag, index) => (
                                        <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full mr-2 whitespace-nowrap">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Buttons */}
                                <div className="flex space-x-4 justify-between mt-4">
                                    <button className="mt-2 rounded-md shadow-md px-3 bg-green-700 text-white font-semibold cursor-pointer hover:bg-green-600">
                                        Read
                                    </button>
                                    <div className="space-x-5">
                                        <button onClick={() => console.log("Liked!")} className="text-gray-500 hover:text-red-700 transition cursor-pointer">
                                            <FontAwesomeIcon icon={faHeart} />
                                        </button>
                                        <button onClick={() => console.log("Comment clicked!")} className="text-gray-500 hover:text-gray-700 transition cursor-pointer">
                                            <FontAwesomeIcon icon={faComment} />
                                        </button>
                                        <button onClick={() => console.log("Saved!")} className="text-gray-500 hover:text-green-700 transition cursor-pointer">
                                            <FontAwesomeIcon icon={faBookmark} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
