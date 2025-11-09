import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      return { token, user: JSON.parse(user) };
    }
    return { token: null, user: null };
  });

  // Wrap login in useCallback
  const login = useCallback((data) => {
    localStorage.setItem('accessToken', data.accessToken);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    setAuth(prevAuth => ({
      token: data.accessToken,
      user: data.user || prevAuth.user, 
    }));
  }, []); // No dependencies, this function is stable

  // Wrap logout in useCallback
  const logout = useCallback(async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include', 
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    
    setAuth({ token: null, user: null });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }, []); // No dependencies, this function is stable

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};