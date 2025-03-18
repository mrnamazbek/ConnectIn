import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

const SkillsSection = ({ skills, setSkills, loading }) => {
    const [availableSkills, setAvailableSkills] = useState([]);
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [hoveredSkill, setHoveredSkill] = useState(null); // Track hovered skill ID

    useEffect(() => {
        const fetchAvailableSkills = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const response = await axios.get("http://127.0.0.1:8000/skills/", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const filteredSkills = response.data.filter((skill) => !skills.some((userSkill) => userSkill.id === skill.id));
                setAvailableSkills(filteredSkills);
            } catch (error) {
                console.error("Failed to fetch available skills:", error);
            }
        };

        fetchAvailableSkills();
    }, [skills]);

    const handleSelectSkill = (skill) => {
        setSelectedSkills((prevSelected) => (prevSelected.some((s) => s.id === skill.id) ? prevSelected.filter((s) => s.id !== skill.id) : [...prevSelected, skill]));
    };

    const handleSaveSkills = async () => {
        try {
            const token = localStorage.getItem("access_token");

            for (const skill of selectedSkills) {
                await axios.post(`http://127.0.0.1:8000/users/me/skills?skill_id=${skill.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            }

            setSkills([...skills, ...selectedSkills]); // Update user skills in UI
            setAvailableSkills(availableSkills.filter((s) => !selectedSkills.includes(s))); // Remove from available skills
            setSelectedSkills([]); // Clear selection
            setShowAllSkills(false);
        } catch (error) {
            console.error("Failed to add skills:", error);
        }
    };

    const handleDeleteSkill = async (skillId) => {
        if (!window.confirm("Are you sure you want to remove this skill?")) return;

        try {
            const token = localStorage.getItem("access_token");

            await axios.delete(`http://127.0.0.1:8000/users/me/skills/${skillId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSkills((prevSkills) => prevSkills.filter((skill) => skill.id !== skillId));
        } catch (error) {
            console.error("Failed to remove skill:", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <button className="cursor-pointer hover:text-green-700" onClick={() => setShowAllSkills(!showAllSkills)}>
                    {showAllSkills ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />}
                </button>
            </div>

            {/* Display User's Skills */}
            <div className="flex flex-wrap gap-2">
                {loading ? (
                    <p className="text-gray-600">Loading skills...</p>
                ) : skills.length > 0 ? (
                    skills.map((skill) => (
                        <span key={skill.id} className="flex items-center shadow-sm rounded-md px-2 py-1 bg-green-700 text-white" onMouseEnter={() => setHoveredSkill(skill.id)} onMouseLeave={() => setHoveredSkill(null)}>
                            {skill.name}
                            {hoveredSkill === skill.id && (
                                <button className="ml-2 text-white hover:text-red-400 transition right-2" onClick={() => handleDeleteSkill(skill.id)}>
                                    <FontAwesomeIcon icon={faTrashAlt} size="sm" />
                                </button>
                            )}
                            
                        </span>
                        
                    ))
                ) : (
                    <p className="text-gray-700">No skills added yet.</p>
                )}
            </div>

            {/* Show All Skills if the button is clicked */}
            {showAllSkills && (
                <>
                    <p className="font-semibold text-md mt-4">Available Skills</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {availableSkills.length > 0 ? (
                            availableSkills.map((skill) => (
                                <span key={skill.id} className={`shadow-sm rounded-md px-3 py-1 cursor-pointer ${selectedSkills.includes(skill) ? "bg-gray-300" : "bg-white border border-gray-300"}`} onClick={() => handleSelectSkill(skill)}>
                                    {skill.name}
                                </span>
                            ))
                        ) : (
                            <p className="text-gray-500">No available skills</p>
                        )}
                    </div>

                    {/* Save Button */}
                    {selectedSkills.length > 0 && (
                        <button className="mt-3 w-full text-white bg-green-700 font-semibold px-3 py-2 shadow-sm rounded-md cursor-pointer hover:bg-green-600" onClick={handleSaveSkills}>
                            Save Skills
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default SkillsSection;
