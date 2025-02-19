import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faComment, faHeart } from "@fortawesome/free-regular-svg-icons";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/projects/");
            console.log("Projects:", response.data);
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {loading ? (
                <p className="text-center text-gray-500">Loading projects...</p>
            ) : projects.length > 0 ? (
                projects.map((project) => (
                    <div key={project.id} className="bg-white shadow-md rounded-md border border-green-700 p-5">
                        {/* 🔹 Project Owner Info */}
                        <div className="flex items-center space-x-2">
                            <img src={project.owner.avatar_url || "https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif"} alt={project.owner.username} className="w-10 h-10 rounded-full border" />
                            <p className="font-semibold">{project.owner.username}</p>
                        </div>

                        {/* 🔹 Tags */}
                        <div className="flex flex-wrap my-2">{project.tags.length > 0 && <div className="flex flex-wrap mt-2 text-sm text-gray-500">{project.tags.map((tag) => tag.name).join(" • ")}</div>}</div>

                        {/* 🔹 Project Details */}
                        <h3 className="text-lg font-bold">{project.name}</h3>
                        <p className="text-gray-700 mb-3">{project.description}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {project.skills.length > 0 ? (
                                project.skills.map((skill) => (
                                    <span key={skill.id} className="text-xs bg-green-200 px-2 py-1 rounded-full">
                                        {skill.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-xs">No tags</span>
                            )}
                        </div>

                        {/* 🔹 Action Buttons */}
                        <div className="flex space-x-4 justify-between mt-4">
                            <button className="mt-2 rounded-md shadow-md px-3 bg-green-700 text-white font-semibold cursor-pointer hover:bg-green-600">Apply</button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500">No projects available.</p>
            )}
        </div>
    );
};

export default ProjectsPage;
