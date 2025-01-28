import { useParams } from "react-router";

const ProjectProfile = () => {
    const { id } = useParams();

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-4">Team Profile</h2>
            <p>Details of team with ID: {id}</p>
        </div>
    );
};

export default ProjectProfile;
