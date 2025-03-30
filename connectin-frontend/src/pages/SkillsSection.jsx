import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const SkillsSection = ({ setSkills, skills: propSkills, loading, isStatic }) => {
    const [skills, setLocalSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [showAddSkills, setShowAddSkills] = useState(false);
    const [localLoading, setLocalLoading] = useState(true);

    useEffect(() => {
        if (isStatic && propSkills) {
            setLocalSkills(propSkills);
            setLocalLoading(false);
            return;
        }

        fetchSkills();
    }, [isStatic, propSkills]);

    const fetchSkills = async () => {
        try {
            setLocalLoading(true);
            const token = localStorage.getItem("access_token");
            const [userSkillsResponse, availableSkillsResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/users/me/skills`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/skills`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (userSkillsResponse?.data) {
                setLocalSkills(userSkillsResponse.data);
                if (setSkills) setSkills(userSkillsResponse.data);
            }
            if (availableSkillsResponse?.data) {
                setAvailableSkills(availableSkillsResponse.data);
                console.log(availableSkillsResponse.data);
            }
        } catch (error) {
            console.error("Failed to fetch skills:", error);
            toast.error("Failed to load skills");
        } finally {
            setLocalLoading(false);
        }
    };

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

    return (
        <div className="space-y-6">
            {loading || localLoading ? (
                <p className="text-center text-gray-500 py-4">Loading skills...</p>
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Your Skills</h2>
                        <button onClick={() => setShowAddSkills(!showAddSkills)} className="text-green-700 hover:text-green-600 transition-colors flex items-center gap-2">
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <div key={skill.id} className="bg-green-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 group">
                                <span>{skill.name}</span>
                                <button onClick={() => handleDeleteSkill(skill.id)} className="text-white hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {showAddSkills && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Skills</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {availableSkills
                                    .filter((skill) => !skills.some((userSkill) => userSkill.id === skill.id))
                                    .map((skill) => (
                                        <button key={skill.id} onClick={() => handleSelectSkill(skill)} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-all text-left flex items-center justify-between">
                                            <span className="font-medium text-gray-800">{skill.name}</span>
                                            <FontAwesomeIcon icon={faPlus} className="text-green-700" />
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
