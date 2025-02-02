// src/pages/TeamsPage.jsx
import React from "react";

export default function TeamsPage({ fakeTeams }) {
    return (
        <div className="min-h-screen">
            {fakeTeams.length > 0 ? (
                <div className="space-y-6">
                    {fakeTeams.map((team) => (
                        <div key={team.id} className="bg-white shadow-lg p-5">
                            <h3 className="font-semibold text-xl mb-3">{team.name}</h3>
                            <p className="mb-2">
                                <strong>Members:</strong> {team.members.join(", ")}
                            </p>
                            <div className="mb-4">
                                <strong>Stack:</strong>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {team.stack.map((tech, index) => (
                                        <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => console.log(`Joined ${team.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline underline-offset-4">
                                Join Team
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center">No teams found.</p>
            )}
        </div>
    );
}
