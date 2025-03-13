import { useState, useEffect } from "react";
import { useParams } from "react-router";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserMinus, faCheck, faTimes, faClipboardList, faPlus, faTrash, faPencilAlt, faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";

const ProjectProfile = () => {
    const { projectId } = useParams();
    const [projectDetails, setProjectDetails] = useState(null);
    const [members, setMembers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState("");
    const [todoDescription, setTodoDescription] = useState("");
    const [isMember, setIsMember] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [voteStatus, setVoteStatus] = useState({ has_voted: false, is_upvote: null });
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                await fetchCurrentUser();
                await fetchProjectProfile();
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
            const token = localStorage.getItem("token");
            const response = await axios.get("http://127.0.0.1:8000/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Failed to fetch current user:", error);
        }
    };

    const fetchProjectProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;
            setProjectDetails(data.project);
            setMembers(data.members);
            setApplications(data.applications || []);
            setComments(data.comments);
            setIsOwner(currentUser && data.project.owner.id === currentUser.id);
            console.log(isOwner);
            console.log(isMember);
            setIsMember(data.members.some((member) => member.id === (currentUser?.id || -1)) || (currentUser && data.project.owner.id === currentUser.id));
        } catch (error) {
            console.error("Failed to fetch project profile:", error);
        }
    };

    const fetchVoteStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}/vote_status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVoteStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch vote status:", error);
        }
    };

    const handleApply = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/apply`, {}, { headers: { Authorization: `Bearer ${token}` } });
            alert("Application submitted!");
            fetchProjectProfile();
        } catch (error) {
            console.error("Failed to apply:", error);
            alert(error.response?.data?.detail || "Failed to apply");
        }
    };

    const handleApprove = async (applicantId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/applications/${applicantId}/decision`, { decision: "accepted" }, { headers: { Authorization: `Bearer ${token}` } });
            alert("User approved!");
            fetchProjectProfile();
        } catch (error) {
            console.error("Failed to approve application:", error);
        }
    };

    const handleReject = async (applicantId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/applications/${applicantId}/decision`, { decision: "rejected" }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Application rejected!");
            fetchProjectProfile();
        } catch (error) {
            console.error("Failed to reject application:", error);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/projects/${projectId}/members/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Member removed!");
            fetchProjectProfile();
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    if (loading) {
        return <div>Loading project...</div>;
    }

    if (!projectDetails) {
        return (
            <div className="flex justify-center p-8">
                <p>Project not found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto my-6 p-6 bg-white shadow-sm rounded-md border border-green-700">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{projectDetails.name}</h1>
                    <p className="text-gray-600 mt-2">{projectDetails.description}</p>
                </div>
                <div>
                    <p className="text-sm">
                        <span className="font-semibold">Owner:</span> {projectDetails.owner?.username || "Unknown"}
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Main Content - Tasks */}
                <div className="flex-1">
                    {(isMember || isOwner) && (
                        <div className="mb-6">
                            <h3 className="font-semibold border-b pb-2 mb-3 flex items-center">
                                <FontAwesomeIcon icon={faClipboardList} className="mr-2" /> Project Tasks
                            </h3>
                            <p className="text-gray-500 text-sm">Tasks are currently disabled.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar - Other Information */}
                <div className="w-full md:w-1/3">
                    <div className="mb-6">
                        <h3 className="font-semibold border-b pb-2 mb-3">Tags & Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {projectDetails.tags.map((tag) => (
                                <span key={tag.id} className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                                    {tag.name}
                                </span>
                            ))}
                            {projectDetails.skills.map((skill) => (
                                <span key={skill.id} className="text-sm bg-green-100 px-2 py-1 rounded-md">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold border-b pb-2 mb-3">Project Members</h3>
                        {members.length > 0 ? (
                            <ul className="divide-y">
                                {members.map((member) => (
                                    <li key={member.id} className="flex justify-between items-center py-2">
                                        <span>{member.username}</span>
                                        {isOwner && member.id !== projectDetails.owner?.id && (
                                            <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:text-red-700">
                                                <FontAwesomeIcon icon={faUserMinus} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm">No members have joined yet.</p>
                        )}
                    </div>

                    {isOwner && (
                        <div className="mb-6">
                            <h3 className="font-semibold border-b pb-2 mb-3">Pending Applications</h3>
                            {applications.length > 0 ? (
                                <ul className="divide-y">
                                    {applications.map((app) => (
                                        <li key={app.id} className="flex justify-between items-center py-2">
                                            <span>{app.username || `User ID: ${app.id}`}</span>
                                            <div className="space-x-2">
                                                <button onClick={() => handleApprove(app.id)} className="text-green-500 hover:text-green-700 px-2">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </button>
                                                <button onClick={() => handleReject(app.id)} className="text-red-500 hover:text-red-700 px-2">
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm">No pending applications.</p>
                            )}
                        </div>
                    )}

                    <div>
                        <h3 className="font-semibold border-b pb-2 mb-3">Comments ({comments.length})</h3>
                        {comments.length > 0 ? (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 p-3 rounded">
                                        <div className="flex justify-between items-start">
                                            <div className="font-medium">{comment.user?.username || "Anonymous"}</div>
                                            <div className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</div>
                                        </div>
                                        <p className="mt-2">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No comments yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectProfile;