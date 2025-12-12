import { create } from "zustand";
import axios from "axios";

const useSearchStore = create((set, get) => ({
    // Search state
    query: "",
    loading: false,
    error: null,
    results: {
        posts: [],
        projects: [],
        users: [],
    },
    // Cache for client-side search fallback
    cachedData: {
        posts: [],
        projects: [],
        users: [],
        lastFetched: null,
    },
    activeTab: "all", // 'all', 'posts', 'projects', 'users'
    hasSearched: false,
    
    // Pagination
    pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
    },

    // Set active tab
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Set query
    setQuery: (query) => set({ query }),

    // Update pagination
    setPagination: (paginationData) => set({
        pagination: { ...get().pagination, ...paginationData }
    }),

    // Clear search results
    clearResults: () =>
        set({
            results: { posts: [], projects: [], users: [] },
            hasSearched: false,
            error: null,
            pagination: {
                currentPage: 1,
                pageSize: 10,
                totalItems: 0,
            }
        }),

    // Load data for specific type only when needed
    loadDataByType: async (type) => {
        const { cachedData } = get();
        const now = new Date();
        const cacheTimeout = 5 * 60 * 1000; // 5 minutes

        // Only fetch if we haven't cached or cache is older than 5 minutes
        if (!cachedData.lastFetched || now - cachedData.lastFetched > cacheTimeout) {
            try {
                let updatedCache = { ...cachedData };
                
                if (type === 'posts' || type === 'all') {
                    const postsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/posts/`);
                    updatedCache.posts = postsResponse.data.items || [];
                }
                
                if (type === 'projects' || type === 'all') {
                    const projectsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/projects/`);
                    updatedCache.projects = projectsResponse.data.items || [];
                }
                
                if (type === 'users' || type === 'all') {
                    const usersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/users/`);
                    updatedCache.users = usersResponse.data || [];
                }
                
                updatedCache.lastFetched = now;
                set({ cachedData: updatedCache });
                
                return updatedCache;
            } catch (error) {
                console.error(`Error loading ${type} data for client-side search:`, error);
                return cachedData;
            }
        }

        return cachedData;
    },

    // Perform client-side search with pagination
    performClientSideSearch: (query, page = 1, pageSize = 10) => {
        const { cachedData, activeTab } = get();
        const lowercaseQuery = query.toLowerCase();
        let results = { posts: [], projects: [], users: [] };
        
        // Only search in types that are needed based on activeTab
        if (activeTab === 'all' || activeTab === 'posts') {
            // Filter posts
            const allFilteredPosts = cachedData.posts.filter(
                (post) => 
                    post.title?.toLowerCase().includes(lowercaseQuery) || 
                    post.content?.toLowerCase().includes(lowercaseQuery) || 
                    post.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
            );
            
            // Apply pagination to posts
            const startIdx = (page - 1) * pageSize;
            results.posts = allFilteredPosts.slice(startIdx, startIdx + pageSize);
            
            // Set total count for pagination
            if (activeTab === 'posts') {
                set(state => ({
                    pagination: {
                        ...state.pagination,
                        totalItems: allFilteredPosts.length
                    }
                }));
            }
        }

        if (activeTab === 'all' || activeTab === 'projects') {
            // Filter projects
            const allFilteredProjects = cachedData.projects.filter(
                (project) =>
                    project.name?.toLowerCase().includes(lowercaseQuery) || 
                    project.description?.toLowerCase().includes(lowercaseQuery) || 
                    project.tags?.some((tag) => tag.name.toLowerCase().includes(lowercaseQuery)) || 
                    project.skills?.some((skill) => skill.name.toLowerCase().includes(lowercaseQuery))
            );
            
            // Apply pagination to projects
            const startIdx = (page - 1) * pageSize;
            results.projects = allFilteredProjects.slice(startIdx, startIdx + pageSize);
            
            // Set total count for pagination
            if (activeTab === 'projects') {
                set(state => ({
                    pagination: {
                        ...state.pagination,
                        totalItems: allFilteredProjects.length
                    }
                }));
            }
        }

        if (activeTab === 'all' || activeTab === 'users') {
            // Filter users
            const allFilteredUsers = cachedData.users.filter(
                (user) => 
                    user.username?.toLowerCase().includes(lowercaseQuery) || 
                    user.first_name?.toLowerCase().includes(lowercaseQuery) || 
                    user.last_name?.toLowerCase().includes(lowercaseQuery)
            );
            
            // Apply pagination to users
            const startIdx = (page - 1) * pageSize;
            results.users = allFilteredUsers.slice(startIdx, startIdx + pageSize);
            
            // Set total count for pagination
            if (activeTab === 'users') {
                set(state => ({
                    pagination: {
                        ...state.pagination,
                        totalItems: allFilteredUsers.length
                    }
                }));
            }
        }

        // Calculate total items for 'all' tab
        if (activeTab === 'all') {
            set(state => ({
                pagination: {
                    ...state.pagination,
                    totalItems: results.posts.length + results.projects.length + results.users.length
                }
            }));
        }

        return results;
    },

    // Optimized search function that fetches only data for the active tab
    search: async (query, options = {}) => {
        const { abort = false, page = 1, pageSize = 10 } = options;
        const { activeTab } = get();

        // If abort is true and we're already loading, don't proceed
        if (abort && get().loading) return;

        // Update query in store
        set({ 
            query, 
            loading: true, 
            error: null, 
            hasSearched: true,
            pagination: {
                ...get().pagination,
                currentPage: page,
                pageSize: pageSize
            }
        });

        // Trim the query to handle whitespace properly
        const trimmedQuery = query.trim();

        // Check if query is valid for server-side search (at least 3 characters)
        const useServerSearch = trimmedQuery.length >= 3;

        if (!useServerSearch) {
            // For empty or very short queries, clear results and finish loading
            set({
                loading: false,
                error: trimmedQuery.length === 0 ? null : "Search query must be at least 3 characters long",
                results: { posts: [], projects: [], users: [] },
            });
            return { posts: [], projects: [], users: [] };
        }

        try {
            // Determine which endpoints to call based on activeTab
            let endpointsToCall = [];
            
            if (activeTab === 'all' || activeTab === 'posts') {
                endpointsToCall.push({
                    type: 'posts',
                    url: `${import.meta.env.VITE_API_URL}/posts/search?query=${encodeURIComponent(trimmedQuery)}&page=${page}&page_size=${pageSize}`
                });
            }
            
            if (activeTab === 'all' || activeTab === 'projects') {
                endpointsToCall.push({
                    type: 'projects',
                    url: `${import.meta.env.VITE_API_URL}/projects/search?query=${encodeURIComponent(trimmedQuery)}&page=${page}&page_size=${pageSize}`
                });
            }
            
            if (activeTab === 'all' || activeTab === 'users') {
                endpointsToCall.push({
                    type: 'users',
                    url: `${import.meta.env.VITE_API_URL}/users/search?query=${encodeURIComponent(trimmedQuery)}`
                });
            }
            
            // Make API calls in parallel only for the needed types
            const apiResults = await Promise.all(
                endpointsToCall.map(endpoint => 
                    axios.get(endpoint.url)
                        .then(response => ({ type: endpoint.type, data: response.data, success: true }))
                        .catch(error => {
                            console.warn(`${endpoint.type} search API error (falling back to client-side):`, error);
                            return { type: endpoint.type, data: null, success: false };
                        })
                )
            );
            
            // Process results
            let results = { posts: [], projects: [], users: [] };
            let useClientSideFallback = false;
            
            apiResults.forEach(result => {
                if (result.success && result.data) {
                    results[result.type] = result.data;
                } else {
                    useClientSideFallback = true;
                }
            });
            
            // If any API call failed, load necessary data for client-side search
            if (useClientSideFallback) {
                // Load only the data types we need based on activeTab
                await get().loadDataByType(activeTab);
                
                // Perform client-side search for missing data types
                const clientSideResults = get().performClientSideSearch(trimmedQuery, page, pageSize);
                
                // Merge API results with client-side results
                apiResults.forEach(result => {
                    if (!result.success || !result.data) {
                        results[result.type] = clientSideResults[result.type];
                    }
                });
            }

            // Set results
            set({
                results,
                loading: false,
            });

            return results;
        } catch (error) {
            console.error("Search error:", error);

            // Only load data for the active tab
            await get().loadDataByType(activeTab);
            
            // Fall back to client-side search
            const clientResults = get().performClientSideSearch(trimmedQuery, page, pageSize);

            set({
                loading: false,
                results: clientResults,
                error: 
                    clientResults.posts.length === 0 && 
                    clientResults.projects.length === 0 && 
                    clientResults.users.length === 0 ? "No results found" : null,
            });

            return clientResults;
        }
    },

    // Get filtered results based on active tab
    getFilteredResults: () => {
        const { results, activeTab } = get();

        switch (activeTab) {
            case "posts":
                return { posts: results.posts, projects: [], users: [] };
            case "projects":
                return { posts: [], projects: results.projects, users: [] };
            case "users":
                return { posts: [], projects: [], users: results.users };
            case "all":
            default:
                return results;
        }
    },

    // Get total count of search results
    getTotalCount: () => {
        const { results } = get();
        return results.posts.length + results.projects.length + results.users.length;
    },

    // Get pagination data
    getPagination: () => {
        return get().pagination;
    }
}));

export default useSearchStore;
