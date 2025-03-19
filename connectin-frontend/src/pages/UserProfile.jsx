import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { Routes, Route, NavLink, Navigate, useNavigate } from "react-router";
import ProjectsSection from "./ProjectsSection";
import SkillsSection from "./SkillsSection";
import ActionsSection from "./ActionsSection";

const UserProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [projects, setProjects] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [education, setEducation] = useState([]);
    const [experience, setExperience] = useState([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [error, setError] = useState(null);
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

    const degreeOptions = ["High School Diploma", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Other"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoadingUser(true);
                const token = localStorage.getItem("access_token");
                if (!token) {
                    navigate("/login");
                    return;
                }
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUser(response.data);
                setUpdatedUser(response.data);
                setSkills(response.data.skills || []);
                setProjects(response.data.projects || []);
                setEducation(response.data.education || []);
                setExperience(response.data.experience || []);
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    navigate("/login");
                } else {
                    console.error("Failed to fetch user data", error);
                    setError("Failed to load user profile. Please try again later.");
                }
            } finally {
                setLoadingUser(false);
            }
        };

        const fetchUserPosts = async () => {
            try {
                setLoadingPosts(true);
                const token = localStorage.getItem("access_token");
                if (!token) {
                    navigate("/login");
                    return;
                }
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUserPosts(response.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    navigate("/login");
                } else {
                    console.error("Failed to fetch user posts", error);
                    setError("Failed to load user posts. Please try again later.");
                }
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchUserData();
        fetchUserPosts();
    }, [navigate]);

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
            alert("Post deleted successfully!");
        } catch (error) {
            console.error("Failed to delete post:", error);
            setError("Failed to delete post. Please try again.");
        }
    };

    const handleAddEducation = async () => {
        if (!newEducation.institution || !newEducation.degree || !newEducation.start_year || !newEducation.end_year) {
            alert("All fields are required");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/me/education`,
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
            setError("Failed to add education. Please try again.");
        }
    };

    const handleDeleteEducation = async (eduId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/education/${eduId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setEducation(education.filter((edu) => edu.id !== eduId));
        } catch (error) {
            console.error("Failed to delete education:", error);
            setError("Failed to delete education. Please try again.");
        }
    };

    const handleAddExperience = async () => {
        if (!newExperience.company || !newExperience.role || !newExperience.start_year || !newExperience.end_year) {
            alert("All fields are required");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/me/experience`,
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
            setError("Failed to add experience. Please try again.");
        }
    };

    const handleDeleteExperience = async (expId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/experience/${expId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExperience(experience.filter((exp) => exp.id !== expId));
        } catch (error) {
            console.error("Failed to delete experience:", error);
            setError("Failed to delete experience. Please try again.");
        }
    };

    const handleChange = (e) => {
        setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(updatedUser.email)) {
            newErrors.email = "Invalid email format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/me`, updatedUser, {
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
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {loadingUser ? (
                    <div className="flex justify-center items-center">
                        <svg className="animate-spin h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span className="ml-2">Loading profile...</span>
                    </div>
                ) : user ? (
                    <div className="flex space-x-5">
                        <img src="https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif" alt="Profile" className="rounded-full w-32 h-32 object-cover border border-black" />
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
                    </div>
                ) : (
                    <p className="text-gray-600">User data not available.</p>
                )}
            </div>

            <div className="col-span-2 flex-col space-y-4">
                <div className="bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
                    <p className="font-semibold">Projects</p>
                    {loadingUser ? (
                        <div className="flex justify-center items-center">
                            <svg className="animate-spin h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            <span className="ml-2">Loading projects...</span>
                        </div>
                    ) : projects.length > 0 ? (
                        projects.map((project) => (
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
                {education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-center p-2 border-b border-gray-300 last:border-0">
                        <p>
                            {edu.institution} - {edu.degree} ({edu.start_year} - {edu.end_year})
                        </p>
                        <FontAwesomeIcon icon={faTrashAlt} className="text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleDeleteEducation(edu.id)} />
                    </div>
                ))}
                <button onClick={() => setShowEducationForm(!showEducationForm)} className="mt-2 text-sm text-green-700 font-semibold flex items-center cursor-pointer">
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Education
                </button>
                {showEducationForm && (
                    <div className="mt-2 flex flex-col space-y-2 text-sm">
                        <input type="text" placeholder="Institution" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.institution} onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })} />
                        <select className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.degree} onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}>
                            <option value="">Select Degree</option>
                            {degreeOptions.map((degree, index) => (
                                <option key={index} value={degree}>
                                    {degree}
                                </option>
                            ))}
                        </select>
                        <select className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.start_year} onChange={(e) => setNewEducation({ ...newEducation, start_year: e.target.value })}>
                            <option value="">Select Start Year</option>
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <select className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newEducation.end_year} onChange={(e) => setNewEducation({ ...newEducation, end_year: e.target.value })}>
                            <option value="">Select End Year</option>
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddEducation} className="text-white bg-green-700 font-semibold px-3 py-1 rounded-md">
                            Save
                        </button>
                    </div>
                )}

                <div className="mt-4">
                    <h4 className="font-semibold">Experience</h4>
                    {experience.map((exp) => (
                        <div key={exp.id} className="flex justify-between items-center p-2 border-b border-gray-300 last:border-0">
                            <p>
                                {exp.company} - {exp.role} ({exp.start_year} - {exp.end_year})
                            </p>
                            <FontAwesomeIcon icon={faTrashAlt} className="text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleDeleteExperience(exp.id)} />
                        </div>
                    ))}
                    <button onClick={() => setShowExperienceForm(!showExperienceForm)} className="mt-2 text-sm text-green-700 font-semibold flex items-center cursor-pointer">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Experience
                    </button>
                    {showExperienceForm && (
                        <div className="mt-2 flex flex-col space-y-2 text-sm">
                            <input type="text" placeholder="Company" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} />
                            <input type="text" placeholder="Role" className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.role} onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })} />
                            <select className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.start_year} onChange={(e) => setNewExperience({ ...newExperience, start_year: e.target.value })}>
                                <option value="">Select Start Year</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <select className="border border-gray-200 shadow-sm rounded-md px-2 py-1" value={newExperience.end_year} onChange={(e) => setNewExperience({ ...newExperience, end_year: e.target.value })}>
                                <option value="">Select End Year</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <button onClick={handleAddExperience} className="text-white bg-green-700 font-semibold px-3 py-1 rounded-md">
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="col-span-6 bg-white border border-green-700 rounded-md shadow-sm p-5 w-full hover:shadow-green-700 transition">
                <div className="flex mb-4 space-x-5 border-b border-gray-300">
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
                    <Route path="projects" element={<ProjectsSection user={user} projects={projects} loading={loadingUser} />} />
                    <Route path="skills" element={<SkillsSection setSkills={setSkills} skills={skills} loading={loadingUser} />} />
                    <Route path="actions" element={<ActionsSection setUserPosts={setUserPosts} userPosts={userPosts} loading={loadingPosts} />} />
                </Routes>
            </div>
        </div>
    );
};

export default UserProfile;
