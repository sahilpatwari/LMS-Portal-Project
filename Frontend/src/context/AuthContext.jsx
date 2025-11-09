import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Get initial state from localStorage
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      return { token, user: JSON.parse(user) };
    }
    return { token: null, user: null };
  });

  /**
   * Updates auth state. Can be called with full login data
   * or just a partial { accessToken } on refresh.
   */
  const login = (data) => {
    // data = { accessToken, user } from login
    // OR data = { accessToken, user } from refresh
    
    // Persist the new token
    localStorage.setItem('accessToken', data.accessToken);
    
    // Persist the user data ONLY if it's provided (on initial login/refresh)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Set the new state
    setAuth(prevAuth => ({
      token: data.accessToken,
      user: data.user || prevAuth.user, // Keep old user data if new isn't provided
    }));
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include', 
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    
    setAuth({ token: null, user: null });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};