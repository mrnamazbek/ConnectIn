import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faGithub, faLinkedin, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { Routes, Route, NavLink, Navigate } from "react-router";
import ProjectsSection from "./ProjectsSection";
import SkillsSection from "./SkillsSection";
import ActionsSection from "./ActionsSection";

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [projects, setProjects] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://127.0.0.1:8000/users/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUser(response.data);
                setSkills(response.data.skills || []);
                setProjects(response.data.projects || []);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserPosts = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://127.0.0.1:8000/posts/my", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUserPosts(response.data);
            } catch (error) {
                console.error("Failed to fetch user posts", error);
            }
        };

        fetchUserData();
        fetchUserPosts();
    }, []);

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // ✅ Remove post from state after successful deletion
            setUserPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

            alert("Post deleted successfully!");
        } catch (error) {
            console.error("Failed to delete post:", error);
        }
    };

    // return (
    //     <div className="grid grid-cols-8 gap-4 my-5 text-black">
    //         {/* Profile Section - Only Grows as Needed */}
    //         <div className="col-span-6 bg-white p-5 shadow-sm rounded-md border border-green-700 flex flex-col self-start hover:shadow-green-700 transition">
    //             <div className="flex flex-col">
    //                 <img src="/pngimg.com - pokemon_PNG129.png" alt="Profile" className="rounded-full w-32 h-32 object-cover border border-black" />
    //             </div>

    //             {loading ? (
    //                 <p className="text-gray-600 text-center mt-4">Loading profile...</p>
    //             ) : user ? (
    //                 <div className="mt-3">
    //                     <p className="font-semibold">
    //                         {user.first_name} {user.last_name} <span className="text-sm text-gray-500">{user.username}</span>
    //                     </p>
    //                     <p>{user.position || "Position not specified"}</p>
    //                     <p className="text-sm">{user.city || "Location not specified"}</p>
    //                     <p className="text-sm">email</p>

    //                     {/* Social Links - Conditionally Rendered */}
    //                     <div className="flex space-x-5 mt-5">
    //                         {user.github && (
    //                             <a href={user.github} target="_blank" rel="noopener noreferrer">
    //                                 <FontAwesomeIcon icon={faGithub} size="xl" className="hover:text-green-700 transition" />
    //                             </a>
    //                         )}
    //                         {user.linkedin && (
    //                             <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
    //                                 <FontAwesomeIcon icon={faLinkedin} size="xl" className="hover:text-green-700 transition" />
    //                             </a>
    //                         )}
    //                         {user.telegram && (
    //                             <a href={user.telegram.startsWith("http") ? user.telegram : `https://t.me/${user.telegram}`} target="_blank" rel="noopener noreferrer">
    //                                 <FontAwesomeIcon icon={faTelegram} size="xl" className="hover:text-green-700 transition" />
    //                             </a>
    //                         )}
    //                     </div>
    //                 </div>
    //             ) : (
    //                 <p className="text-gray-600 text-center mt-4">User data not available.</p>
    //             )}
    //             {/* <div className="flex justify-center mt-5">
    //                 <button className="text-white bg-green-700 font-semibold px-2 shadow-md rounded-md cursor-pointer hover:bg-green-600">Edit Profile</button>
    //             </div> */}
    //         </div>

    //         <div className="col-span-2 flex-col space-y-5">
    //             <div className="bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
    //                 <p className="font-semibold text-lg">Projects</p>
    //                 {loading ? (
    //                     <p className="text-gray-600">Loading projects...</p>
    //                 ) : projects.length > 0 ? (
    //                     projects.map((project, index) => (
    //                         <div key={project.id} className="p-4 border-b last:border-b-0">
    //                             <h4 className="font-semibold">{project.name}</h4>
    //                             <p className="text-gray-600">{project.description}</p>
    //                             <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline">
    //                                 Enter Project
    //                             </button>
    //                         </div>
    //                     ))
    //                 ) : (
    //                     <p className="text-gray-700">No projects found.</p>
    //                 )}
    //             </div>
    //             <div className="col-span-2 bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
    //                 <p className="font-semibold text-lg">Projects</p>
    //                 {loading ? (
    //                     <p className="text-gray-600">Loading projects...</p>
    //                 ) : projects.length > 0 ? (
    //                     projects.map((project, index) => (
    //                         <div key={project.id} className="p-4 border-b last:border-b-0">
    //                             <h4 className="font-semibold">{project.name}</h4>
    //                             <p className="text-gray-600">{project.description}</p>
    //                             <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline">
    //                                 Enter Project
    //                             </button>
    //                         </div>
    //                     ))
    //                 ) : (
    //                     <p className="text-gray-700">No projects found.</p>
    //                 )}
    //             </div>
    //         </div>

    //         {/* Content Sections - Independent Growth */}
    //         <div className="col-span-6 flex flex-col space-y-4">
    //             {/* Projects Section */}
    //             <div className="bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
    //                 <p className="font-semibold text-lg">Projects</p>
    //                 {loading ? (
    //                     <p className="text-gray-600">Loading projects...</p>
    //                 ) : projects.length > 0 ? (
    //                     projects.map((project, index) => (
    //                         <div key={project.id} className="p-4 border-b last:border-b-0">
    //                             <h4 className="font-semibold">{project.name}</h4>
    //                             <p className="text-gray-600">{project.description}</p>
    //                             <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline">
    //                                 Enter Project
    //                             </button>
    //                         </div>
    //                     ))
    //                 ) : (
    //                     <p className="text-gray-700">No projects found.</p>
    //                 )}
    //             </div>

    //             {/* Skills Section */}
                // <div className="bg-white border border-green-700 shadow-sm rounded-md p-5 self-start w-full hover:shadow-green-700 transition">
                //     <div className="flex justify-between items-center mb-2">
                //         <h3 className="font-semibold text-lg">Skills</h3>
                //         <button className="text-white bg-green-700 font-semibold px-2 shadow-sm rounded-md cursor-pointer hover:bg-green-600">Add skill</button>
                //     </div>
                //     <div className="flex space-x-2">
                //         {loading ? (
                //             <p className="text-gray-600">Loading skills...</p>
                //         ) : skills.length > 0 ? (
                //             skills.map((skill, index) => (
                //                 <div key={index} className="flex">
                //                     <p className="shadow-sm rounded-md px-2 bg-green-700 text-white">{skill.name}</p>
                //                 </div>
                //             ))
                //         ) : (
                //             <p className="text-gray-700">No skills added yet.</p>
                //         )}
                //     </div>
                // </div>

    //             {/* Actions Section */}
    //             <div className="p-5 border border-green-700 rounded-md bg-white shadow-sm self-start w-full hover:shadow-green-700 transition">
    //                 <div className="flex justify-between items-center mb-2">
    //                     <h3 className="font-semibold text-lg">Actions</h3>
    //                     <button className="border border-green-700 text-white bg-green-700 font-semibold px-2 shadow-md rounded-md cursor-pointer hover:bg-green-600">New post</button>
    //                 </div>
    //                 <div>
    //                     <h4 className="font-semibold mb-2">Posts</h4>
    //                     {loading ? (
    //                         <p className="text-gray-600">Loading posts...</p>
    //                     ) : userPosts.length > 0 ? (
    //                         userPosts.map((post) => (
    //                             <div key={post.id} className="bg-white p-4 mb-3 border-b border-gray-200 last:border-0">
    //                                 <h5 className="font-semibold line-clamp-1">{post.title}</h5>
    //                                 <div className="text-gray-600 line-clamp-1" dangerouslySetInnerHTML={{ __html: post.content }} />
    //                                 <div className="flex space-x-2">
    //                                     {post.tags.length > 0 &&
    //                                         post.tags.map((tag, index) => (
    //                                             <span key={index} className="text-xs bg-gray-200 px-2 py-1 rounded-md mt-2">
    //                                                 {tag}
    //                                             </span>
    //                                         ))}
    //                                 </div>
    //                                 <div className="flex justify-end">
    //                                     <button className="hover:text-red-700" onClick={() => handleDeletePost(post.id)}>
    //                                         <FontAwesomeIcon icon={faTrashAlt} className="cursor-pointer" />
    //                                     </button>
    //                                 </div>
    //                             </div>
    //                         ))
    //                     ) : (
    //                         <p className="text-gray-700">No posts found.</p>
    //                     )}
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // );
    return (
        <div className="grid grid-cols-8 gap-4 my-5 text-black">
            {/* Profile Section */}
            <div className="col-span-6 bg-white p-5 shadow-sm rounded-md border border-green-700 flex flex-col self-start hover:shadow-green-700 transition">
                <div className="flex flex-col">
                    <img src="/pngimg.com - pokemon_PNG129.png" alt="Profile" className="rounded-full w-32 h-32 object-cover border border-black" />
                </div>

                {loading ? (
                    <p className="text-gray-600 mt-4">Loading profile...</p>
                ) : user ? (
                    <div className="mt-3">
                        <p className="font-semibold">
                            {user.first_name} {user.last_name} <span className="text-sm text-gray-500">{user.username}</span>
                        </p>
                        <p>{user.position || "Position not specified"}</p>
                        <p className="text-sm">{user.city || "Location not specified"}</p>
                        <a href="mailto:" rel="noopener noreferrer" className="text-sm text-blue-600 font-semibold hover:underline hover:underline-offset-2">
                            {user.email}
                        </a>

                        {/* Social Links */}
                        <div className="flex justify-center space-x-5 mt-4">
                            {user.github && (
                                <a href={user.github} target="_blank" rel="noopener noreferrer">
                                    <FontAwesomeIcon icon={faGithub} size="lg" className="hover:text-green-700 transition" />
                                </a>
                            )}
                            {user.linkedin && (
                                <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
                                    <FontAwesomeIcon icon={faLinkedin} size="lg" className="hover:text-green-700 transition" />
                                </a>
                            )}
                            {user.telegram && (
                                <a href={user.telegram.startsWith("http") ? user.telegram : `https://t.me/${user.telegram}`} target="_blank" rel="noopener noreferrer">
                                    <FontAwesomeIcon icon={faTelegram} size="lg" className="hover:text-green-700 transition" />
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-600 text-center mt-4">User data not available.</p>
                )}
            </div>

            <div className="col-span-2 flex-col space-y-5">
                <div className="bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
                    <p className="font-semibold text-lg">Projects</p>
                    {loading ? (
                        <p className="text-gray-600">Loading projects...</p>
                    ) : projects.length > 0 ? (
                        projects.map((project, index) => (
                            <div key={project.id} className="p-4 border-b last:border-b-0">
                                <h4 className="font-semibold">{project.name}</h4>
                                <p className="text-gray-600">{project.description}</p>
                                <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline">
                                    Enter Project
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-700">No projects found.</p>
                    )}
                </div>
                <div className="col-span-2 bg-white border border-green-700 rounded-md shadow-sm p-5 self-start w-full hover:shadow-green-700 transition">
                    <p className="font-semibold text-lg">Projects</p>
                    {loading ? (
                        <p className="text-gray-600">Loading projects...</p>
                    ) : projects.length > 0 ? (
                        projects.map((project, index) => (
                            <div key={project.id} className="p-4 border-b last:border-b-0">
                                <h4 className="font-semibold">{project.name}</h4>
                                <p className="text-gray-600">{project.description}</p>
                                <button onClick={() => console.log(`Entered ${project.name}!`)} className="hover:text-green-700 transition duration-300 cursor-pointer underline">
                                    Enter Project
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-700">No projects found.</p>
                    )}
                </div>
            </div>

            {/* Main Section with Navigation Menu */}
            <div className="col-span-6 bg-white border border-green-700 rounded-md shadow-sm p-5 w-full hover:shadow-green-700 transition">
                {/* Navigation Tabs */}
                <div className="flex mb-4 space-x-5 border-b border-gray-300 ">
                    <NavLink to="/profile/projects" className={({ isActive }) => (isActive ? "text-green-700 py-1" : "hover:text-green-700 py-1")}>
                        Projects
                    </NavLink>
                    <NavLink to="/profile/skills" className={({ isActive }) => (isActive ? "text-green-700 py-1" : "hover:text-green-700 py-1")}>
                        Skills
                    </NavLink>
                    <NavLink to="/profile/actions" className={({ isActive }) => (isActive ? "text-green-700 py-1" : "hover:text-green-700 py-1")}>
                        Actions
                    </NavLink>
                </div>

                {/* Routes for Sections */}
                <Routes>
                    <Route index element={<Navigate to="projects" />} />
                    <Route path="projects" element={<ProjectsSection user={user} projects={projects} loading={loading} />} />
                    <Route path="skills" element={<SkillsSection setSkills={setSkills} skills={skills} loading={loading} />} />
                    <Route path="actions" element={<ActionsSection userPosts={userPosts} loading={loading} />} />
                </Routes>
            </div>
        </div>
    );
};

export default UserProfile;
