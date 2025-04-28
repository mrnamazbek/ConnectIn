# ConnectIn Frontend

ConnectIn is a platform designed to connect professional teams with project owners in a seamless and efficient way.

## Authentication System

The application uses a modern Zustand-based authentication system with the following features:

- Token-based authentication with JWT (JSON Web Tokens)
- Automatic token refresh before expiration
- Token rotation for improved security
- OAuth support for Google and GitHub login
- Persistent login state management
- Secure token storage
- Axios interceptors for automatic token handling

### Auth Store (Zustand)

The authentication state is managed using Zustand, a lightweight state management library:

```js
// Import and use the auth store
import useAuthStore from '../store/authStore';

// In a component
const { 
  isAuthenticated, 
  user, 
  login, 
  logout, 
  register, 
  loading 
} = useAuthStore();
```

### Key Features

- **Automatic Token Refresh**: Tokens are refreshed automatically before they expire
- **Server-Side Token Blacklisting**: Revoked tokens are tracked on the server
- **Optimistic UI Updates**: UI reflects auth state changes immediately
- **OAuth Integration**: Seamless login with third-party providers
- **Error Handling**: Graceful handling of auth failures

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in `.env`
4. Run the development server with `npm run dev`

## Technologies Used

- React
- Vite
- Zustand (State Management)
- TailwindCSS
- Framer Motion
- Axios
