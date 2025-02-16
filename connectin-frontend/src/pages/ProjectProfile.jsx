import { useState, useEffect } from "react";
import { useParams } from "react-router";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserMinus, faCheck, faTimes, faClipboardList, faPlus } from "@fortawesome/free-solid-svg-icons";

const ProjectProfile = ({ user }) => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProject();
        fetchProjectMembers();
        fetchProjectApplications();
    }, []);

    const fetchProject = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}`);
            setProject(response.data);
        } catch (error) {
            console.error("Failed to fetch project:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectMembers = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}/members`);
            setMembers(response.data);
            setIsMember(response.data.some((member) => member.id === user?.id));
        } catch (error) {
            console.error("Failed to fetch members:", error);
        }
    };

    const fetchProjectApplications = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}/applications`);
            setApplications(response.data);
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        }
    };

    const handleApply = async () => {
        try {
            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/apply`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            alert("Application submitted!");
        } catch (error) {
            console.error("Failed to apply:", error);
        }
    };

    const handleApprove = async (applicantId) => {
        try {
            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/applications/${applicantId}/decision`, 
                { decision: "accepted" }, 
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            alert("User approved!");
            fetchProjectMembers();
            fetchProjectApplications();
        } catch (error) {
            console.error("Failed to approve application:", error);
        }
    };

    const handleReject = async (applicantId) => {
        try {
            await axios.post(`http://127.0.0.1:8000/projects/${projectId}/applications/${applicantId}/decision`, 
                { decision: "rejected" }, 
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            alert("Application rejected!");
            fetchProjectApplications();
        } catch (error) {
            console.error("Failed to reject application:", error);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;

        try {
            await axios.delete(`http://127.0.0.1:8000/projects/${projectId}/members/${memberId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            alert("Member removed!");
            fetchProjectMembers();
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const handleAddTask = () => {
        if (!newTask.trim()) return;
        setTasks([...tasks, { id: Date.now(), title: newTask, completed: false }]);
        setNewTask("");
    };

    const toggleTaskCompletion = (taskId) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        ));
    };

    return (
        <div className="max-w-5xl mx-auto my-6 p-6 bg-white shadow-md rounded-lg border border-green-700">
            {loading ? (
                <p>Loading...</p>
            ) : project ? (
                <>
                    <h2 className="text-xl font-semibold">{project.name}</h2>
                    <p className="text-gray-700 mt-2">{project.description}</p>
                    
                    {/* Tags and Skills */}
                    <div className="mt-4">
                        <h3 className="font-semibold">Tags & Skills</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {project.tags.map((tag) => (
                                <span key={tag.id} className="text-sm bg-gray-200 px-2 py-1 rounded-md">
                                    {tag.name}
                                </span>
                            ))}
                            {project.skills.map((skill) => (
                                <span key={skill.id} className="text-sm bg-green-200 px-2 py-1 rounded-md">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="mt-6">
                        <h3 className="font-semibold">Project Members</h3>
                        <ul className="mt-2">
                            {members.map((member) => (
                                <li key={member.id} className="flex justify-between items-center py-2 border-b">
                                    <span>{member.username}</span>
                                    {project.owner_id === user?.id && member.id !== project.owner_id && (
                                        <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:text-red-700">
                                            <FontAwesomeIcon icon={faUserMinus} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pending Applications (For Project Owners) */}
                    {project.owner_id === user?.id && applications.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold">Pending Applications</h3>
                            <ul className="mt-2">
                                {applications.map((app) => (
                                    <li key={app.user_id} className="flex justify-between items-center py-2 border-b">
                                        <span>User ID: {app.user_id}</span>
                                        <div className="space-x-3">
                                            <button onClick={() => handleApprove(app.user_id)} className="text-green-500 hover:text-green-700">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button onClick={() => handleReject(app.user_id)} className="text-red-500 hover:text-red-700">
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Apply to Project Button */}
                    {!isMember && user && (
                        <button onClick={handleApply} className="mt-4 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600">
                            Apply to Join
                        </button>
                    )}

                    {/* To-Do Tasks */}
                    <div className="mt-6">
                        <h3 className="font-semibold flex items-center">
                            <FontAwesomeIcon icon={faClipboardList} className="mr-2" /> Project Tasks
                        </h3>
                        <ul className="mt-2">
                            {tasks.map((task) => (
                                <li key={task.id} className="flex justify-between items-center py-2 border-b">
                                    <span className={task.completed ? "line-through text-gray-500" : ""}>{task.title}</span>
                                    <button onClick={() => toggleTaskCompletion(task.id)} className="text-green-500 hover:text-green-700">
                                        {task.completed ? "Undo" : "Complete"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 flex">
                            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New Task" className="border p-2 flex-1" />
                            <button onClick={handleAddTask} className="ml-2 bg-green-700 text-white px-3 rounded-md">
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <p>Project not found.</p>
            )}
        </div>
    );
};

export default ProjectProfile;
