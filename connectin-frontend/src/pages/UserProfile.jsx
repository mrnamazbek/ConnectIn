import {useEffect, useState} from "react";
import axios from "axios";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrashAlt, faEdit, faSpinner, faRobot} from "@fortawesome/free-regular-svg-icons";
import {
    faPlus,
    faUser,
    faGraduationCap,
    faBriefcase,
    faCode,
    faCheck,
    faTimes
} from "@fortawesome/free-solid-svg-icons";
import {faGithub, faLinkedin, faTelegram} from "@fortawesome/free-brands-svg-icons";
import {Routes, Route, NavLink, Navigate, useNavigate} from "react-router";
import {toast} from "react-toastify";
import ProjectsSection from "./ProjectsSection";
import SkillsSection from "./SkillsSection";
import ActionsSection from "./ActionsSection";
import SavedPostsSection from "./SavedPostsSection";
import {motion, AnimatePresence} from "framer-motion";
import AvatarUpload from "../components/User/AvatarUpload";

const UserProfile = () => {
    const navigate = useNavigate();

    //Resume Generator consts
    const [loadingResume, setLoadingResume] = useState(false); // Загрузка AI резюме
    const [resumeHtml, setResumeHtml] = useState(''); // Сгенерированный HTML резюме
    const [errorResume, setErrorResume] = useState(''); // Ошибка генерации резюме

    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [projects, setProjects] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [education, setEducation] = useState([]);
    const [experience, setExperience] = useState([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [newEducation, setNewEducation] = useState({institution: "", degree: "", start_year: "", end_year: ""});
    const [newExperience, setNewExperience] = useState({company: "", role: "", start_year: "", end_year: ""});
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
    const [savedPosts, setSavedPosts] = useState([]);
    const [loadingSavedPosts, setLoadingSavedPosts] = useState(true);

    const degreeOptions = ["High School Diploma", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Other"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 50}, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoadingUser(true);
                setLoadingPosts(true);
                setLoadingSavedPosts(true);

                const token = localStorage.getItem("access_token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                // Fetch all data in parallel
                const [userResponse, postsResponse, skillsResponse, savedPostsResponse] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                        headers: {Authorization: `Bearer ${token}`},
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/posts/my`, {
                        headers: {Authorization: `Bearer ${token}`},
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/skills/`, {
                        headers: {Authorization: `Bearer ${token}`},
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/users/me/saved-posts`, {
                        headers: {Authorization: `Bearer ${token}`},
                    }),
                ]);

                // Update all state at once
                if (userResponse?.data) {
                    setUser(userResponse.data);
                    setUpdatedUser(userResponse.data);
                    setSkills(userResponse.data.skills || []);
                    setEducation(userResponse.data.education || []);
                    setExperience(userResponse.data.experience || []);
                }

                if (postsResponse?.data) {
                    setUserPosts(postsResponse.data);
                }

                if (savedPostsResponse?.data) {
                    setSavedPosts(savedPostsResponse.data);
                }

                if (skillsResponse?.data) {
                    setAvailableSkills(skillsResponse.data);
                }

                // Fetch projects separately
                const projectsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/projects/my`, {
                    headers: {Authorization: `Bearer ${token}`},
                });

                if (projectsResponse?.data) {
                    setProjects(projectsResponse.data);
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    navigate("/login");
                } else {
                    console.error("Failed to fetch data", error);
                    toast.error("Failed to load data. Please try again later.");
                }
            } finally {
                setLoadingUser(false);
                setLoadingPosts(false);
                setLoadingSavedPosts(false);
            }
        };

        fetchAllData();
    }, [navigate]);

    //Resume Generator function

    const handleGenerateAiResume = async () => {
        setLoadingResume(true);
        setErrorResume('');
        setResumeHtml(''); // Очищаем предыдущий результат
        try {
            // Получаем токен (убедитесь, что он действителен)
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error("Authentication required.");
                navigate("/login"); // Перенаправляем на логин, если токена нет
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/resumes/generate-ai`,
                {}, // Тело запроса пустое, т.к. ID пользователя берется из токена на бэкенде
                {headers: {Authorization: `Bearer ${token}`}}
            );

            if (response.data && response.data.resume_html) {
                setResumeHtml(response.data.resume_html);
                toast.success("AI Resume generated successfully!");
            } else {
                throw new Error("Received invalid response from server.");
            }
        } catch (error) {
            console.error("Failed to generate AI resume:", error.response?.data || error.message);
            const message = error.response?.data?.detail || "Failed to generate AI resume. Please try again.";
            setErrorResume(message);
            toast.error(message);
        } finally {
            setLoadingResume(false);
        }
    };

    //end Resume Generator function

    const handleAddEducation = async () => {
        if (!newEducation.institution || !newEducation.degree || !newEducation.start_year || !newEducation.end_year) {
            toast.error("All fields are required");
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
                {headers: {Authorization: `Bearer ${token}`}}
            );

            setEducation([...education, response.data]);
            setNewEducation({institution: "", degree: "", start_year: "", end_year: ""});
            setShowEducationForm(false);
            toast.success("Education added successfully");
        } catch (error) {
            console.error("Failed to add education:", error);
            toast.error("Failed to add education. Please try again.");
        }
    };

    const handleDeleteEducation = async (eduId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/education/${eduId}`, {
                headers: {Authorization: `Bearer ${token}`},
            });

            setEducation(education.filter((edu) => edu.id !== eduId));
            toast.success("Education deleted successfully");
        } catch (error) {
            console.error("Failed to delete education:", error);
            toast.error("Failed to delete education. Please try again.");
        }
    };

    const handleAddExperience = async () => {
        if (!newExperience.company || !newExperience.role || !newExperience.start_year || !newExperience.end_year) {
            toast.error("All fields are required");
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
                {headers: {Authorization: `Bearer ${token}`}}
            );

            setExperience([...experience, response.data]);
            setNewExperience({company: "", role: "", start_year: "", end_year: ""});
            setShowExperienceForm(false);
            toast.success("Experience added successfully");
        } catch (error) {
            console.error("Failed to add experience:", error);
            toast.error("Failed to add experience. Please try again.");
        }
    };

    const handleDeleteExperience = async (expId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/experience/${expId}`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            setExperience(experience.filter((exp) => exp.id !== expId));
            toast.success("Experience deleted successfully");
        } catch (error) {
            console.error("Failed to delete experience:", error);
            toast.error("Failed to delete experience. Please try again.");
        }
    };

    const handleChange = (e) => {
        setUpdatedUser({...updatedUser, [e.target.name]: e.target.value});
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
        if (!validateForm()) {
            toast.error("Please fix the validation errors before saving");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/me`, updatedUser, {
                headers: {Authorization: `Bearer ${token}`},
            });

            setUser(response.data);
            setEditMode(false);
            toast.success("Profile updated successfully");

            // If a new token was sent, update it in localStorage
            if (response.data.access_token) {
                localStorage.setItem("access_token", response.data.access_token);
                console.log("Updated authentication token");
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error("Failed to update profile. Please try again.");
        }
    };

    const handleAvatarUpdate = (newAvatarUrl) => {
        setUser(prev => ({...prev, avatar_url: newAvatarUrl}));
    };

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
                {/* Main Profile Card */}
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                            className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                        {loadingUser ? (
                            <div className="flex justify-center items-center py-12">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 dark:border-green-500"></div>
                            </div>
                        ) : user ? (
                            <div className="space-y-6">
                                {/* Profile Header */}
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Profile Image */}
                                    <motion.div whileHover={{scale: 1.05}} className="relative flex-shrink-0">
                                        <AvatarUpload user={user} onAvatarUpdate={handleAvatarUpdate}/>
                                    </motion.div>

                                    {/* Profile Info */}
                                    <div className="flex-1 min-w-0">
                                        {!editMode ? (
                                            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                                                        className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white truncate">
                                                        {user.first_name} {user.last_name}
                                                    </h1>
                                                    <span
                                                        className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full whitespace-nowrap">{user.username}</span>
                                                </div>

                                                <div
                                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <FontAwesomeIcon icon={faUser}
                                                                     className="text-green-700 dark:text-green-400 flex-shrink-0"/>
                                                    <span
                                                        className="truncate">{user.position || "Role not specified"}</span>
                                                </div>

                                                <div
                                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <FontAwesomeIcon icon={faCode}
                                                                     className="text-green-700 dark:text-green-400 flex-shrink-0"/>
                                                    <span
                                                        className="truncate">{user.city || "Location not specified"}</span>
                                                </div>

                                                <a href={`mailto:${user.email}`}
                                                   className="flex items-center gap-2 text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors">
                                                    <FontAwesomeIcon icon={faUser} className="flex-shrink-0"/>
                                                    <span className="truncate">{user.email}</span>
                                                </a>

                                                {/* Social Links */}
                                                <div className="flex gap-4 pt-2">
                                                    {user.github && (
                                                        <motion.a whileHover={{scale: 1.1}} href={user.github}
                                                                  target="_blank" rel="noopener noreferrer"
                                                                  className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                                                            <FontAwesomeIcon icon={faGithub} size="lg"/>
                                                        </motion.a>
                                                    )}
                                                    {user.linkedin && (
                                                        <motion.a whileHover={{scale: 1.1}} href={user.linkedin}
                                                                  target="_blank" rel="noopener noreferrer"
                                                                  className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                                                            <FontAwesomeIcon icon={faLinkedin} size="lg"/>
                                                        </motion.a>
                                                    )}
                                                    {user.telegram && (
                                                        <motion.a
                                                            whileHover={{scale: 1.1}}
                                                            href={user.telegram.startsWith("http") ? user.telegram : `https://t.me/${user.telegram}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                                                        >
                                                            <FontAwesomeIcon icon={faTelegram} size="lg"/>
                                                        </motion.a>
                                                    )}
                                                </div>

                                                <motion.button
                                                    whileHover={{scale: 1.02}}
                                                    whileTap={{scale: 0.98}}
                                                    onClick={() => setEditMode(true)}
                                                    className="mt-4 px-4 py-2 cursor-pointer bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors flex items-center gap-2"
                                                >
                                                    <FontAwesomeIcon icon={faEdit}/>
                                                    Edit Profile
                                                </motion.button>
                                            </motion.div>
                                        ) : (
                                            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                                                        className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First
                                                            Name</label>
                                                        <input
                                                            type="text"
                                                            name="first_name"
                                                            value={updatedUser.first_name || ""}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last
                                                            Name</label>
                                                        <input
                                                            type="text"
                                                            name="last_name"
                                                            value={updatedUser.last_name || ""}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position/Title</label>
                                                        <input
                                                            type="text"
                                                            name="position"
                                                            value={updatedUser.position || ""}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                                        <input
                                                            type="text"
                                                            name="city"
                                                            value={updatedUser.city || ""}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={updatedUser.email || ""}
                                                            onChange={handleChange}
                                                            className={`w-full px-3 py-2 border ${
                                                                errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                                                            } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                                        />
                                                        {errors.email &&
                                                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub
                                                            URL</label>
                                                        <input
                                                            type="url"
                                                            name="github"
                                                            value={updatedUser.github || ""}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            placeholder="https://github.com/username"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn
                                                            URL</label>
                                                        <input
                                                            type="url"
                                                            name="linkedin"
                                                            value={updatedUser.linkedin || ""}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            placeholder="https://linkedin.com/in/username"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram
                                                            Username</label>
                                                        <input
                                                            type="text"
                                                            name="telegram"
                                                            value={updatedUser.telegram || ""}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            placeholder="@username or URL"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-4">
                                                    <motion.button
                                                        whileHover={{scale: 1.02}}
                                                        whileTap={{scale: 0.98}}
                                                        onClick={handleSave}
                                                        className="px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors flex items-center gap-2"
                                                    >
                                                        <FontAwesomeIcon icon={faCheck}/>
                                                        Save Changes
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{scale: 1.02}}
                                                        whileTap={{scale: 0.98}}
                                                        onClick={() => setEditMode(false)}
                                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                                                    >
                                                        <FontAwesomeIcon icon={faTimes}/>
                                                        Cancel
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-center py-8">User data not
                                available.</p>
                        )}
                    </div>
                </motion.div>

                {/* Education and Experience Card */}
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                            className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                        {/* Education Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faGraduationCap}
                                                     className="text-green-700 dark:text-green-400"/>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Education</h2>
                                </div>
                                <motion.button whileHover={{scale: 1.1}}
                                               onClick={() => setShowEducationForm(!showEducationForm)}
                                               className="text-green-700 cursor-pointer dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors">
                                    <FontAwesomeIcon icon={faPlus}/>
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                {education.map((edu) => (
                                    <motion.div key={edu.id} whileHover={{scale: 1.02}}
                                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-gray-800 dark:text-white truncate">{edu.institution}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{edu.degree}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {edu.start_year} - {edu.end_year}
                                                </p>
                                            </div>
                                            <motion.button whileHover={{scale: 1.1}}
                                                           onClick={() => handleDeleteEducation(edu.id)}
                                                           className="text-red-500 cursor-pointer dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex-shrink-0 ml-2">
                                                <FontAwesomeIcon icon={faTrashAlt}/>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <AnimatePresence>
                                {showEducationForm && (
                                    <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}}
                                                exit={{opacity: 0, height: 0}} className="mt-4 space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Institution"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                            value={newEducation.institution}
                                            onChange={(e) => setNewEducation({
                                                ...newEducation,
                                                institution: e.target.value
                                            })}
                                        />
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={newEducation.degree}
                                            onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                                        >
                                            <option value="">Select Degree</option>
                                            {degreeOptions.map((degree, index) => (
                                                <option key={index} value={degree}>
                                                    {degree}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={newEducation.start_year}
                                                onChange={(e) => setNewEducation({
                                                    ...newEducation,
                                                    start_year: e.target.value
                                                })}
                                            >
                                                <option value="">Start Year</option>
                                                {years.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={newEducation.end_year}
                                                onChange={(e) => setNewEducation({
                                                    ...newEducation,
                                                    end_year: e.target.value
                                                })}
                                            >
                                                <option value="">End Year</option>
                                                {years.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <motion.button whileHover={{scale: 1.02}} whileTap={{scale: 0.98}}
                                                       onClick={handleAddEducation}
                                                       className="w-full cursor-pointer px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors">
                                            Add Education
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Experience Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBriefcase} className="text-green-700 dark:text-green-400"/>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Experience</h2>
                                </div>
                                <motion.button whileHover={{scale: 1.1}}
                                               onClick={() => setShowExperienceForm(!showExperienceForm)}
                                               className="text-green-700 cursor-pointer dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors">
                                    <FontAwesomeIcon icon={faPlus}/>
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                {experience.map((exp) => (
                                    <motion.div key={exp.id} whileHover={{scale: 1.02}}
                                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-gray-800 dark:text-white truncate">{exp.company}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{exp.role}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {exp.start_year} - {exp.end_year}
                                                </p>
                                            </div>
                                            <motion.button whileHover={{scale: 1.1}}
                                                           onClick={() => handleDeleteExperience(exp.id)}
                                                           className="text-red-500 cursor-pointer dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex-shrink-0 ml-2">
                                                <FontAwesomeIcon icon={faTrashAlt}/>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <AnimatePresence>
                                {showExperienceForm && (
                                    <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}}
                                                exit={{opacity: 0, height: 0}} className="mt-4 space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Company"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                            value={newExperience.company}
                                            onChange={(e) => setNewExperience({
                                                ...newExperience,
                                                company: e.target.value
                                            })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Role"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                            value={newExperience.role}
                                            onChange={(e) => setNewExperience({...newExperience, role: e.target.value})}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={newExperience.start_year}
                                                onChange={(e) => setNewExperience({
                                                    ...newExperience,
                                                    start_year: e.target.value
                                                })}
                                            >
                                                <option value="">Start Year</option>
                                                {years.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={newExperience.end_year}
                                                onChange={(e) => setNewExperience({
                                                    ...newExperience,
                                                    end_year: e.target.value
                                                })}
                                            >
                                                <option value="">End Year</option>
                                                {years.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <motion.button whileHover={{scale: 1.02}} whileTap={{scale: 0.98}}
                                                       onClick={handleAddExperience}
                                                       className="w-full cursor-pointer px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors">
                                            Add Experience
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* === Начало Секции Генерации AI Резюме === */}
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.2}} // Небольшая задержка для красивого появления
                    className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-purple-400 dark:border-purple-600 overflow-hidden hover:shadow-xl transition-all duration-300" // Фиолетовая рамка для отличия
                >
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FontAwesomeIcon icon={faRobot} className="text-purple-600 dark:text-purple-400 text-xl"/>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">AI Resume Generator</h2>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                            Создайте профессиональное резюме на основе данных вашего профиля с помощью AI.
                            <br/>
                            <span className="text-xs italic">(Совет: Чем полнее заполнены разделы Опыт и Образование (включая описания, если вы их добавите), тем лучше будет результат!)</span>
                        </p>

                        <button
                            onClick={handleGenerateAiResume}
                            disabled={loadingResume}
                            className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loadingResume ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> Generating...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faRobot} className="mr-2"/> Generate with AI
                                </>
                            )}
                        </button>

                        {/* Область для отображения результата */}
                        <AnimatePresence>
                            {loadingResume && (
                                <motion.div
                                    key="loading"
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className="mt-4 text-center"
                                >
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-purple-500"/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {errorResume && !loadingResume && (
                                <motion.div
                                    key="error"
                                    initial={{opacity: 0, y: -10}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0}}
                                    className="mt-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                                >
                                    <p><strong>Ошибка:</strong> {errorResume}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {resumeHtml && !errorResume && !loadingResume && (
                                <motion.div
                                    key="resume"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    className="mt-6 border rounded-md p-4 dark:border-gray-600 prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-700" // Добавил фон для читаемости
                                >
                                    <h3 className="text-lg font-semibold mb-3 dark:text-white">Сгенерированное
                                        Резюме:</h3>
                                    {/* Отображаем HTML. ВАЖНО: Осторожно с XSS! */}
                                    <div dangerouslySetInnerHTML={{__html: resumeHtml}}/>

                                    {/* Кнопки Копировать/Скачать */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(resumeHtml)
                                                toast.info("HTML скопирован в буфер обмена");
                                            }}
                                            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                                        >
                                            Копировать HTML
                                        </button>
                                        <a
                                            href={`data:text/html;charset=utf-8,${encodeURIComponent(
                                                // Оборачиваем в базовый HTML для корректного отображения при скачивании
                                                `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI Resume</title></head><body>${resumeHtml}</body></html>`
                                            )}`}
                                            download={`resume_${user?.username}_ai.html`} // Используем ? для безопасности, если user еще не загружен
                                            className="px-3 py-1 text-xs bg-blue-200 dark:bg-blue-800 rounded hover:bg-blue-300 dark:hover:bg-blue-700 transition"
                                        >
                                            Скачать HTML
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </motion.div>

                {/* Main Content Area */}
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}}
                            className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                        <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700 mb-6">
                            <NavLink
                                to="/profile/projects"
                                className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"}`}
                            >
                                Projects
                            </NavLink>
                            <NavLink
                                to="/profile/skills"
                                className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"}`}
                            >
                                Skills
                            </NavLink>
                            <NavLink
                                to="/profile/actions"
                                className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"}`}
                            >
                                News
                            </NavLink>
                            <NavLink
                                to="/profile/saved"
                                className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"}`}
                            >
                                Saved
                            </NavLink>
                        </div>

                        <Routes>
                            <Route index element={<Navigate to="projects"/>}/>
                            <Route path="projects"
                                   element={<ProjectsSection user={user} projects={projects} loading={loadingUser}
                                                             isStatic={true}/>}/>
                            <Route path="skills" element={<SkillsSection setSkills={setSkills} skills={skills}
                                                                         availableSkills={availableSkills}
                                                                         loading={loadingUser} isStatic={true}/>}/>
                            <Route path="actions"
                                   element={<ActionsSection user={user} posts={userPosts} loading={loadingPosts}
                                                            isStatic={true}/>}/>
                            <Route path="saved"
                                   element={<SavedPostsSection posts={savedPosts} loading={loadingSavedPosts}
                                                               isStatic={true}/>}/>
                        </Routes>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UserProfile;
