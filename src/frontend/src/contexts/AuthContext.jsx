import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('optimizer_user');
      if (savedUser) {
        try {
          const { data } = await apiClient.get('/auth/me');
          const user = { ...JSON.parse(savedUser), ...data, role: data.role.toUpperCase() };
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to fetch user, logging out", error);
          localStorage.removeItem('optimizer_user');
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
    
    const handleAuthError = () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { data: tokenData } = await apiClient.post('/auth/login', { email, password });
      const tempUser = { access_token: tokenData.access_token };
      localStorage.setItem('optimizer_user', JSON.stringify(tempUser));
      
      const { data: userData } = await apiClient.get('/auth/me');
      const user = { 
        ...tempUser, 
        ...userData,
        id: userData.id || 'u1',
        name: userData.full_name || userData.name || userData.email,
        role: userData.role.toUpperCase() 
      };
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('optimizer_user', JSON.stringify(user));
      return user;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('optimizer_user');
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    role: currentUser?.role
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
