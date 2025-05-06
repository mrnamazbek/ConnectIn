import { useState, useEffect } from "react";
import { useParams } from "react-router";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserMinus, faCheck, faTimes, faUsers, faTag, faComment, faClock, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import ProjectTaskBoard from "../components/ProjectTaskBoard";
import { toast } from "react-toastify";

const ProjectProfile = () => {
    const { projectId } = useParams();
    const [projectDetails, setProjectDetails] = useState(null);
    const [members, setMembers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [isMember, setIsMember] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const user = await fetchCurrentUser();
                if (user) {
                    await fetchProjectProfile(user);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch current user:", error);
            return null;
        }
    };

    const fetchProjectProfile = async (user) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${projectId}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;
            setProjectDetails(data.project);
            setMembers(data.members);
            setApplications(data.applications || []);
            setComments(data.comments);
            setIsOwner(user && data.project.owner?.id === user.id);
            setIsMember(data.members.some((member) => member.id === user?.id) || (user && data.project.owner?.id === user.id));
        } catch (error) {
            console.error("Failed to fetch project profile:", error);
        }
    };

    const handleApprove = async (applicantId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.post(`${import.meta.env.VITE_API_URL}/projects/${projectId}/applications/${applicantId}/decision`, { decision: "accepted" }, { headers: { Authorization: `Bearer ${token}` } });
            alert("User approved!");
            await fetchProjectProfile(currentUser); // Pass currentUser
        } catch (error) {
            console.error("Failed to approve application:", error);
        }
    };

    const handleReject = async (applicantId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.post(`${import.meta.env.VITE_API_URL}/projects/${projectId}/applications/${applicantId}/decision`, { decision: "rejected" }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Application rejected!");
            await fetchProjectProfile(currentUser); // Pass currentUser
        } catch (error) {
            console.error("Failed to reject application:", error);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/projects/${projectId}/members/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Member removed!");
            await fetchProjectProfile(currentUser); // Pass currentUser
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!isOwner) return;

        try {
            const token = localStorage.getItem("access_token");
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/projects/${projectId}/status?status=${newStatus}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            await fetchProjectProfile(currentUser);
            toast.success(`Project status updated to ${newStatus === "finished" ? "Finished" : "In Development"}`);
        } catch (error) {
            console.error("Failed to update project status:", error);
            toast.error("Failed to update project status");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 dark:border-green-500"></div>
            </div>
        );
    }

    if (!projectDetails) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Project Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 sm:gap-6">
                {/* Main Content - Tasks */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="p-4 sm:p-6">
                        <div className="mb-6">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{projectDetails.name}</h1>
                                <span className={`text-xs sm:text-sm px-3 py-1 rounded-full ${projectDetails.status === "finished" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"}`}>
                                    {projectDetails.status === "finished" ? "Finished" : "In Development"}
                                </span>

                                {isOwner && (
                                    <div className="ml-auto">
                                        <select
                                            value={projectDetails.status}
                                            onChange={(e) => handleUpdateStatus(e.target.value)}
                                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="development">In Development</option>
                                            <option value="finished">Finished</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <FontAwesomeIcon icon={faClock} className="text-green-700 dark:text-green-400" />
                                <span>Created by {projectDetails.owner?.username || "Unknown"}</span>
                            </div>
                            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: projectDetails.description }}></div>
                        </div>

                        {(isMember || isOwner) && (
                            <div className="mt-8">
                                <ProjectTaskBoard projectId={projectId} isOwner={isOwner} isMember={isMember} />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Sidebar - Other Information */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 space-y-6">
                    {/* Tags & Skills */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faTag} className="text-green-700 dark:text-green-400" />
                                Tags & Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {projectDetails.tags.map((tag) => (
                                    <span key={tag.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                                        {tag.name}
                                    </span>
                                ))}
                                {projectDetails.skills.map((skill) => (
                                    <span key={skill.id} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Members */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUsers} className="text-green-700 dark:text-green-400" />
                                Project Members
                            </h3>
                            {members.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {members.map((member) => (
                                        <li key={member.id} className="py-3 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{member.username.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <span className="text-gray-800 dark:text-gray-200">{member.username}</span>
                                            </div>
                                            {isOwner && member.id !== projectDetails.owner?.id && (
                                                <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                                                    <FontAwesomeIcon icon={faUserMinus} />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No members have joined yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Applications */}
                    {isOwner && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="p-4 sm:p-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUserPlus} className="text-green-700 dark:text-green-400" />
                                    Pending Applications
                                </h3>
                                {applications.length > 0 ? (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {applications.map((app) => (
                                            <li key={app.id} className="py-3 flex justify-between items-center">
                                                <span className="text-gray-800 dark:text-gray-200">{app.username || `User ID: ${app.id}`}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApprove(app.id)} className="p-2 text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </button>
                                                    <button onClick={() => handleReject(app.id)} className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pending applications.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Comments */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faComment} className="text-green-700 dark:text-green-400" />
                                Comments ({comments.length})
                            </h3>
                            {comments.length > 0 ? (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{comment.user?.username?.charAt(0).toUpperCase() || "A"}</span>
                                                    </div>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{comment.user?.username || "Anonymous"}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No comments yet.</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProjectProfile;
