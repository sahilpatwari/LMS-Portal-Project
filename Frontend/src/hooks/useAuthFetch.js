import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react'; // 1. Import useCallback

/**
 * This is a custom hook that returns a 'fetch' function.
 * This wrapper automatically handles adding the auth token
 * and refreshing the token if it has expired.
 */
export const useAuthFetch = () => {
  const { auth, login, logout } = useAuth();
  const navigate = useNavigate();

  // 2. Wrap the entire authFetch function in useCallback
  const authFetch = useCallback(async (url, options={}) => {
    
    // Helper function to make the actual request
    const makeRequest = async (token) => {
      const headers = { ...(options.headers || {}) }; // Ensure headers is an object
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Do NOT set 'Content-Type': 'application/json' here.
      // 'fetch' handles 'multipart/form-data' automatically
      // and sets its own boundary.
      
      return await fetch(url, { ...options, headers });
    };

    // 3. Make the initial request with the current token
    let response = await makeRequest(auth.token);

    // 4. Check for 401 (Token Expired)
    if (response.status === 401) {
      console.log('Access token expired. Attempting refresh...');
      try {
        // 5. Attempt to get a new token from the /refresh endpoint
        const refreshResponse = await fetch('http://localhost:5000/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // This is crucial for sending the HttpOnly cookie
        });

        const data = await refreshResponse.json();

        if (!refreshResponse.ok) {
          throw new Error(data.message || 'Refresh token failed');
        }

        // 6. Success! Update the auth state with the new token
        login(data); // data = { accessToken, user }
        console.log('Token refreshed successfully.');

        // 7. Retry the original request with the NEW token
        response = await makeRequest(data.accessToken);
        
      } catch (err) {
        // 8. Refresh failed, log the user out
        console.error('Session expired. Logging out.', err);
        logout(); // This will clear context and localStorage
        navigate('/studentLogin'); // Send to a login page
        
        throw new Error('Your session has expired. Please log in again.');
      }
    }
    
    // 9. Return the final response
    return response;
    
  // 10. Add dependencies for useCallback
  }, [auth.token, login, logout, navigate]); 

  // 11. Return the memoized function
  return authFetch;
};