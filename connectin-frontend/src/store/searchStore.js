import { create } from 'zustand';
import axios from 'axios';

const useSearchStore = create((set, get) => ({
  // Search state
  query: '',
  loading: false,
  error: null,
  results: {
    posts: [],
    projects: [],
  },
  // Cache for client-side search fallback
  cachedData: {
    posts: [],
    projects: [],
    lastFetched: null
  },
  activeTab: 'all', // 'all', 'posts', 'projects'
  hasSearched: false,

  // Set active tab
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Set query
  setQuery: (query) => set({ query }),

  // Clear search results
  clearResults: () => set({ 
    results: { posts: [], projects: [] }, 
    hasSearched: false,
    error: null 
  }),

  // Load all data for client-side search
  loadAllData: async () => {
    const { cachedData } = get();
    const now = new Date();
    
    // Only fetch if we haven't cached or cache is older than 5 minutes
    if (!cachedData.lastFetched || (now - cachedData.lastFetched) > 5 * 60 * 1000) {
      try {
        // Fetch all posts and projects
        const [postsResponse, projectsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/posts/`),
          axios.get(`${import.meta.env.VITE_API_URL}/projects/`)
        ]);
        
        set({
          cachedData: {
            posts: postsResponse.data.items || [],
            projects: projectsResponse.data.items || [],
            lastFetched: new Date()
          }
        });
        
        return {
          posts: postsResponse.data.items || [],
          projects: projectsResponse.data.items || []
        };
      } catch (error) {
        console.error('Error loading all data for client-side search:', error);
        return { posts: [], projects: [] };
      }
    }
    
    return {
      posts: cachedData.posts,
      projects: cachedData.projects
    };
  },
  
  // Perform client-side search
  performClientSideSearch: (query) => {
    const { cachedData } = get();
    const lowercaseQuery = query.toLowerCase();
    
    // Filter posts
    const filteredPosts = cachedData.posts.filter(post => 
      post.title?.toLowerCase().includes(lowercaseQuery) || 
      post.content?.toLowerCase().includes(lowercaseQuery) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    // Filter projects
    const filteredProjects = cachedData.projects.filter(project => 
      project.name?.toLowerCase().includes(lowercaseQuery) || 
      project.description?.toLowerCase().includes(lowercaseQuery) ||
      project.tags?.some(tag => tag.name.toLowerCase().includes(lowercaseQuery)) ||
      project.skills?.some(skill => skill.name.toLowerCase().includes(lowercaseQuery))
    );
    
    return {
      posts: filteredPosts,
      projects: filteredProjects
    };
  },

  // Search function that fetches both posts and projects
  search: async (query, options = {}) => {
    const { abort = false, page = 1, page_size = 10 } = options;
    
    // If abort is true and we're already loading, don't proceed
    if (abort && get().loading) return;
    
    // Update query in store
    set({ query, loading: true, error: null, hasSearched: true });

    // Trim the query to handle whitespace properly
    const trimmedQuery = query.trim();

    // Check if query is valid for server-side search (at least 3 characters)
    const useServerSearch = trimmedQuery.length >= 3;
    
    if (!useServerSearch) {
      // For empty or very short queries, clear results and finish loading
      set({ 
        loading: false, 
        error: trimmedQuery.length === 0 ? null : 'Search query must be at least 3 characters long',
        results: { posts: [], projects: [] }
      });
      return { posts: [], projects: [] };
    }

    try {
      // Attempt to load all data for client-side search if not already loaded
      await get().loadAllData();

      // Build the search URLs with proper query parameters
      const postsSearchUrl = `${import.meta.env.VITE_API_URL}/posts/search?query=${encodeURIComponent(trimmedQuery)}&page=${page}&page_size=${page_size}`;
      const projectsSearchUrl = `${import.meta.env.VITE_API_URL}/projects/search?query=${encodeURIComponent(trimmedQuery)}&page=${page}&page_size=${page_size}`;

      // Try server-side search first
      const serverSearchPromise = Promise.all([
        axios.get(postsSearchUrl)
          .catch(error => {
            console.warn('Posts search API error (falling back to client-side):', error);
            return { data: null };
          }),
        axios.get(projectsSearchUrl)
          .catch(error => {
            console.warn('Projects search API error (falling back to client-side):', error);
            return { data: null };
          })
      ]);

      const [postsResponse, projectsResponse] = await serverSearchPromise;
      let results;

      // If both API searches fail, use client-side search
      if (postsResponse.data === null && projectsResponse.data === null) {
        console.log('Using client-side search as fallback');
        results = get().performClientSideSearch(trimmedQuery);
      } else {
        // Use a mix of API and client-side results if needed
        results = {
          posts: postsResponse.data !== null ? postsResponse.data : get().performClientSideSearch(trimmedQuery).posts,
          projects: projectsResponse.data !== null ? projectsResponse.data : get().performClientSideSearch(trimmedQuery).projects
        };
      }

      // Set results
      set({
        results,
        loading: false
      });
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      
      // Fall back to client-side search
      const clientResults = get().performClientSideSearch(trimmedQuery);
      
      set({ 
        loading: false, 
        results: clientResults,
        error: clientResults.posts.length === 0 && clientResults.projects.length === 0 
          ? 'No results found' 
          : null
      });
      
      return clientResults;
    }
  },

  // Get filtered results based on active tab
  getFilteredResults: () => {
    const { results, activeTab } = get();
    
    switch (activeTab) {
      case 'posts':
        return { posts: results.posts, projects: [] };
      case 'projects':
        return { posts: [], projects: results.projects };
      case 'all':
      default:
        return results;
    }
  },

  // Get total count of search results
  getTotalCount: () => {
    const { results } = get();
    return results.posts.length + results.projects.length;
  }
}));

export default useSearchStore; 