const PopularProjects = ({ fakePopularProjects }) => {
    return (
        <div className="bg-white dark:bg-gray-800 col-span-2 dark:text-gray-300 flex flex-col border border-green-700 rounded-md p-5 shadow-md">
            <h2 className="font-semibold mb-2">Popular Projects</h2>
            <div className="space-y-4">
                {fakePopularProjects.map((project) => (
                    <div key={project.id} className="py-2 last:border-b-0 border-t border-gray-300">
                        <div className="my-1">
                            {project.tags.map((tag, index) => (
                                <span key={index} className="text-xs text-gray-500 whitespace-nowrap">
                                    {tag}
                                    {index < project.tags.length - 1 ? " • " : ""}
                                </span>
                            ))}
                        </div>
                        <h3 className="font-semibold">{project.title}</h3>
                        <p className="text-sm mb-2">Exciting project looking for collaborators.</p>
                        <p className="text-xs">Date: {new Date(project.date).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PopularProjects;
