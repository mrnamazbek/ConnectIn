import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faFlag, faEllipsisV, faArrowRight, faCheck, faTrashAlt, faEdit, faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const TaskCard = ({ task, onUpdate, canEdit, onEditTask, onViewDetails }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const menuButtonRef = useRef(null);
    
    // Update menu position when it's toggled
    useEffect(() => {
        if (isMenuOpen && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                right: window.innerWidth - rect.right
            });
        }
    }, [isMenuOpen]);
    
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);
    
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent": return "text-red-600 dark:text-red-400";
            case "high": return "text-orange-600 dark:text-orange-400";
            case "medium": return "text-yellow-600 dark:text-yellow-400";
            case "low": return "text-blue-600 dark:text-blue-400";
            default: return "text-gray-600 dark:text-gray-400";
        }
    };
    
    const getPriorityIcon = (priority) => {
        const iconClass = getPriorityColor(priority);
        const flagCount = 
            priority === "urgent" ? 3 :
            priority === "high" ? 2 :
            priority === "medium" ? 1 : 0;
            
        return (
            <div className="flex">
                {[...Array(flagCount)].map((_, i) => (
                    <FontAwesomeIcon key={i} icon={faFlag} className={`${iconClass} ${i > 0 ? "-ml-1" : ""}`} />
                ))}
                {flagCount === 0 && <FontAwesomeIcon icon={faFlag} className="text-gray-400" />}
            </div>
        );
    };
    
    const moveToNextStatus = async () => {
        if (!canEdit) return;
        setIsLoading(true);
        
        const statusProgressMap = {
            "todo": "in_progress",
            "in_progress": "in_review",
            "in_review": "done",
        };
        
        const nextStatus = statusProgressMap[task.status];
        
        if (!nextStatus) {
            setIsLoading(false);
            return;
        }
        
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/todos/${task.id}`, 
                { status: nextStatus },
                { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
            );
            
            onUpdate(); // Refresh the task list
        } catch (error) {
            console.error("Failed to update task status:", error);
        } finally {
            setIsLoading(false);
            setIsMenuOpen(false);
        }
    };
    
    const markAsDone = async () => {
        if (!canEdit) return;
        setIsLoading(true);
        
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/todos/${task.id}`, 
                { status: "done", is_completed: true },
                { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
            );
            
            onUpdate(); // Refresh the task list
        } catch (error) {
            console.error("Failed to mark task as done:", error);
        } finally {
            setIsLoading(false);
            setIsMenuOpen(false);
        }
    };
    
    const deleteTask = async () => {
        if (!canEdit) return;
        
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/todos/${task.id}`, 
                { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
            );
            
            onUpdate(); // Refresh the task list
        } catch (error) {
            console.error("Failed to delete task:", error);
        } finally {
            setIsLoading(false);
            setIsMenuOpen(false);
        }
    };

    const handleEditTask = () => {
        setIsMenuOpen(false);
        onEditTask(task);
    };

    const handleViewDetails = () => {
        setIsMenuOpen(false);
        onViewDetails(task);
    };
    
    return (
        <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 relative">
            {/* Task title */}
            <h4 className="font-medium text-gray-800 dark:text-white mb-2 break-words line-clamp-2">{task.title}</h4>
            
            {/* Optional description preview */}
            {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.description}</p>
            )}
            
            {/* Meta info */}
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    {/* Priority */}
                    {task.priority && getPriorityIcon(task.priority)}
                    
                    {/* Due date */}
                    {task.due_date && (
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{formatDate(task.due_date)}</span>
                        </div>
                    )}
                </div>
                
                {/* Assignees */}
                <div className="flex -space-x-1">
                    {task.assignees.slice(0, 3).map((assignee) => (
                        <div key={assignee.id} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs border border-white dark:border-gray-700">
                            {assignee.username.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {task.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs border border-white dark:border-gray-700">
                            +{task.assignees.length - 3}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Action buttons - only visible if user can edit */}
            {canEdit && (
                <div className="absolute top-2 right-2">
                    <button 
                        ref={menuButtonRef}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    
                    {/* Action menu */}
                    {isMenuOpen && (
                        <div className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-50 w-48 border border-gray-200 dark:border-gray-700" style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}>
                            {task.status !== "done" && (
                                <button 
                                    onClick={moveToNextStatus}
                                    disabled={isLoading}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faArrowRight} className="text-blue-500" />
                                    Move to Next Stage
                                </button>
                            )}
                            
                            {task.status !== "done" && (
                                <button 
                                    onClick={markAsDone}
                                    disabled={isLoading}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                                    Mark as Done
                                </button>
                            )}
                            
                            <button 
                                onClick={handleEditTask}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faEdit} className="text-yellow-500" />
                                Edit Task
                            </button>
                            
                            <button 
                                onClick={handleViewDetails}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faEye} className="text-purple-500" />
                                View Details
                            </button>
                            
                            <button 
                                onClick={deleteTask}
                                disabled={isLoading}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faTrashAlt} />
                                Delete Task
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskCard; 