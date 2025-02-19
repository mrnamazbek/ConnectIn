import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { Routes, Route, NavLink, Navigate } from "react-router";
import ProjectsSection from "./ProjectsSection";
import SkillsSection from "./SkillsSection";
import ActionsSection from "./ActionsSection";

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [projects, setProjects] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [education, setEducation] = useState([]);
    const [experience, setExperience] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [newEducation, setNewEducation] = useState({ institution: "", degree: "", start_year: "", end_year: "" });
    const [newExperience, setNewExperience] = useState({ company: "", role: "", start_year: "", end_year: "" });
    const [editMode, setEditMode] = useState(false);
    const [updatedUser, setUpdatedUser] = useState({
        first_name: "",
        last_name: "",
        position: "",
        city: "",
        email: "",
        github: "",
        linkedin: "",
        telegram: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://127.0.0.1:8000/users/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUser(response.data);
                setUpdatedUser(response.data);
                setSkills(response.data.skills || []);
                setProjects(response.data.projects || []);
                setEducation(response.data.education || []);
                setExperience(response.data.experience || []);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserPosts = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://127.0.0.1:8000/posts/my", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUserPosts(response.data);
            } catch (error) {
                console.error("Failed to fetch user posts", error);
            }
        };

        fetchUserData();
        fetchUserPosts();
    }, []);

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // ✅ Remove post from state after successful deletion
            setUserPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

            alert("Post deleted successfully!");
        } catch (error) {
            console.error("Failed to delete post:", error);
        }
    };

    // 🔹 Add Education
    const handleAddEducation = async () => {
        if (!newEducation.institution || !newEducation.degree || !newEducation.start_year || !newEducation.end_year) {
            alert("All fields are required");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://127.0.0.1:8000/users/me/education",
                {
                    ...newEducation,
                    start_year: parseInt(newEducation.start_year, 10),
                    end_year: parseInt(newEducation.end_year, 10),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setEducation([...education, response.data]);
            setNewEducation({ institution: "", degree: "", start_year: "", end_year: "" });
            setShowEducationForm(false);
        } catch (error) {
            console.error("Failed to add education:", error);
        }
    };

    // 🔹 Delete Education
    const handleDeleteEducation = async (eduId) => {
        try {
            console.log("Deleting Education ID:", eduId); // ✅ Check if ID is valid before calling delete
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/users/me/education/${eduId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setEducation(education.filter((edu) => edu.id !== eduId));
        } catch (error) {
            console.error("Failed to delete education:", error);
        }
    };

    // 🔹 Add Experience
    const handleAddExperience = async () => {
        if (!newExperience.company || !newExperience.role || !newExperience.start_year || !newExperience.end_year) {
            alert("All fields are required");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://127.0.0.1:8000/users/me/experience",
                {
                    ...newExperience,
                    start_year: parseInt(newExperience.start_year, 10),
                    end_year: parseInt(newExperience.end_year, 10),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setExperience([...experience, response.data]);
            setNewExperience({ company: "", role: "", start_year: "", end_year: "" });
            setShowExperienceForm(false);
        } catch (error) {
            console.error("Failed to add experience:", error);
        }
    };

    // 🔹 Delete Experience
    const handleDeleteExperience = async (expId) => {
        try {
            const token = localStorage.getItem("token");
            console.log("Deleting Experience ID:", expId); // ✅ Check if ID is valid before calling delete
            await axios.delete(`http://127.0.0.1:8000/users/me/experience/${expId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setExperience(experience.filter((exp) => exp.id !== expId));
        } catch (error) {
            console.error("Failed to delete experience:", error);
        }
    };

    // ✅ Handle form input changes
    const handleChange = (e) => {
        setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
    };

    // ✅ Validate email format
    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(updatedUser.email)) {
            newErrors.email = "Invalid email format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ Handle form submission
    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem("token");
            const response = await axios.put("http://127.0.0.1:8000/users/me", updatedUser, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUser(response.data);
            setEditMode(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile. Please try again.");
        }
    };
    return (
        <div className="grid grid-cols-8 gap-4 my-4">
            <div className="col-span-6 bg-white p-5 shadow-sm rounded-md border border-green-700 flex flex-col self-start hover:shadow-green-700 transition">
                <div className="flex space-x-5">
                    <img src={user?.avatar_url || "https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif"} alt="Profile Picture" className="rounded-full w-32 h-32 object-cover border border-black" />
                    {loading ? (
                        <p className="text-gray-600">Loading profile...</p>
                    ) : user ? (
                        <div className="flex flex-col space-y-2">
                            <p className="">
                                {user.first_name} {user.last_name} <span className="text-sm text-gray-500">{user.username}</span>
                            </p>
                            <p>{user.position || "Role not specified"}</p>
                            <p>{user.city || "Location not specified"}</p>
                            <a href={`mailto:${user.email}`} rel="noopener noreferrer" className="text-sm text-blue-500 font-semibold hover:underline hover:underline-offset-2">
                                {user.email}
                            </a>
                            <div className="flex space-x-5">
                                {user.github && (
                                    <a href={user.github} target="_blank" rel="noopener noreferrer">
                                        <FontAwesomeIcon icon={faGithub} size="lg" className="hover:text-green-700 transition" />
                                    </a>
                                )}
                                {user.linkedin && (
                                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
                                        <FontAwesomeIcon icon={faLinkedin} size="lg" className="hover:text-green-700 transition" />
                                    </a>
                                )}
                                {user.telegram && (
                                    <a href={user.telegram.startsWith("http") ? user.telegram : `https://t.me/${user.telegram}`} target="_blank" rel="noopener noreferrer">
                                        <FontAwesomeIcon icon={faTelegram} size="lg" className="hover:text-green-700 transition" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">User data not available.</p>
                    )}
                </div>
            </div>

            <div className="col-span-2 flex-col space-y-4">
                <div className="bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
                    <p className="font-semibold">Projects</p>
                    {loading ? (
                        <p className="text-gray-600">Loading projects...</p>
                    ) : projects.length > 0 ? (
                        projects.map((project, index) => (
                            <div key={project.id} className="p-4 border-b last:border-b-0">
                                <h4 className="font-semibold">{project.name}</h4>
                                <p className="text-gray-600">{project.description}</p>
                                <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline">
                                    Enter Project
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-700">No projects found.</p>
                    )}
                </div>
                <div className="col-span-2 bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
                    <p className="font-semibold">Projects</p>
                    {loading ? (
                        <p className="text-gray-600">Loading projects...</p>
                    ) : projects.length > 0 ? (
                        projects.map((project, index) => (
                            <div key={project.id} className="p-4 border-b last:border-b-0">
                                <h4 className="font-semibold">{project.name}</h4>
                                <p className="text-gray-600">{project.description}</p>
                                <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline">
                                    Enter Project
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-700">No projects found.</p>
                    )}
                </div>
            </div>

            <div className="col-span-6 bg-white border border-green-700 rounded-md shadow-sm p-5 w-full hover:shadow-green-700 transition">
                <h4 className="font-semibold">Education</h4>
                {education.map((edu, index) => {
                    console.log("Education Entry:", edu); // ✅ Debug: Ensure data is correct

                    return (
                        <div key={edu.id || index} className="flex justify-between items-center p-2 border-b border-gray-300 last:border-0">
                            <p>
                                {edu.institution} - {edu.degree} ({edu.start_year} - {edu.end_year})
                            </p>
                            <FontAwesomeIcon
                                icon={faTrashAlt}
                                className="text-red-500 cursor-pointer hover:text-red-700"
                                onClick={() => {
                                    console.log("Deleting Education ID:", edu.id); // ✅ Check if ID is valid before calling delete
                                    handleDeleteEducation(edu.id);
                                }}
                            />
                        </div>
                    );
                })}
                <button onClick={() => setShowEducationForm(!showEducationForm)} className="mt-2 text-green-700 font-semibold flex items-center">
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Education
                </button>
                {showEducationForm && (
                    <div className="mt-2 flex flex-col space-y-2">
                        <input type="text" placeholder="Institution" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.institution} onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })} />
                        <input type="text" placeholder="Degree" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.degree} onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })} />
                        <input type="number" placeholder="Start Year" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.start_year} onChange={(e) => setNewEducation({ ...newEducation, start_year: e.target.value })} />
                        <input type="number" placeholder="End Year" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.end_year} onChange={(e) => setNewEducation({ ...newEducation, end_year: e.target.value })} />
                        <button onClick={handleAddEducation} className="text-white bg-green-700 font-semibold px-3 py-1 rounded-md">
                            Save
                        </button>
                    </div>
                )}

                {/* 🔹 Experience Section */}
                <div className="mt-4">
                    <h4 className="font-semibold">Experience</h4>
                    {experience.map((exp) => {
                        console.log("Experience Entry:", exp); // ✅ Debug: Ensure data is correct
                        return (
                            <div key={exp.id} className="flex justify-between items-center p-2 border-b border-gray-300 last:border-0">
                                <p>
                                    {exp.company} - {exp.role} ({exp.start_year} - {exp.end_year})
                                </p>
                                <FontAwesomeIcon
                                    icon={faTrashAlt}
                                    className="text-red-500 cursor-pointer hover:text-red-700"
                                    onClick={() => {
                                        console.log("Deleting Experience ID:", exp.id); // ✅ Check if ID is valid before calling delete
                                        handleDeleteExperience(exp.id);
                                    }}
                                />
                            </div>
                        );
                    })}
                    <button onClick={() => setShowExperienceForm(!showExperienceForm)} className="mt-2 text-green-700 font-semibold flex items-center">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Experience
                    </button>
                    {showExperienceForm && (
                        <div className="mt-2 flex flex-col space-y-2">
                            <input type="text" placeholder="Company" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} />
                            <input type="text" placeholder="Role" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.role} onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })} />
                            <input type="number" placeholder="Start Year" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.start_year} onChange={(e) => setNewExperience({ ...newExperience, start_year: e.target.value })} />
                            <input type="number" placeholder="End Year" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.end_year} onChange={(e) => setNewExperience({ ...newExperience, end_year: e.target.value })} />
                            <button onClick={handleAddExperience} className="text-white bg-green-700 font-semibold px-3 py-1 rounded-md">
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="col-span-6 bg-white border border-green-700 rounded-md shadow-sm p-5 w-full hover:shadow-green-700 transition">
                <div className="flex mb-4 space-x-5 border-b border-gray-300 ">
                    <NavLink to="/profile/projects" className={({ isActive }) => (isActive ? "text-green-700 py-1" : "hover:text-green-700 py-1")}>
                        Projects
                    </NavLink>
                    <NavLink to="/profile/skills" className={({ isActive }) => (isActive ? "text-green-700 py-1" : "hover:text-green-700 py-1")}>
                        Skills
                    </NavLink>
                    <NavLink to="/profile/actions" className={({ isActive }) => (isActive ? "text-green-700 py-1" : "hover:text-green-700 py-1")}>
                        News
                    </NavLink>
                </div>

                <Routes>
                    <Route index element={<Navigate to="projects" />} />
                    <Route path="projects" element={<ProjectsSection user={user} projects={projects} loading={loading} />} />
                    <Route path="skills" element={<SkillsSection setSkills={setSkills} skills={skills} loading={loading} />} />
                    <Route path="actions" element={<ActionsSection setUserPosts={setUserPosts} userPosts={userPosts} loading={loading} />} />
                </Routes>
            </div>
        </div>
    );
};

export default UserProfile;
