const PopularProjects = ({ fakePopularProjects }) => {
    return (
        <div className="col-span-2 flex flex-col bg-white p-5 shadow-lg">
            <h2 className="text-md font-bold mb-2">Popular Projects</h2>
            <hr className="border-gray-300" />
            <div className="space-y-4">
                {fakePopularProjects.map((project, index) => (
                    <div key={project.id} className="py-4 rounded-md">
                        <h3 className="font-semibold text-md">{project.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">Exciting project looking for collaborators.</p>
                        <p className="text-xs text-gray-500">Date: {new Date(project.date).toLocaleDateString()}</p>
                        <div className="mt-2">
                            {project.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full mr-2">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        {index < fakePopularProjects.length - 1 && <hr className="mt-4 -mb-10 border-t border-gray-300" />}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PopularProjects;
