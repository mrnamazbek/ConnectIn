import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHeart, faComment, faBookmark } from "@fortawesome/free-solid-svg-icons";

const Feed = () => {
    const fakePosts = [
        {
            id: 1,
            author: "John Doe",
            profilePic: "https://via.placeholder.com/40",
            theme: "AI Development",
            content: "Join us in building an AI-powered chatbot for customer support. Looking for backend developers and UX designers.",
        },
        {
            id: 2,
            author: "Jane Smith",
            profilePic: "https://via.placeholder.com/40",
            theme: "Blockchain Technology",
            content: "We are working on a decentralized app for secure transactions. Need frontend experts and smart contract developers.",
        },
        {
            id: 3,
            author: "Mike Johnson",
            profilePic: "https://via.placeholder.com/40",
            theme: "Web Development",
            content: "Building a modern e-commerce platform. Seeking team members with expertise in React and Node.js.",
        },
    ];

    const bestProjects = [
        { id: 1, title: "Green Energy Monitoring System" },
        { id: 2, title: "Smart Home Automation Platform" },
        { id: 3, title: "AI-Powered Health Assistant" },
    ];

    return (
        <div className="grid grid-cols-6 gap-4 min-h-screen my-10 text-black">
            {/* Left: Feed Section */}
            <div className="col-span-4">
                {fakePosts.map((post) => (
                    <div key={post.id} className="bg-white shadow-md p-5 mb-6">
                        {/* Author and Theme */}
                        <div className="flex items-center mb-4">
                            <img src="/pngimg.com - pokemon_PNG129.png" alt={`${post.author}'s profile`} className="w-10 h-10 rounded-full mr-3" />
                            <div className="ml-5">
                                <p className="text-lg font-bold">{post.author}</p>
                                <p className="text-sm text-gray-500">{post.theme}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-gray-700 mb-4">{post.content}</p>

                        {/* Buttons */}
                        <div className="flex space-x-4 justify-between">
                            <div>
                                <button onClick={() => console.log("Joined!")} className="hover:text-green-700 transition duration-300 cursor-pointer underline underline-offset-4">
                                    Join
                                </button>
                            </div>
                            <div className="space-x-5">
                                {/* Like Button */}
                                <button onClick={() => console.log("Liked!")} className="text-gray-500 hover:text-red-700 transition duration-300 cursor-pointer">
                                    <FontAwesomeIcon icon={faHeart} />
                                </button>

                                {/* Comment Button */}
                                <button onClick={() => console.log("Comment clicked!")} className="text-gray-500 hover:text-blue-700 transition duration-300 cursor-pointer">
                                    <FontAwesomeIcon icon={faComment} />
                                </button>

                                {/* Save Button */}
                                <button onClick={() => console.log("Saved!")} className="text-gray-500 hover:text-green-700 transition duration-300 cursor-pointer">
                                    <FontAwesomeIcon icon={faBookmark} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right: Best Projects Section */}
            <div className="col-span-2 bg-white p-5 shadow-md">
                <h2 className="text-xl font-bold mb-4">Best Projects</h2>
                <div className="space-y-4">
                    {bestProjects.map((project) => (
                        <div key={project.id} className="bg-white p-4 rounded-md shadow-sm">
                            <h3 className="font-semibold text-lg">{project.title}</h3>
                            <p className="text-sm text-gray-600">Exciting project looking for collaborators.</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Feed;
