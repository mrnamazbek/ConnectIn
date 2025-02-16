import { faBookmark, faComment, faHeart } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ProjectsPage = ({ fakeProjects }) => {
    return (
        <>
            {fakeProjects.length > 0 ? (
                <div className="space-y-5">
                    {fakeProjects.map((post) => (
                        <div key={post.id} className="bg-white shadow-md rounded-md border border-green-700 p-5">
                            <div className="flex items-center mb-4">
                                <img src="https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif" alt={post.author} className="w-10 h-10 rounded-full" />
                                <div className="ml-5">
                                    <p className="font-semibold">{post.author}</p>
                                    <p className="text-sm text-gray-500">{post.theme}</p>
                                </div>
                            </div>

                            <p className="text-gray-700 mb-3">{post.content}</p>
                            <p className="text-xs text-gray-500">Posted on: {new Date(post.date).toLocaleDateString()}</p>

                            <div className="mt-3">
                                {post.tags.map((tag, idx) => (
                                    <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full mr-2">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex space-x-4 justify-between mt-4">
                                <button className="mt-2 rounded-md shadow-md px-3 bg-green-700 text-white font-semibold cursor-pointer hover:bg-green-600">Apply</button>
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
                </div>
            ) : (
                <p className="text-center text-gray-500">No posts found.</p>
            )}
        </>
    );
};

export default ProjectsPage;
