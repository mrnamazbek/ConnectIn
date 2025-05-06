import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTasks, faSpinner, faFilter, faSort, faEdit, faUsers, faTimes } from "@fortawesome/free-solid-svg-icons";
import TaskCard from "./TaskCard";

const ProjectTaskBoard = ({ projectId, isOwner, isMember }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [viewMode, setViewMode] = useState("board"); // "board" or "list"
    const [showAddTask, setShowAddTask] = useState(false);
    const [showEditTask, setShowEditTask] = useState(false);
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]); // Initialize as empty array
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Form state for new/edit task
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        due_date: "",
        estimated_hours: "",
        assignee_ids: []
    });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    // Task status columns
    const statusColumns = [
        { id: "todo", label: "To Do", icon: faTasks, color: "gray" },
        { id: "in_progress", label: "In Progress", icon: faSpinner, color: "blue" },
        { id: "in_review", label: "In Review", icon: faFilter, color: "purple" },
        { id: "done", label: "Done", icon: faSort, color: "green" }
    ];
    
    useEffect(() => {
        fetchCurrentUser();
        fetchTasks();
        fetchProjectMembers();
    }, [projectId, statusFilter, priorityFilter]);
    
    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Failed to fetch current user:", error);
        }
    };
    
    const fetchTasks = async () => {
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_URL}/todos/project/${projectId}`;
            
            // Add filters if needed
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (priorityFilter !== "all") params.priority = priorityFilter;
            
            const response = await axios.get(url, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
            });
            
            setTasks(response.data.items || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
            setError("Failed to load tasks. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectMembers = async () => {
        try {
            setLoadingMembers(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${projectId}/members`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
            });
            
            // Ensure we always set an array
            const members = Array.isArray(response.data) ? response.data : [];
            setProjectMembers(members);
            
        } catch (err) {
            console.error("Failed to fetch project members:", err);
            setProjectMembers([]); // Reset to empty array on error
        } finally {
            setLoadingMembers(false);
        }
    };
    
    const handleAddTask = () => {
        setNewTask({
            title: "",
            description: "",
            priority: "medium",
            status: "todo",
            due_date: "",
            estimated_hours: "",
            assignee_ids: []
        });
        setFormError("");
        setShowAddTask(true);
    };

    const handleEditTask = (task) => {
        // Convert the due date to YYYY-MM-DD format for the input field
        let formattedDueDate = "";
        if (task.due_date) {
            const date = new Date(task.due_date);
            formattedDueDate = date.toISOString().split('T')[0];
        }
        
        setNewTask({
            title: task.title || "",
            description: task.description || "",
            priority: task.priority || "medium",
            status: task.status || "todo",
            due_date: formattedDueDate,
            estimated_hours: task.estimated_hours || "",
            assignee_ids: task.assignees?.map(assignee => assignee.id) || []
        });
        
        setSelectedTask(task);
        setFormError("");
        setShowEditTask(true);
    };

    const handleViewDetails = (task) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleAssigneeChange = (userId) => {
        setNewTask(prev => {
            // If the userId is already in the list, remove it
            if (prev.assignee_ids.includes(userId)) {
                return {
                    ...prev,
                    assignee_ids: prev.assignee_ids.filter(id => id !== userId)
                };
            } 
            // Otherwise add it
            else {
                return {
                    ...prev,
                    assignee_ids: [...prev.assignee_ids, userId]
                };
            }
        });
    };
    
    const submitNewTask = async () => {
        // Validate form
        if (!newTask.title.trim()) {
            setFormError("Task title is required");
            return;
        }
        
        setSubmitting(true);
        setFormError("");
        
        try {
            const taskData = {
                ...newTask,
                project_id: projectId
            };
            
            await axios.post(`${import.meta.env.VITE_API_URL}/todos`, taskData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`
                }
            });
            
            // Success - close modal and refresh tasks
            setShowAddTask(false);
            fetchTasks();
        } catch (err) {
            console.error("Failed to create task:", err);
            // Extract error message safely
            let errorMessage = "Failed to create task. Please try again.";
            if (err.response?.data?.detail) {
                // Handle both string and object error formats
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (typeof err.response.data.detail === 'object') {
                    // For validation errors that might be an array or object
                    errorMessage = "Validation error. Please check your inputs.";
                }
            }
            setFormError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const submitTaskUpdate = async () => {
        // Validate form
        if (!newTask.title.trim()) {
            setFormError("Task title is required");
            return;
        }
        
        setSubmitting(true);
        setFormError("");
        
        try {
            const taskData = {
                ...newTask,
                project_id: projectId
            };
            
            await axios.put(`${import.meta.env.VITE_API_URL}/todos/${selectedTask.id}`, taskData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`
                }
            });
            
            // Success - close modal and refresh tasks
            setShowEditTask(false);
            fetchTasks();
        } catch (err) {
            console.error("Failed to update task:", err);
            // Extract error message safely
            let errorMessage = "Failed to update task. Please try again.";
            if (err.response?.data?.detail) {
                // Handle both string and object error formats
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (typeof err.response.data.detail === 'object') {
                    // For validation errors that might be an array or object
                    errorMessage = "Validation error. Please check your inputs.";
                }
            }
            setFormError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };
    
    // Filter tasks by status for the board view
    const getTasksByStatus = (status) => {
        return tasks.filter(task => task.status === status);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleString();
    };
    
    // Render the assignee selection component
    const renderAssigneeSelection = () => {
        return (
            <div>
                <label className="block text-sm font-medium mb-1">Assignees</label>
                <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-lg p-2">
                    {loadingMembers ? (
                        <div className="flex justify-center py-4">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-gray-500" />
                        </div>
                    ) : !Array.isArray(projectMembers) || projectMembers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm py-2 text-center">No project members available</p>
                    ) : (
                        <ul className="space-y-1">
                            {projectMembers.map(member => (
                                <li key={member.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <input
                                        type="checkbox"
                                        id={`member-${member.id}`}
                                        checked={newTask.assignee_ids.includes(member.id)}
                                        onChange={() => handleAssigneeChange(member.id)}
                                        className="mr-2"
                                    />
                                    <label htmlFor={`member-${member.id}`} className="flex items-center cursor-pointer w-full">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm mr-2">
                                            {member.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{member.username}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    };
    
    // Render functions
    const renderBoardView = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statusColumns.map((column) => (
                    <div key={column.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center">
                            <span className={`w-2 h-2 bg-${column.color}-500 rounded-full mr-2`}></span>
                            {column.label} <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 rounded-full">{getTasksByStatus(column.id).length}</span>
                        </h4>
                        <div className="space-y-2">
                            {getTasksByStatus(column.id).map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onUpdate={fetchTasks} 
                                    canEdit={isOwner || task.user_id === currentUser?.id}
                                    onEditTask={handleEditTask}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                            
                            {/* Add task button at bottom of column */}
                            {isOwner && column.id === "todo" && (
                                <button 
                                    onClick={handleAddTask}
                                    className="w-full py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-green-600 hover:border-green-500 flex items-center justify-center transition-colors"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                    Add Task
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    const renderListView = () => {
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignees</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {tasks.map((task) => (
                            <tr 
                                key={task.id} 
                                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                onClick={() => handleViewDetails(task)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        task.status === 'todo' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                        task.status === 'in_review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    }`}>
                                        {task.status === 'todo' ? 'To Do' : 
                                         task.status === 'in_progress' ? 'In Progress' : 
                                         task.status === 'in_review' ? 'In Review' : 'Done'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        task.priority === 'low' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                        task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex -space-x-2">
                                        {task.assignees.slice(0, 3).map((assignee) => (
                                            <div key={assignee.id} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs border border-white dark:border-gray-800">
                                                {assignee.username.charAt(0).toUpperCase()}
                                            </div>
                                        ))}
                                        {task.assignees.length > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs border border-white dark:border-gray-800">
                                                +{task.assignees.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {tasks.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No tasks matching your filters
                    </div>
                )}
            </div>
        );
    };
    
    // Modal for task form
    const renderTaskForm = (isEdit = false) => {
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title*</label>
                    <input 
                        type="text" 
                        name="title"
                        value={newTask.title}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600" 
                        placeholder="Task title" 
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                        name="description"
                        value={newTask.description}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600" 
                        rows="3" 
                        placeholder="Task description"
                    ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select 
                            name="priority"
                            value={newTask.priority}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    
                    {isEdit && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select 
                                name="status"
                                value={newTask.status}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input 
                            type="date" 
                            name="due_date"
                            value={newTask.due_date}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Estimated Hours</label>
                        <input 
                            type="number" 
                            name="estimated_hours"
                            value={newTask.estimated_hours}
                            onChange={handleInputChange}
                            min="0"
                            step="0.5"
                            className="w-full rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600" 
                            placeholder="Estimated hours to complete" 
                        />
                    </div>
                </div>
                
                {/* Assignee selection */}
                {renderAssigneeSelection()}
                
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => isEdit ? setShowEditTask(false) : setShowAddTask(false)} 
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={isEdit ? submitTaskUpdate : submitNewTask} 
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        disabled={submitting}
                    >
                        {submitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Task' : 'Add Task')}
                    </button>
                </div>
            </div>
        );
    };
    
    // Main render
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-700 dark:border-green-500 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FontAwesomeIcon icon={faTasks} className="text-green-700 dark:text-green-400" />
                        Project Tasks
                    </h3>
                    
                    {isOwner && viewMode === "list" && (
                        <button 
                            onClick={handleAddTask}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            New Task
                        </button>
                    )}
                </div>
                
                {/* Filter and View Controls */}
                <div className="flex flex-wrap justify-between mb-6 gap-4">
                    <div className="flex flex-wrap gap-2">
                        <select 
                            className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="done">Done</option>
                        </select>
                        
                        <select 
                            className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="all">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            className={`px-3 py-2 text-sm rounded flex items-center gap-1 ${viewMode === "board" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                            onClick={() => setViewMode("board")}
                        >
                            <FontAwesomeIcon icon={faTasks} /> Board
                        </button>
                        <button 
                            className={`px-3 py-2 text-sm rounded flex items-center gap-1 ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                            onClick={() => setViewMode("list")}
                        >
                            <FontAwesomeIcon icon={faSort} /> List
                        </button>
                    </div>
                </div>
                
                {/* Loading state */}
                {loading && (
                    <div className="flex justify-center py-10">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-green-500 text-2xl" />
                    </div>
                )}
                
                {/* Error state */}
                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg text-center">
                        {error}
                    </div>
                )}
                
                {/* Task display */}
                {!loading && !error && (
                    <div>
                        {tasks.length === 0 && !loading ? (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                No tasks found. {(isOwner || isMember) ? "Create your first task!" : "Tasks will appear here when they're created."}
                            </div>
                        ) : (
                            viewMode === "board" ? renderBoardView() : renderListView()
                        )}
                    </div>
                )}
                
                {/* Add task modal */}
                {showAddTask && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                            <h3 className="text-lg font-bold mb-4">Add New Task</h3>
                            
                            {/* Display form errors */}
                            {formError && (
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                                    {formError}
                                </div>
                            )}
                            
                            {renderTaskForm(false)}
                        </div>
                    </div>
                )}
                
                {/* Edit task modal */}
                {showEditTask && selectedTask && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                            <h3 className="text-lg font-bold mb-4">Edit Task</h3>
                            
                            {/* Display form errors */}
                            {formError && (
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                                    {formError}
                                </div>
                            )}
                            
                            {renderTaskForm(true)}
                        </div>
                    </div>
                )}
                
                {/* Task details modal */}
                {showTaskDetails && selectedTask && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Task Details</h3>
                                <button 
                                    onClick={() => setShowTaskDetails(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Task title and description */}
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{selectedTask.title}</h2>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                            {selectedTask.description || "No description provided."}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Task metadata */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            selectedTask.status === 'todo' ? 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
                                            selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                            selectedTask.status === 'in_review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        }`}>
                                            {selectedTask.status === 'todo' ? 'To Do' : 
                                            selectedTask.status === 'in_progress' ? 'In Progress' : 
                                            selectedTask.status === 'in_review' ? 'In Review' : 'Done'}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            selectedTask.priority === 'low' ? 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
                                            selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                            selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                            {selectedTask.priority}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Due Date</h4>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {selectedTask.due_date ? formatDate(selectedTask.due_date) : "Not set"}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Estimated Hours</h4>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {selectedTask.estimated_hours ? `${selectedTask.estimated_hours} hours` : "Not estimated"}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Assignees */}
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                        Assignees
                                    </h4>
                                    
                                    {selectedTask.assignees?.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedTask.assignees.map(assignee => (
                                                <div key={assignee.id} className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm mr-2">
                                                        {assignee.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">{assignee.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">No assignees</p>
                                    )}
                                </div>
                                
                                {/* Created/Updated info */}
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <p>Created: {formatDate(selectedTask.created_at)}</p>
                                    <p>Last updated: {formatDate(selectedTask.updated_at)}</p>
                                </div>
                                
                                {/* Action buttons */}
                                {(isOwner || selectedTask?.user_id === currentUser?.id) && (
                                    <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <button 
                                            onClick={() => {
                                                setShowTaskDetails(false);
                                                handleEditTask(selectedTask);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                                            Edit Task
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectTaskBoard; 