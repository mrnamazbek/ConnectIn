export default function TeamsPage({ fakeTeams }) {
    return (
        <>
            {fakeTeams.length > 0 ? (
                <div className="space-y-5">
                    {fakeTeams.map((team) => (
                        <div key={team.id} className="bg-white shadow-md rounded-md border border-green-700 p-5">
                            <h3 className="font-semibold mb-3">{team.name}</h3>
                            <p className="mb-2">
                                <span className="font-semibold">Members:</span> {team.members.join(", ")}
                            </p>
                            <div className="flex items-center mb-2">
                                <p className="font-semibold">Stack:</p>
                                <div className="flex flex-wrap gap-2 ml-2">
                                    {team.stack.map((tech, index) => (
                                        <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button className="mt-2 rounded-md shadow-md px-3 bg-green-700 text-white font-semibold cursor-pointer hover:bg-green-600">Apply</button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center">No teams found.</p>
            )}
        </>
    );
}
