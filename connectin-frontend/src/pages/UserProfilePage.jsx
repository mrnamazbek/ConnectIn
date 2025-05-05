import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSpinner, faEnvelope, faLocationDot, faBriefcase, faLink, faGraduationCap, faEdit, faCheck, faTimes, faTrashAlt, faPlus, faMinus, faRobot, faCopy, faFileArrowDown, faNewspaper, faThumbsUp, faBookmark, faEye, faCamera } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import axios from "axios";
import useAuthStore from "../store/authStore";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import AvatarUpload from "../components/User/AvatarUpload";

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
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
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [newEducation, setNewEducation] = useState({
        institution: "",
        degree: "",
        field_of_study: "",
        relevant_courses: "",
        start_year: "",
        end_year: "",
        description: "",
    });
    const [newExperience, setNewExperience] = useState({
        company: "",
        role: "",
        start_year: "",
        end_year: "",
        description: "",
    });
    const [errors, setErrors] = useState({});

    // AI Resume state variables
    const [loadingResume, setLoadingResume] = useState(false);
    const [resumeHtml, setResumeHtml] = useState("");
    const [errorResume, setErrorResume] = useState("");
    const [loadingPdf, setLoadingPdf] = useState(false);

    // Skills management state
    const [skills, setSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [showSkillsForm, setShowSkillsForm] = useState(false);

    // Projects and tabs
    const [activeTab, setActiveTab] = useState("projects");
    const [projects, setProjects] = useState([]);
    const [appliedProjects, setAppliedProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingAppliedProjects, setLoadingAppliedProjects] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [savedPosts, setSavedPosts] = useState([]);
    const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);

    // Add state for cover photo and loading
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    const degreeOptions = ["High School Diploma", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Other"];

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                // If no userId is provided or it matches the current user's ID, fetch the current user's profile
                if ((!userId && isAuthenticated) || (isAuthenticated && currentUser && userId == currentUser.id)) {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                        },
                    });
                    setUser(response.data);
                    console.log(response.data);
                    setUpdatedUser(response.data);
                    setSkills(response.data.skills || []);
                    setIsOwnProfile(true);

                    // Fetch additional data if it's the user's own profile
                    if (isAuthenticated) {
                        fetchAllData();
                    }
                } else if (userId) {
                    // Fetch another user's profile
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}`);
                setUser(response.data);
                    setSkills(response.data.skills || []);
                    setIsOwnProfile(false);

                    // For other user profiles, we still want to fetch their projects
                    fetchProjects(userId);
                } else {
                    // Not authenticated and no userId provided
                    navigate("/login", { state: { from: window.location.pathname } });
                    return;
                }
                setError(null);
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError("Failed to load user profile. The user may not exist or there was a network error.");
            } finally {
                setLoading(false);
            }
        };

            fetchUserProfile();
    }, [userId, navigate, isAuthenticated, currentUser]);

    const fetchAllData = async () => {
        try {
            setLoadingSkills(true);
            setLoadingProjects(true);
            setLoadingAppliedProjects(true);
            setLoadingPosts(true);
            setLoadingSavedPosts(true);

            const token = localStorage.getItem("access_token");
            if (!token) {
                navigate("/login");
                return;
            }

            const [skillsResponse, projectsResponse, appliedProjectsResponse, postsResponse, savedPostsResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/skills/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/projects/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/projects/applied`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/posts/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/users/me/saved-posts`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (skillsResponse?.data) {
                setAvailableSkills(skillsResponse.data);
            }

            if (projectsResponse?.data) {
                setProjects(projectsResponse.data);
            }

            if (appliedProjectsResponse?.data) {
                setAppliedProjects(appliedProjectsResponse.data);
            }

            if (postsResponse?.data) {
                setUserPosts(postsResponse.data);
            }

            if (savedPostsResponse?.data) {
                setSavedPosts(savedPostsResponse.data);
                console.log(savedPostsResponse.data);
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
            setLoadingSkills(false);
            setLoadingProjects(false);
            setLoadingAppliedProjects(false);
            setLoadingPosts(false);
            setLoadingSavedPosts(false);
        }
    };

    const fetchProjects = async (userId) => {
        if (!userId) return;

        setLoadingProjects(true);
        try {
            // For other users, we want to fetch their public projects
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}/projects`);
            if (response.data) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch user projects:", error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Commented out as it's not being used
    // const fetchAvailableSkills = async () => {
    //     setLoadingSkills(true);
    //     try {
    //         const token = localStorage.getItem("access_token");
    //         const response = await axios.get(`${import.meta.env.VITE_API_URL}/skills/available`, {
    //             headers: { Authorization: `Bearer ${token}` },
    //         });
    //         setAvailableSkills(response.data);
    //     } catch (error) {
    //         console.error("Failed to fetch available skills:", error);
    //         toast.error("Failed to load available skills. Please try again.");
    //     } finally {
    //         setLoadingSkills(false);
    //     }
    // };

    const handleAddSkill = async () => {
        if (!selectedSkill) {
            toast.error("Please select a skill to add");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            await axios.post(`${import.meta.env.VITE_API_URL}/users/me/skills`, null, {
                headers: { Authorization: `Bearer ${token}` },
                params: { skill_id: selectedSkill },
            });

            // Find the added skill from available skills
            const addedSkill = availableSkills.find((skill) => skill.id.toString() === selectedSkill.toString());

            if (addedSkill) {
                setSkills([...skills, addedSkill]);

                // Update user object
                setUser({
                    ...user,
                    skills: [...(user.skills || []), addedSkill],
                });

                toast.success("Skill added successfully");
                setSelectedSkill("");
            }
        } catch (error) {
            console.error("Failed to add skill:", error);
            toast.error(error.response?.data?.detail || "Failed to add skill. It might already be added.");
        }
    };

    const handleRemoveSkill = async (skillId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/skills/${skillId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Update skills state
            const updatedSkills = skills.filter((skill) => skill.id !== skillId);
            setSkills(updatedSkills);

            // Update user object
            setUser({
                ...user,
                skills: user.skills.filter((skill) => skill.id !== skillId),
            });

            toast.success("Skill removed successfully");
        } catch (error) {
            console.error("Failed to remove skill:", error);
            toast.error("Failed to remove skill. Please try again.");
        }
    };

    // Handle external links
    const handleExternalLink = (url) => {
        if (!url) return;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        window.open(url, "_blank", "noopener,noreferrer");
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
        if (!validateForm()) {
            toast.error("Please fix the validation errors before saving");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/me`, updatedUser, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUser(response.data);
            setEditMode(false);
            toast.success("Profile updated successfully");

            if (response.data.access_token) {
                localStorage.setItem("access_token", response.data.access_token);
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error("Failed to update profile. Please try again.");
        }
    };

    const handleAddEducation = async () => {
        if (!newEducation.institution || !newEducation.degree || !newEducation.start_year) {
            toast.error("Required fields are missing");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const educationData = {
                institution: newEducation.institution,
                degree: newEducation.degree,
                field_of_study: newEducation.field_of_study || null,
                relevant_courses: newEducation.relevant_courses || null,
                description: newEducation.description || null,
                start_year: new Date(newEducation.start_year).toISOString(),
                end_year: newEducation.end_year ? new Date(newEducation.end_year).toISOString() : null,
            };

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/me/education`, educationData, { headers: { Authorization: `Bearer ${token}` } });

            setUser({
                ...user,
                education: [...(user.education || []), response.data],
            });

            setNewEducation({
                institution: "",
                degree: "",
                field_of_study: "",
                relevant_courses: "",
                start_year: "",
                end_year: "",
                description: "",
            });
            setShowEducationForm(false);
            toast.success("Education added successfully");
        } catch (error) {
            console.error("Failed to add education:", error);
            toast.error(error.response?.data?.detail || "Failed to add education. Please try again.");
        }
    };

    const handleDeleteEducation = async (eduId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/education/${eduId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUser({
                ...user,
                education: user.education.filter((edu) => edu.id !== eduId),
            });

            toast.success("Education deleted successfully");
        } catch (error) {
            console.error("Failed to delete education:", error);
            toast.error("Failed to delete education. Please try again.");
        }
    };

    const handleAddExperience = async () => {
        if (!newExperience.company || !newExperience.role || !newExperience.start_year) {
            toast.error("Required fields are missing");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/me/experience`,
                {
                    ...newExperience,
                    start_year: new Date(newExperience.start_year).toISOString(),
                    end_year: newExperience.end_year ? new Date(newExperience.end_year).toISOString() : null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUser({
                ...user,
                experience: [...(user.experience || []), response.data],
            });

            setNewExperience({
                company: "",
                role: "",
                start_year: "",
                end_year: "",
                description: "",
            });
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
                headers: { Authorization: `Bearer ${token}` },
            });

            setUser({
                ...user,
                experience: user.experience.filter((exp) => exp.id !== expId),
            });

            toast.success("Experience deleted successfully");
        } catch (error) {
            console.error("Failed to delete experience:", error);
            toast.error("Failed to delete experience. Please try again.");
        }
    };

    // AI Resume generation functions
    const handleGenerateAiResume = async () => {
        setLoadingResume(true);
        setErrorResume("");
        setResumeHtml("");
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Authentication required.");
                navigate("/login");
                return;
            }

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/resume/generate-ai`, {}, { headers: { Authorization: `Bearer ${token}` } });

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

    const handleDownloadAiPdf = async () => {
        setLoadingPdf(true);
        toast.info("Generating PDF... this may take a moment.", { autoClose: 2000 });
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Authentication required.");
                navigate("/login");
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/resume/generate-pdf`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );

            if (response.headers["content-type"] !== "application/pdf") {
                const errorText = await response.data.text();
                let errorDetail = "Failed to generate PDF.";
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetail = errorJson.detail || errorDetail;
                } catch (e) {
                    console.error("Could not parse error response:", e);
                }
                throw new Error(errorDetail);
            }

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const filename = `resume_${user?.username}_ai.pdf`;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("PDF download started!");
        } catch (error) {
            console.error("Failed to download AI resume PDF:", error);
            toast.error(error.message || "Failed to download PDF. Please try again.");
        } finally {
            setLoadingPdf(false);
        }
    };

    const handleDeleteProject = async (projectId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Update projects state
            setProjects(projects.filter((project) => project.id !== projectId));
            toast.success("Project deleted successfully");
        } catch (error) {
            console.error("Failed to delete project:", error);
            toast.error("Failed to delete project. Please try again.");
        }
    };

    const handleViewProject = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const handleUnsavePost = async (postId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.post(
                `${import.meta.env.VITE_API_URL}/posts/${postId}/save`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Update saved posts state
            setSavedPosts(savedPosts.filter((post) => post.id !== postId));
            toast.success("Post unsaved successfully");
        } catch (error) {
            console.error("Failed to unsave post:", error);
            toast.error("Failed to unsave post. Please try again.");
        }
    };

    // Add a handler for viewing posts
    const handleViewPost = (postId) => {
        navigate(`/feed/post/${postId}`);
    };

    const handleDeletePost = async (postId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Update posts state
            setUserPosts(userPosts.filter((post) => post.id !== postId));
            toast.success("Post deleted successfully");
        } catch (error) {
            console.error("Failed to delete post:", error);
            toast.error("Failed to delete post. Please try again.");
        }
    };

    // Add handler for avatar update
    const handleAvatarUpdate = (avatarUrl) => {
        setUser({
            ...user,
            avatar_url: avatarUrl,
        });
    };

    // Add handler for cover photo update
    const handleCoverPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploadingCover(true);
            const token = localStorage.getItem("access_token");
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/users/me/cover-photo`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data) {
                setUser({
                    ...user,
                    cover_photo_url: response.data.cover_photo_url,
                });
                toast.success("Cover photo updated successfully");
            }
        } catch (error) {
            console.error("Failed to upload cover photo:", error);
            toast.error("Failed to update cover photo");
        } finally {
            setIsUploadingCover(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-green-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md mb-4 max-w-lg">
                    <h2 className="text-lg font-semibold mb-2">User not found</h2>
                    <p>{error}</p>
                </div>
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4 sm:mb-6">
                {/* Cover Photo - improve height responsiveness */}
                <div className="relative h-32 sm:h-48 md:h-56 bg-gradient-to-r from-green-500 to-blue-600">
                    {user.cover_photo_url && <img src={user.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />}
                    {isOwnProfile && (
                        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4">
                            <label className="cursor-pointer px-2 py-1 sm:px-3 sm:py-1.5 bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-opacity-100 dark:hover:bg-opacity-100 transition-colors flex items-center gap-1 sm:gap-2 shadow-md text-xs sm:text-sm">
                                {isUploadingCover ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCamera} />}
                                <span className="hidden xs:inline">Update Cover</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleCoverPhotoUpload} disabled={isUploadingCover} />
                            </label>
                        </div>
                    )}
                </div>

                {/* Profile Info - improve layout for mobile */}
                <div className="p-4 sm:p-6 relative">
                    {/* Move avatar to side on mobile, top on larger screens */}
                    <div className={`${editMode ? "hidden" : "absolute -top-12 sm:-top-14 left-4 sm:left-6"}`}>
                        {isOwnProfile ? (
                            <AvatarUpload user={user} onAvatarUpdate={handleAvatarUpdate} editMode={editMode} />
                        ) : (
                            <div className="border-4 border-white dark:border-gray-800 rounded-full">
                        {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover bg-white" />
                                ) : (
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faUser} className="text-gray-500 dark:text-gray-400 text-2xl sm:text-3xl" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User Name & Info - adjust top margin based on edit mode */}
                    <div className={`${editMode ? "mt-4" : "mt-20 sm:mt-24 md:mt-14"}`}>
                        {!editMode ? (
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : `@${user.username}`}</h1>

                        {(user.first_name || user.last_name) && <p className="text-gray-600 dark:text-gray-300 mb-1">@{user.username}</p>}

                                {/* Improve spacing and layout of user info for mobile */}
                                <div className="mt-2 space-y-1.5">
                        {user.position && (
                                        <p className="text-gray-700 dark:text-gray-300 flex items-center text-sm sm:text-base">
                                            <FontAwesomeIcon icon={faBriefcase} className="mr-2 text-gray-500 w-4" />
                                {user.position}
                            </p>
                        )}

                        {user.city && (
                                        <p className="text-gray-600 dark:text-gray-400 flex items-center text-sm sm:text-base">
                                            <FontAwesomeIcon icon={faLocationDot} className="mr-2 text-gray-500 w-4" />
                                {user.city}
                            </p>
                        )}

                        {user.email && (
                                        <p className="text-gray-600 dark:text-gray-400 flex items-center text-sm sm:text-base break-all">
                                            <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-500 w-4 flex-shrink-0" />
                                {user.email}
                            </p>
                        )}
                                </div>

                        {/* Status message if available */}
                        {user.status && (
                                    <div className="mt-3 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <p className="text-gray-700 dark:text-gray-300 italic text-sm sm:text-base">{user.status}</p>
                            </div>
                        )}

                                {/* Social Links - improve for mobile */}
                        {(user.github || user.linkedin || user.telegram) && (
                                    <div className="flex mt-3 space-x-2 sm:space-x-3">
                                {user.github && (
                                            <button onClick={() => handleExternalLink(user.github)} className="p-1.5 sm:p-2 text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors" aria-label="GitHub Profile">
                                                <FontAwesomeIcon icon={faGithub} className="text-lg sm:text-xl" />
                                    </button>
                                )}

                                {user.linkedin && (
                                            <button onClick={() => handleExternalLink(user.linkedin)} className="p-1.5 sm:p-2 text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors" aria-label="LinkedIn Profile">
                                                <FontAwesomeIcon icon={faLinkedin} className="text-lg sm:text-xl" />
                                    </button>
                                )}

                                {user.telegram && (
                                            <button onClick={() => handleExternalLink(user.telegram)} className="p-1.5 sm:p-2 text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors" aria-label="Telegram">
                                                <FontAwesomeIcon icon={faTelegram} className="text-lg sm:text-xl" />
                                    </button>
                                )}
                            </div>
                        )}

                                {isOwnProfile && (
                                    <button onClick={() => setEditMode(true)} className="mt-3 sm:mt-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                        <FontAwesomeIcon icon={faEdit} />
                                        Edit Profile
                                    </button>
                                )}
                    </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Move AvatarUpload controls to a visible position in edit mode */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                                    <div className="flex-shrink-0">
                                        <AvatarUpload user={user} onAvatarUpdate={handleAvatarUpdate} editMode={true} />
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        <p>Update your profile picture</p>
                </div>
            </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={updatedUser.first_name || ""}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={updatedUser.last_name || ""}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position/Title</label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={updatedUser.position || ""}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={updatedUser.city || ""}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={updatedUser.email || ""}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub URL</label>
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn URL</label>
                                        <input
                                            type="url"
                                            name="linkedin"
                                            value={updatedUser.linkedin || ""}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram</label>
                                        <input
                                            type="text"
                                            name="telegram"
                                            value={updatedUser.telegram?.replace("https://t.me/", "") || ""}
                                            onChange={handleChange}
                                            placeholder="username"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter your Telegram username without @ or https://</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                    <button onClick={handleSave} className="px-4 py-2 cursor-pointer bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors flex items-center justify-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faCheck} />
                                        Save Changes
                                    </button>
                                    <button onClick={() => setEditMode(false)} className="px-4 py-2 cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faTimes} />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Resume Generator - improve spacing and responsiveness */}
            {isOwnProfile && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 md:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <FontAwesomeIcon icon={faRobot} className="text-green-600 dark:text-green-400 text-lg sm:text-xl" />
                            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">AI Resume Generator</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-5 text-xs sm:text-sm">
                            Create a professional resume based on your profile data using AI. The result will be in English.
                            <br />
                            <span className="text-xs opacity-70 italic">(Tip: The more complete your Experience and Education sections are, the better the result.)</span>
                        </p>
                        {/* Button size adjustment */}
                        <button
                            onClick={handleGenerateAiResume}
                            disabled={loadingResume}
                            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-green-700 text-white font-semibold cursor-pointer rounded-lg shadow-md hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm sm:text-base"
                        >
                            {loadingResume ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Generating...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faRobot} className="mr-2" /> Generate with AI
                                </>
                            )}
                        </button>

                        <AnimatePresence>
                            {loadingResume && (
                                <motion.div key="loading-ai" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 text-center p-4" aria-live="polite">
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-green-500" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Generating your resume...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {errorResume && !loadingResume && (
                                <motion.div key="error-ai" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 p-4 bg-red-100 text-red-800 border border-red-300 rounded dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" role="alert">
                                    <p>
                                        <strong>Error:</strong> {errorResume}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {resumeHtml && !errorResume && !loadingResume && (
                                <motion.div key="resume-ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 border rounded-md p-3 sm:p-5 dark:border-gray-600 max-w-none bg-gray-50 dark:bg-gray-900/50" aria-live="polite">
                                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white border-b pb-2 dark:border-gray-700">Generated AI Resume:</h3>

                                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: resumeHtml }} />

                                    <div className="mt-5 pt-4 border-t dark:border-gray-700 flex flex-wrap gap-2 sm:gap-3">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(resumeHtml);
                                                toast.info("HTML copied!");
                                            }}
                                            className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center gap-1.5 shadow-sm"
                                        >
                                            <FontAwesomeIcon icon={faCopy} /> Copy HTML
                                        </button>
                                        <a
                                            href={`data:text/html;charset=utf-8,${encodeURIComponent(
                                                `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>AI Resume ${user?.username}</title><style>/* Basic styles for downloaded file */ body { font-family: sans-serif; line-height: 1.5; padding: 1em;} h2 { margin-top: 1.5em; border-bottom: 1px solid #eee; } ul { padding-left: 1.5em; list-style: disc;} </style></head><body><h1>Resume for ${user?.username}</h1>${resumeHtml}</body></html>`
                                            )}`}
                                            download={`resume_${user?.username}_ai.html`}
                                            className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs border border-blue-600 dark:border-blue-500 rounded bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center gap-1.5 shadow-sm"
                                        >
                                            <FontAwesomeIcon icon={faFileArrowDown} /> Download HTML
                                        </a>
                                        <button
                                            onClick={handleDownloadAiPdf}
                                            disabled={loadingPdf || loadingResume}
                                            className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs border border-red-600 dark:border-red-500 rounded bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loadingPdf ? <FontAwesomeIcon icon={faSpinner} spin className="mr-1.5" /> : <FontAwesomeIcon icon={faFileArrowDown} className="mr-1" />}
                                            Download PDF
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Main content grid - improve responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Column: Skills, Education and Experience */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Skills */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Skills</h2>
                            {isOwnProfile && (
                                <button onClick={() => setShowSkillsForm(!showSkillsForm)} className="text-green-700 cursor-pointer dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors">
                                    <FontAwesomeIcon icon={showSkillsForm ? faMinus : faPlus} />
                                </button>
                            )}
                        </div>

                        {skills && skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill) => (
                                    <div key={skill.id} className="relative px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm group">
                                        {skill.name}
                                        {isOwnProfile && (
                                            <button onClick={() => handleRemoveSkill(skill.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">No skills added yet</p>
                        )}

                        <AnimatePresence>
                            {showSkillsForm && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-3">
                                    {loadingSkills ? (
                                        <div className="flex justify-center py-4">
                                            <FontAwesomeIcon icon={faSpinner} spin className="text-green-500" />
                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <select
                                                    value={selectedSkill}
                                                    onChange={(e) => setSelectedSkill(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                >
                                                    <option value="">Select a skill to add</option>
                                                    {availableSkills
                                                        .filter((skill) => !skills.some((userSkill) => userSkill.id === skill.id))
                                                        .map((skill) => (
                                                            <option key={skill.id} value={skill.id}>
                                                                {skill.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                            <button onClick={handleAddSkill} disabled={!selectedSkill} className={`w-full px-4 py-2 rounded-lg text-white transition-colors ${selectedSkill ? "bg-green-700 hover:bg-green-600 cursor-pointer" : "bg-gray-400 cursor-not-allowed"}`}>
                                                Add Skill
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Education */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                <FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-gray-600 dark:text-gray-400" />
                                Education
                            </h2>
                            {isOwnProfile && (
                                <button onClick={() => setShowEducationForm(!showEducationForm)} className="text-green-700 cursor-pointer dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors">
                                    <FontAwesomeIcon icon={showEducationForm ? faMinus : faPlus} />
                                </button>
                            )}
                        </div>

                        {user.education && user.education.length > 0 ? (
                            <div className="space-y-4">
                                {user.education.map((edu) => (
                                    <div key={edu.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0 relative">
                                        <h3 className="font-medium text-gray-800 dark:text-white">{edu.institution}</h3>
                                        <p className="text-gray-600 dark:text-gray-400">{edu.degree}</p>
                                        {edu.field_of_study && <p className="text-gray-600 dark:text-gray-400">{edu.field_of_study}</p>}
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(edu.start_year).toLocaleDateString()} - {edu.end_year ? new Date(edu.end_year).toLocaleDateString() : "Present"}
                                        </p>
                                        {isOwnProfile && (
                                            <button onClick={() => handleDeleteEducation(edu.id)} className="absolute top-0 right-0 text-red-500 cursor-pointer dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">No education information available</p>
                        )}

                        <AnimatePresence>
                            {showEducationForm && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Institution"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        value={newEducation.institution}
                                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                                    />
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={newEducation.degree}
                                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                                    >
                                        <option value="">Select Degree</option>
                                        {degreeOptions.map((degree, index) => (
                                            <option key={index} value={degree}>
                                                {degree}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Field of Study"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        value={newEducation.field_of_study}
                                        onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Relevant Courses"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        value={newEducation.relevant_courses}
                                        onChange={(e) => setNewEducation({ ...newEducation, relevant_courses: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={newEducation.start_year}
                                            onChange={(e) => setNewEducation({ ...newEducation, start_year: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={newEducation.end_year}
                                            onChange={(e) => setNewEducation({ ...newEducation, end_year: e.target.value })}
                                        />
                        </div>
                                    <textarea
                                        placeholder="Description"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        value={newEducation.description}
                                        onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
                                    />
                                    <button onClick={handleAddEducation} className="w-full cursor-pointer px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors">
                                        Add Education
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                </div>

                    {/* Experience */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                <FontAwesomeIcon icon={faBriefcase} className="mr-2 text-gray-600 dark:text-gray-400" />
                                Experience
                            </h2>
                            {isOwnProfile && (
                                <button onClick={() => setShowExperienceForm(!showExperienceForm)} className="text-green-700 cursor-pointer dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors">
                                    <FontAwesomeIcon icon={showExperienceForm ? faMinus : faPlus} />
                                </button>
                            )}
                        </div>

                        {user.experience && user.experience.length > 0 ? (
                            <div className="space-y-4">
                                {user.experience.map((exp) => (
                                    <div key={exp.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0 relative">
                                        <h3 className="font-medium text-gray-800 dark:text-white">{exp.company}</h3>
                                        <p className="text-gray-600 dark:text-gray-400">{exp.role}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500">
                                            {new Date(exp.start_year).toLocaleDateString()} - {exp.end_year ? new Date(exp.end_year).toLocaleDateString() : "Present"}
                                        </p>
                                        {exp.description && <p className="mt-2 text-gray-700 dark:text-gray-300">{exp.description}</p>}
                                        {isOwnProfile && (
                                            <button onClick={() => handleDeleteExperience(exp.id)} className="absolute top-0 right-0 text-red-500 cursor-pointer dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">No experience information available</p>
                        )}

                        <AnimatePresence>
                            {showExperienceForm && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Company"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        value={newExperience.company}
                                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Role"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        value={newExperience.role}
                                        onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Description"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        value={newExperience.description}
                                        onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={newExperience.start_year}
                                            onChange={(e) => setNewExperience({ ...newExperience, start_year: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={newExperience.end_year}
                                            onChange={(e) => setNewExperience({ ...newExperience, end_year: e.target.value })}
                                        />
                        </div>
                                    <button onClick={handleAddExperience} className="w-full cursor-pointer px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-colors">
                                        Add Experience
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Projects and tabs */}
                <div className="space-y-4 sm:space-y-6 lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-3 sm:p-4 md:p-6">
                            {/* Improve tabs for mobile */}
                            <div className="flex flex-wrap gap-1 sm:gap-2 md:gap-4 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto pb-1 sm:pb-0">
                                <button
                                    onClick={() => handleTabChange("projects")}
                                    className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                        activeTab === "projects" ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faLink} className="mr-1 sm:mr-2" />
                                Projects
                                </button>

                                {isOwnProfile && (
                                    <>
                                        <button
                                            onClick={() => handleTabChange("applied")}
                                            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                                activeTab === "applied" ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faThumbsUp} className="mr-1 sm:mr-2" />
                                            <span>Applied</span> Projects
                                        </button>

                                        <button
                                            onClick={() => handleTabChange("news")}
                                            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                                activeTab === "news" ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faNewspaper} className="mr-1 sm:mr-2" />
                                            News
                                        </button>

                                        <button
                                            onClick={() => handleTabChange("saved")}
                                            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                                activeTab === "saved" ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400"
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faBookmark} className="mr-1 sm:mr-2" />
                                            Saved
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Tab content with responsive padding and spacing */}
                            <AnimatePresence mode="wait">
                                {/* Projects Tab */}
                                {activeTab === "projects" && (
                                    <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {loadingProjects ? (
                                            <div className="flex justify-center py-10">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-green-500 text-xl" />
                                            </div>
                                        ) : projects && projects.length > 0 ? (
                            <div className="space-y-4">
                                                {projects.map((project) => (
                                                    <div key={project.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-1 mb-1">
                                        <h3 className="font-medium text-gray-800 dark:text-white">{project.name}</h3>
                                                            {project.owner && !isOwnProfile && (
                                                                <span 
                                                                    onClick={() => navigate(`/profile/${project.owner.id}`)} 
                                                                    className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap cursor-pointer hover:underline"
                                                                >
                                                                    @{project.owner.username || "Unknown"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {project.description && <p className="mt-1 text-gray-600 dark:text-gray-400 line-clamp-3" dangerouslySetInnerHTML={{ __html: project.description }}></p>}
                                                        <div className="mt-2 flex space-x-2">
                                                            <button onClick={() => handleViewProject(project.id)} className="px-2 py-1 cursor-pointer text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                                                <FontAwesomeIcon icon={faEye} className="mr-1" /> View
                                                            </button>
                                                            {isOwnProfile && (
                                                                <button onClick={() => handleDeleteProject(project.id)} className="px-2 py-1 cursor-pointer text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                                                                    <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                    </div>
                                ))}
                            </div>
                                        ) : (
                                            <p className="text-center py-6 text-gray-500 dark:text-gray-400">No projects found</p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Applied Projects Tab - Only shown for own profile */}
                                {activeTab === "applied" && isOwnProfile && (
                                    <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {loadingAppliedProjects ? (
                                            <div className="flex justify-center py-10">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-green-500 text-xl" />
                        </div>
                                        ) : appliedProjects && appliedProjects.length > 0 ? (
                                            <div className="space-y-4">
                                                {appliedProjects.map((project) => (
                                                    <div key={project.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-1 mb-1">
                                                            <h3 className="font-medium text-gray-800 dark:text-white">{project.name}</h3>
                                                            {project.owner && (
                                                                <span 
                                                                    onClick={() => navigate(`/profile/${project.owner.id}`)} 
                                                                    className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap cursor-pointer hover:underline"
                                                                >
                                                                    @{project.owner.username || "Unknown"}
                                                                </span>
                    )}
                </div>
                                                        {project.description && <p className="mt-1 text-gray-600 dark:text-gray-400 line-clamp-3" dangerouslySetInnerHTML={{ __html: project.description }}></p>}
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            Application status: <span className="font-medium text-green-600 dark:text-green-400">{project.status || "Pending"}</span>
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-6 text-gray-500 dark:text-gray-400">You haven&apos;t applied to any projects yet</p>
                                        )}
                                    </motion.div>
                                )}

                                {/* News/Actions Tab - Only shown for own profile */}
                                {activeTab === "news" && isOwnProfile && (
                                    <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {loadingPosts ? (
                                            <div className="flex justify-center py-10">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-green-500 text-xl" />
                                            </div>
                                        ) : userPosts && userPosts.length > 0 ? (
                                            <div className="space-y-4">
                                                {userPosts.map((post) => (
                                                    <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-1 mb-1">
                                                            <h3 className="font-medium text-gray-800 dark:text-white">{post.title}</h3>
                                                            {post.author && (
                                                                <span 
                                                                    onClick={() => navigate(`/profile/${post.author.id}`)} 
                                                                    className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap cursor-pointer hover:underline"
                                                                >
                                                                    @{post.author.username || "Unknown"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-gray-600 dark:text-gray-400 line-clamp-3" dangerouslySetInnerHTML={{ __html: post.content }}></p>
                                                        <div className="mt-2 flex space-x-2">
                                                            <button onClick={() => handleViewPost(post.id)} className="px-2 py-1 cursor-pointer text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                                                <FontAwesomeIcon icon={faEye} className="mr-1" /> View
                                                            </button>
                                                            <button onClick={() => handleDeletePost(post.id)} className="px-2 py-1 cursor-pointer text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                                                                <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-6 text-gray-500 dark:text-gray-400">You haven&apos;t published any posts yet</p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Saved Posts Tab - Only shown for own profile */}
                                {activeTab === "saved" && isOwnProfile && (
                                    <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {loadingSavedPosts ? (
                                            <div className="flex justify-center py-8 sm:py-10">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-green-500 text-xl" />
                                            </div>
                                        ) : savedPosts && savedPosts.length > 0 ? (
                                            <div className="space-y-3 sm:space-y-4">
                                                {savedPosts.map((post) => (
                                                    <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-1">
                                                            <h3 className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">{post.title}</h3>
                                                            {post.author && (
                                                                <span 
                                                                    onClick={() => navigate(`/profile/${post.author.id}`)} 
                                                                    className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap cursor-pointer hover:underline"
                                                                >
                                                                    @{post.author.username || "Unknown"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 text-sm" dangerouslySetInnerHTML={{ __html: post.content }}></p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <div className="flex space-x-2">
                                                                <button onClick={() => handleViewPost(post.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                                                    <FontAwesomeIcon icon={faEye} className="mr-1" /> View
                                                                </button>
                                                                <button onClick={() => handleUnsavePost(post.id)} className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                                                                    <FontAwesomeIcon icon={faBookmark} className="mr-1" /> Unsave
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm sm:text-base">You haven&apos;t saved any posts yet</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
