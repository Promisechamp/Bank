import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Check multiple sources for admin status
        const adminStatus = parsedUser?.isAdmin || 
                           parsedUser?.role === 'admin' || 
                           parsedUser?.email === 'admin@bank.com' ||
                           false;
        setIsAdmin(adminStatus);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        // Get user profile to check role from database
        let userData = response.user;
        let adminStatus = false;
        
        try {
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.success) {
            userData = {
              ...userData,
              ...profileResponse.profile,
            };
            // Check admin from multiple sources
            adminStatus = profileResponse.profile?.role === 'admin' || 
                         email === 'admin@bank.com' ||
                         profileResponse.profile?.email === 'admin@bank.com';
            userData.isAdmin = adminStatus;
          }
        } catch (profileError) {
          // If profile fetch fails, fallback to email check
          adminStatus = email === 'admin@bank.com';
          userData.isAdmin = adminStatus;
        }
        
        // Store user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAdmin(adminStatus);
        
        return { 
          success: true, 
          isAdmin: adminStatus,
          user: userData 
        };
      }
      return { success: false, error: response.error };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (email, password, full_name) => {
    try {
      setError(null);
      const response = await authAPI.register({ email, password, full_name });
      
      if (response.success) {
        return { success: true, user: response.user };
      }
      return { success: false, error: response.error };
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAdmin(false);
  };

  const updateUser = (updatedData) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      const adminStatus = updatedUser?.isAdmin || 
                         updatedUser?.role === 'admin' || 
                         updatedUser?.email === 'admin@bank.com' ||
                         false;
      setIsAdmin(adminStatus);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};