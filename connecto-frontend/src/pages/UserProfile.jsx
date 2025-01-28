import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus } from "@fortawesome/free-solid-svg-icons";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

const UserProfile = () => {
    const [projects, setProjects] = useState([
        { title: "Project 1", description: "Building a full-stack application", id: 1 },
        { title: "Project 2", description: "Developing a machine learning model", id: 2 },
    ]);

    const [skills, setSkills] = useState([
        { name: "C++", level: "Intermediate" },
        { name: "React", level: "Advanced" },
        { name: "Node.js", level: "Expert" },
        { name: "English", level: "C1" },
        { name: "Python", level: "Advanced" },
        { name: "JavaScript", level: "Expert" },
    ]);
    return (
        <div className="grid grid-cols-6 grid-rows-4 gap-4 my-10 text-black">
            <div className="col-span-2 row-span-5">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-center mb-4">
                        <img src="/pngimg.com - pokemon_PNG129.png" alt="Profile" className="rounded-full w-32 h-32 object-cover border border-black" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-semibold">John Doe</h2>
                        <p className="text-gray-600">Age: 30</p>
                        <p className="text-gray-600">Workplace: Tech Corp</p>
                    </div>
                    <div className="mt-4">
                        <button className="w-full bg-blue-500 text-white py-2 rounded-lg mb-2 hover:bg-blue-600">Change Photo</button>
                        <button className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Delete Profile</button>
                    </div>
                </div>
            </div>
            <div className="col-span-4 col-start-3 bg-white shadow-lg rounded-lg p-5">
                <h3 className="text-2xl font-semibold mb-4">My Projects</h3>
                <div className="grid grid-cols-2 gap-4">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white p-4 rounded-lg shadow-md">
                            <h4 className="font-semibold mb-2">{project.title}</h4>
                            <p className="text-gray-600">{project.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-4 col-start-3 row-start-2 bg-white shadow-lg rounded-lg p-5">
                <h3 className="text-2xl font-semibold mb-4">Skills</h3>
                <div className="space-y-3">
                    {skills.map((skill, index) => (
                        <div key={index} className="flex justify-between items-center p-2">
                            <p className="text-gray-600">
                                {skill.name} ({skill.level})
                            </p>
                            <div className="flex space-x-2">
                                <button className="text-red-500 hover:text-red-700">
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                                <button className="text-green-500 hover:text-green-700">
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-4 col-start-3 row-start-3 p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold mb-4">Actions</h3>
                    <p className="border border-black px-2 rounded-lg">New Post</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">My Blog Posts</h4>
                    <ul>
                        <li className="mb-2">
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h5 className="font-semibold">Blog Post Title 1</h5>
                                <p className="text-gray-600">Excerpt of blog post content...</p>
                            </div>
                        </li>
                        <li className="mb-2">
                            <div className="bg-white p-4 rounded-lg shadow-md">
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
