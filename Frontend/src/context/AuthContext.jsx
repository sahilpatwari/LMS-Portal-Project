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

  const login = (data) => {
    // data = { accessToken, user }
    setAuth({ token: data.accessToken, user: data.user });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      // 1. Call the backend to revoke the token
      await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include', // This sends the HttpOnly cookie
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    
    // 2. Clear local state and localStorage regardless
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

// Custom hook to easily access the auth state
export const useAuth = () => {
  return useContext(AuthContext);
};