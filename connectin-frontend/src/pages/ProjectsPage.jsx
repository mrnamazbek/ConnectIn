import { useState, useEffect } from "react";
import axios from "axios";
import ProjectCard from "../components/Project/ProjectCard";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchCurrentUser();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/projects/");
      const projectsWithVotes = response.data.map((project) => ({
        ...project,
        vote_count: project.vote_count || 0, // Backend now provides this
        comments_count: project.comments_count || 0,
      }));
      setProjects(projectsWithVotes);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("http://127.0.0.1:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const handleApply = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to apply for a project.");
        return;
      }

      await axios.post(
        `http://127.0.0.1:8000/projects/${projectId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Application submitted!");
    } catch (error) {
      console.error("Failed to apply:", error);
      alert("Failed to apply. You may have already applied.");
    }
  };

  const handleUpvote = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to vote.");
        return;
      }

      const response = await axios.post(
        `http://127.0.0.1:8000/projects/${projectId}/vote`,
        { is_upvote: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProjects((prevProjects) =>
        prevProjects.map((proj) =>
          proj.id === projectId
            ? {
                ...proj,
                vote_count:
                  response.data.detail === "Vote removed"
                    ? proj.vote_count - 1
                    : proj.vote_count + 1,
              }
            : proj
        )
      );
    } catch (error) {
      console.error("Failed to upvote:", error);
      alert("Failed to upvote.");
    }
  };

  const handleDownvote = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to vote.");
        return;
      }

      const response = await axios.post(
        `http://127.0.0.1:8000/projects/${projectId}/vote`,
        { is_upvote: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProjects((prevProjects) =>
        prevProjects.map((proj) =>
          proj.id === projectId
            ? {
                ...proj,
                vote_count:
                  response.data.detail === "Vote removed"
                    ? proj.vote_count + 1
                    : proj.vote_count - 1,
              }
            : proj
        )
      );
    } catch (error) {
      console.error("Failed to downvote:", error);
      alert("Failed to downvote.");
    }
  };

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="text-center text-gray-500">Loading projects...</p>
      ) : projects.length > 0 ? (
        projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            currentUser={currentUser}
            handleApply={handleApply}
            handleUpvote={handleUpvote}
            handleDownvote={handleDownvote}
            showViewProject={true}
            showCommentsLink={true}
          />
        ))
      ) : (
        <p className="text-center text-gray-500">No projects available.</p>
      )}
    </div>
  );
};

export default ProjectsPage;