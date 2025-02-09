const ActionsSection = ({ userPosts, loading }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">Actions</h3>
            <button className="border border-green-700 text-white bg-green-700 font-semibold px-2 shadow-sm rounded-md cursor-pointer hover:bg-green-600">
                New Post
            </button>
        </div>

        <h4 className="font-semibold mb-2">Posts</h4>
        {loading ? (
            <p className="text-gray-600">Loading posts...</p>
        ) : userPosts.length > 0 ? (
            userPosts.map((post) => (
                <div key={post.id} className="bg-white p-4 mb-3 border-b border-gray-200 last:border-0">
                    <h5 className="font-semibold">{post.title}</h5>
                    <div className="text-gray-600 line-clamp-1" dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
            ))
        ) : (
            <p className="text-gray-700">No posts found.</p>
        )}
    </div>
);

export default ActionsSection;
