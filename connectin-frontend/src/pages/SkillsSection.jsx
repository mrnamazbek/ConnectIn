import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrashAlt, faSearch } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const SkillsSection = ({ setSkills, skills: propSkills, availableSkills: propAvailableSkills, loading, isStatic }) => {
    const [skills, setLocalSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [showAddSkills, setShowAddSkills] = useState(false);
    const [localLoading, setLocalLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchSkills = useCallback(async () => {
        try {
            setLocalLoading(true);
            const token = localStorage.getItem("access_token");
            
            // Only fetch user skills if not static
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
            const token = localStorage.getItem("access_token");
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/me/skills`, { skill_id: skill.id }, { headers: { Authorization: `Bearer ${token}` } });

            if (response?.data) {
                setLocalSkills([...skills, response.data]);
                if (setSkills) setSkills([...skills, response.data]);
                toast.success("Skill added successfully");
            }
        } catch (error) {
            console.error("Failed to add skill:", error);
            toast.error("Failed to add skill");
        }
    };

    const handleDeleteSkill = async (skillId) => {
        try {
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
        }
    };

    const filteredAvailableSkills = availableSkills.filter(skill => 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {loading || localLoading ? (
                <p className="text-center text-gray-500 py-4">Loading skills...</p>
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Your Skills</h2>
                        <button onClick={() => setShowAddSkills(!showAddSkills)} className="text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors flex items-center gap-2">
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <div key={skill.id} className="bg-green-700 dark:bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 group">
                                <span>{skill.name}</span>
                                <button onClick={() => handleDeleteSkill(skill.id)} className="text-white cursor-pointer hover:text-red-200 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {showAddSkills && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Available Skills</h3>
                            <div className="relative mb-4">
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
                                {filteredAvailableSkills
                                    .filter((skill) => !skills.some((userSkill) => userSkill.id === skill.id))
                                    .map((skill) => (
                                        <button key={skill.id} onClick={() => handleSelectSkill(skill)} className="bg-gray-50 dark:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-left flex items-center justify-between">
                                            <span className="font-medium text-gray-800 dark:text-white">{skill.name}</span>
                                            <FontAwesomeIcon icon={faPlus} className="text-green-700 dark:text-green-400" />
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SkillsSection;
