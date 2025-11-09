import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * This is a custom hook that returns a 'fetch' function.
 * This wrapper automatically handles adding the auth token
 * and refreshing the token if it has expired.
 */
export const useAuthFetch = () => {
  const { auth, login, logout } = useAuth();
  const navigate = useNavigate();

  const authFetch = async (url, options) => {
    
    // 1. A helper function to make the actual request
    const makeRequest = async (token) => {
      const headers = { ...options.headers };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Do NOT set 'Content-Type': 'application/json'.
      // 'fetch' handles 'multipart/form-data' automatically
      // and sets its own boundary.
      
      return await fetch(url, { ...options, headers });
    };

    // 2. Make the initial request with the current token
    let response = await makeRequest(auth.token);

    // 3. Check for 401 (Token Expired)
    if (response.status === 401) {
      console.log('Access token expired. Attempting refresh...');
      try {
        // 4. Attempt to get a new token from the /refresh endpoint
        const refreshResponse = await fetch('http://localhost:5000/auth/refresh', {
          method: 'POST',
          credentials: 'include', // This is crucial for sending the HttpOnly cookie
        });

        const data = await refreshResponse.json();

        if (!refreshResponse.ok) {
          // If the refresh token is also bad, log the user out
          throw new Error(data.message || 'Refresh token failed');
        }

        // 5. Success! Update the auth state with the new token
        login(data); // data = { accessToken, user }
        console.log('Token refreshed successfully.');

        // 6. Retry the original request with the new token
        response = await makeRequest(data.accessToken);
        
      } catch (err) {
        // 7. Refresh failed (e.g., refresh token expired), log the user out
        console.error('Session expired. Logging out.', err);
        logout(); // This will clear context and localStorage
        navigate('/'); 
        
        // Throw an error to stop the original component's logic
        throw new Error('Your session has expired. Please log in again.');
      }
    }
    
    // 8. Return the final response (either from step 2 or step 6)
    return response;
  };

  return authFetch;
};