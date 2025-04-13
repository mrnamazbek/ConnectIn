import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrashAlt, faSearch, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const SkillsSection = ({ setSkills, skills: propSkills, availableSkills: propAvailableSkills, loading, isStatic }) => {
    const [skills, setLocalSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [showAddSkills, setShowAddSkills] = useState(false);
    const [localLoading, setLocalLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [addingSkill, setAddingSkill] = useState(null);
    const [deletingSkill, setDeletingSkill] = useState(null);

    const fetchSkills = useCallback(async () => {
        try {
            setLocalLoading(true);
            const token = localStorage.getItem("access_token");

            if (!isStatic) {
                const userSkillsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/users/me/skills`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (userSkillsResponse?.data) {
                    setLocalSkills(userSkillsResponse.data);
                    if (setSkills) setSkills(userSkillsResponse.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch skills:", error.response?.data || error.message);
            toast.error(error.response?.data?.detail || "Failed to load skills");
        } finally {
            setLocalLoading(false);
        }
    }, [setSkills, isStatic]);

    useEffect(() => {
        if (isStatic && propSkills) {
            setLocalSkills(propSkills);
            setAvailableSkills(propAvailableSkills || []);
            setLocalLoading(false);
            return;
        }

        fetchSkills();
    }, [isStatic, propSkills, propAvailableSkills, fetchSkills]);

    const handleSelectSkill = async (skill) => {
        try {
            setAddingSkill(skill.id);
            const token = localStorage.getItem("access_token");
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/me/skills?skill_id=${skill.id}`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response?.data) {
                setLocalSkills([...skills, response.data]);
                if (setSkills) setSkills([...skills, response.data]);
                toast.success("Skill added successfully");
            }
        } catch (error) {
            console.error("Failed to add skill:", error);
            toast.error("Failed to add skill");
        } finally {
            setAddingSkill(null);
        }
    };

    const handleDeleteSkill = async (skillId) => {
        try {
            setDeletingSkill(skillId);
            const token = localStorage.getItem("access_token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/skills/${skillId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setLocalSkills(skills.filter((skill) => skill.id !== skillId));
            if (setSkills) setSkills(skills.filter((skill) => skill.id !== skillId));
            toast.success("Skill deleted successfully");
        } catch (error) {
            console.error("Failed to delete skill:", error);
            toast.error("Failed to delete skill");
        } finally {
            setDeletingSkill(null);
        }
    };

    const filteredAvailableSkills = availableSkills.filter((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            {loading || localLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 dark:border-green-400"></div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Your Skills</h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddSkills(!showAddSkills)}
                            className="text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 cursor-pointer transition-colors flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={showAddSkills ? faMinus : faPlus} />
                            <span className="text-sm">{showAddSkills ? "Close" : "Add Skills"}</span>
                        </motion.button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                            {skills.map((skill) => (
                                <motion.div
                                    key={skill.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="bg-green-700 dark:bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 group relative"
                                >
                                    <span>{skill.name}</span>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDeleteSkill(skill.id)}
                                        className="text-white cursor-pointer hover:text-red-200 dark:hover:text-red-300 transition-colors"
                                        disabled={deletingSkill === skill.id}
                                    >
                                        {deletingSkill === skill.id ? (
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        ) : (
                                            <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                                        )}
                                    </motion.button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {showAddSkills && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FontAwesomeIcon icon={faSearch} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search skills..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    <AnimatePresence>
                                        {filteredAvailableSkills
                                            .filter((skill) => !skills.some((userSkill) => userSkill.id === skill.id))
                                            .map((skill) => (
                                                <motion.button
                                                    key={skill.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 20 }}
                                                    onClick={() => handleSelectSkill(skill)}
                                                    disabled={addingSkill !== null}
                                                    className="bg-gray-50 dark:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-left flex items-center justify-between group"
                                                >
                                                    <span className="font-medium text-gray-800 dark:text-white">{skill.name}</span>
                                                    {addingSkill === skill.id ? (
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-green-700 dark:text-green-400" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faPlus} className="text-green-700 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </motion.button>
                                            ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default SkillsSection;
