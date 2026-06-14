import React, { createContext, useState, useEffect, useContext } from 'react';
import apiFetch from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check login status on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/auth/me');
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    setError(null);
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: { name, email, password }
      });

      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
