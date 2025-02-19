import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt, faPlus, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";

const ProjectsSection = ({ user }) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [tags, setTags] = useState([]);
    const [skills, setSkills] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        fetchProjects();
        fetchTagsAndSkills();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get("http://127.0.0.1:8000/projects/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTagsAndSkills = async () => {
        try {
            const tagsRes = await axios.get("http://127.0.0.1:8000/tags/");
            const skillsRes = await axios.get("http://127.0.0.1:8000/skills/");
            setTags(tagsRes.data);
            setSkills(skillsRes.data);
        } catch (error) {
            console.error("Failed to fetch tags or skills:", error);
        }
    };

    const handleCreateProject = async () => {
        if (!name.trim() || !description.trim()) {
            alert("Project name and description are required.");
            return;
        }

        setCreating(true);
        try {
            const token = localStorage.getItem("token");
            console.log({ name, description, selectedTags, selectedSkills });
            await axios.post(
                "http://127.0.0.1:8000/projects/",
                {
                    name,
                    description,
                    tag_ids: selectedTags,
                    skill_ids: selectedSkills,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Project created successfully!");
            fetchProjects();
            setName("");
            setDescription("");
            setSelectedTags([]);
            setSelectedSkills([]);
            setIsFormOpen(false);
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteProject = async (projectId, ownerId) => {
        if (!user || user.id !== ownerId) {
            alert("You can only delete your own projects.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Project deleted successfully!");
            setProjects((prev) => prev.filter((project) => project.id !== projectId));
        } catch (error) {
            console.error("Failed to delete project:", error);
        }
    };

    return (
        <div className="self-start w-full hover:shadow-green-700 transition">
            {/* 🔹 Toggle Create Project Form */}
            <button onClick={() => setIsFormOpen(!isFormOpen)} className="mt-3 w-full bg-green-700 text-white px-4 py-2 rounded-md font-semibold shadow-md hover:bg-green-600 transition flex justify-between items-center">
                {isFormOpen ? "Hide Form" : "Create New Project"}
                <FontAwesomeIcon icon={isFormOpen ? faChevronUp : faChevronDown} />
            </button>

            {/* 🔹 Collapsible Create Project Form */}
            {isFormOpen && (
                <div className="mt-4">
                    <h3 className="font-semibold">New Project</h3>
                    <input type="text" placeholder="Project Name" className="w-full bg-white text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm" value={name} onChange={(e) => setName(e.target.value)} />
                    <textarea placeholder="Project Description" className="w-full bg-white text-sm px-3 py-2 border border-gray-200 rounded-md shadow-sm mt-2" value={description} onChange={(e) => setDescription(e.target.value)} />

                    {/* 🔹 Select Tags */}
                    <div className="mt-2">
                        <p className="font-semibold text-sm">Select Tags:</p>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => setSelectedTags((prev) => (prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]))}
                                    className={`px-2 py-1 shadow-sm rounded-md text-sm cursor-pointer transition ${selectedTags.includes(tag.id) ? "bg-green-700 text-white" : ""}`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 🔹 Select Skills */}
                    <div className="mt-2">
                        <p className="font-semibold text-sm">Select Skills:</p>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <button
                                    key={skill.id}
                                    onClick={() => setSelectedSkills((prev) => (prev.includes(skill.id) ? prev.filter((id) => id !== skill.id) : [...prev, skill.id]))}
                                    className={`px-2 py-1 shadow-sm rounded-md text-sm cursor-pointer transition ${selectedSkills.includes(skill.id) ? "bg-green-700 text-white" : ""}`}
                                >
                                    {skill.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleCreateProject} className="mt-3 w-full bg-green-700 text-white px-4 py-2 rounded-md font-semibold shadow-md hover:bg-green-600 transition" disabled={creating}>
                        {creating ? "Creating..." : "Save Project"}
                    </button>
                </div>
            )}

            {/* 🔹 Display Projects */}
            {loading ? (
                <p className="text-gray-600 mt-3">Loading projects...</p>
            ) : projects.length > 0 ? (
                projects.map((project) => (
                    <div key={project.id} className="py-4 border-b border-gray-300 last:border-b-0">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <h4 className="font-semibold">{project.name}</h4>
                                <p className="text-gray-600">{project.description}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {project.tags.map((tag, index) => (
                                        <span key={tag.id} className="text-xs text-gray-500">
                                            {tag.name}
                                            {index < project.tags.length - 1 && ", "}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {project.skills.map((skill) => (
                                        <span key={skill.id} className="bg-green-200 text-green-700 px-2 py-1 rounded-md text-xs">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => navigate(`/project/${project.id}`)} // ✅ Navigate to project profile
                                    className="mt-2 text-green-700 font-semibold flex items-center hover:underline"
                                >
                                    View Project
                                </button>
                            </div>
                            {user?.id === project?.owner_id && (
                                <button onClick={() => handleDeleteProject(project.id, project.owner_id)} className="hover:text-red-700 transition">
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-700 mt-3">No projects found.</p>
            )}
        </div>
    );
};

export default ProjectsSection;
