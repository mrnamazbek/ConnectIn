import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://127.0.0.1:8000/users/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
                setSkills(response.data.skills);
                setProjects(response.data.projects);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="grid grid-cols-6 grid-rows-4 gap-4 my-10 text-black">
            {/* Profile Section */}
            <div className="col-span-2 row-span-5">
                <div className="bg-white p-6 shadow-md">
                    <div className="flex justify-center mb-4 flex-col space-y-5">
                        <img src="/pngimg.com - pokemon_PNG129.png" alt="Profile" className="mx-auto rounded-full w-32 h-32 object-cover border border-black" />
                        <div className="flex items-center justify-center space-x-10">
                            <FontAwesomeIcon icon={faTrashAlt} className="cursor-pointer hover:text-red-500" />
                            <FontAwesomeIcon icon={faPlus} className="cursor-pointer hover:text-green-500" />
                        </div>
                    </div>
                    <div className="text-center">
                        {user ? (
                            <>
                                <h2 className="text-xl font-semibold">
                                    {user.first_name} {user.last_name}
                                </h2>
                                <p className="text-gray-600">Position: {user.position}</p>
                                <p className="text-gray-600">City: {user.city}</p>
                                <p className="text-gray-600">
                                    GitHub:{" "}
                                    <a href={user.github} target="_blank" className="text-blue-600">
                                        {user.github}
                                    </a>
                                </p>
                                <p className="text-gray-600">
                                    LinkedIn:{" "}
                                    <a href={user.linkedin} target="_blank" className="text-blue-600">
                                        {user.linkedin}
                                    </a>
                                </p>
                                <p className="text-gray-600">
                                    Telegram:{" "}
                                    <a href={`https://t.me/${user.telegram}`} target="_blank" className="text-blue-600">
                                        {user.telegram}
                                    </a>
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-600">Loading profile...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Projects Section */}
            <div className="col-span-4 col-start-3 bg-white shadow-lg">
                <div className="pl-5 pt-5 pr-5">
                    <h3 className="text-2xl font-semibold">My Projects</h3>
                    {projects.length > 0 ? (
                        projects.map((project, index) => (
                            <div key={project.id} className="p-4">
                                <div className="flex flex-col space-y-3 items-start">
                                    <h4 className="font-semibold">{project.name}</h4>
                                    <p className="text-gray-600">{project.description}</p>
                                    <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline underline-offset-4">
                                        Enter Project
                                    </button>
                                    {index < projects.length - 1 && <hr className="mt-4 -mb-10 border-t border-gray-300" />}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">No projects found.</p>
                    )}
                </div>
                <div className="bg-gray-200 flex justify-center items-center py-1 cursor-pointer">
                    <FontAwesomeIcon icon={faArrowDown} />
                </div>
            </div>

            {/* Skills Section */}
            <div className="col-span-4 bg-white shadow-lg flex flex-col">
                <div className="pl-5 pt-5 pr-5">
                    <h3 className="text-2xl font-semibold">Skills</h3>
                    {skills.length > 0 ? (
                        skills.map((skill, index) => (
                            <div key={index} className="flex justify-between items-center px-4 py-2">
                                <p className="text-gray-600">{skill.name}</p>
                                <div className="flex space-x-2">
                                    <button className="hover:text-red-700">
                                        <FontAwesomeIcon icon={faTrashAlt} className="cursor-pointer" />
                                    </button>
                                    <button className="hover:text-green-700">
                                        <FontAwesomeIcon icon={faEdit} className="cursor-pointer" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">No skills added yet.</p>
                    )}
                </div>
                <div className="bg-gray-200 flex justify-center items-center py-1 cursor-pointer">
                    <FontAwesomeIcon icon={faArrowDown} />
                </div>
            </div>

            {/* Actions Section */}
            <div className="col-span-4 col-start-3 row-start-3 p-6 bg-white shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold">Actions</h3>
                    <p className="border border-gray-300 px-2">New Post</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">My Blog Posts</h4>
                    <ul>
                        <li className="mb-2">
                            <div className="bg-white p-4 shadow-md">
                                <h5 className="font-semibold">Blog Post Title 1</h5>
                                <p className="text-gray-600">Excerpt of blog post content...</p>
                            </div>
                        </li>
                        <li className="mb-2">
                            <div className="bg-white p-4 shadow-md">
                                <h5 className="font-semibold">Blog Post Title 2</h5>
                                <p className="text-gray-600">Excerpt of blog post content...</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
