import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown, faComment } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router";
import axios from "axios";

const ProjectCard = ({ project, currentUser, handleApply, handleUpvote, handleDownvote, showViewProject = true, showCommentsLink = false }) => {
    const [voteStatus, setVoteStatus] = useState({ has_voted: false, is_upvote: null });

    useEffect(() => {
        if (currentUser) {
            fetchVoteStatus();
        }
    }, [currentUser, project.id, project.vote_count]); // Added vote_count as dependency

    const fetchVoteStatus = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;

            const response = await axios.get(`http://127.0.0.1:8000/projects/${project.id}/vote_status`, { headers: { Authorization: `Bearer ${token}` } });
            setVoteStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch vote status:", error);
        }
    };

    const owner = project.owner || {
        avatar_url: "https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif",
        username: "Unknown",
        id: null,
    };

    return (
        <div className="bg-white shadow-md rounded-md border border-green-700 p-5">
            <div className="flex items-center space-x-2">
                <img src={owner.avatar_url} alt={owner.username} className="w-10 h-10 rounded-full border" onError={(e) => (e.target.src = "https://media.tenor.com/HmFcGkSu58QAAAAM/silly.gif")} />
                <p className="font-semibold">{owner.username}</p>
            </div>

            <div className="flex flex-wrap my-2">{project.tags?.length > 0 && <div className="flex flex-wrap mt-2 text-xs text-gray-500">{project.tags.map((tag) => tag.name).join(" • ")}</div>}</div>

            <h3 className="text-lg font-bold">{project.name || "Untitled Project"}</h3>
            <p className="text-gray-700 mb-3">{project.description || "No description available."}</p>

            <div className="mt-3 flex flex-wrap gap-2">
                {project.skills?.length > 0 ? (
                    project.skills.map((skill) => (
                        <span key={skill.id} className="text-xs px-2 py-1 bg-green-300 rounded-md">
                            {skill.name}
                        </span>
                    ))
                ) : (
                    <span className="text-gray-500 text-xs">No skills</span>
                )}
            </div>

            <div className="flex justify-between items-center mt-3">
                <div className="space-x-3">
                    <button onClick={() => handleUpvote(project.id)} className={`transition cursor-pointer ${voteStatus.has_voted && voteStatus.is_upvote ? "text-green-700" : "text-gray-500 hover:text-green-700"}`}>
                        <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <span className="text-gray-700 font-bold">{project.vote_count || 0}</span>
                    <button onClick={() => handleDownvote(project.id)} className={`transition cursor-pointer ${voteStatus.has_voted && !voteStatus.is_upvote ? "text-red-700" : "text-gray-500 hover:text-red-700"}`}>
                        <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                    {showCommentsLink && (
                        <NavLink to={`/project/${project.id}`} className="text-gray-500 hover:text-blue-700 transition cursor-pointer">
                            <FontAwesomeIcon icon={faComment} /> {project.comments_count || ""}
                        </NavLink>
                    )}
                </div>

                <div className="space-x-3">
                    {currentUser && currentUser.id !== owner.id && (
                        <button onClick={() => handleApply(project.id)} className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition">
                            Apply
                        </button>
                    )}
                    {showViewProject && (
                        <NavLink to={`/project/${project.id}`} className="rounded shadow-sm text-sm px-6 py-2 border border-green-700 hover:text-white font-semibold cursor-pointer hover:bg-green-700 transition">
                            View Project
                        </NavLink>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
