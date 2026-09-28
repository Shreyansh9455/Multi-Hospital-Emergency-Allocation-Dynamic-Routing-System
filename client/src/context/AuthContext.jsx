import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('med_dispatch_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('med_dispatch_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync / verify user session on mount
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await getCurrentUser();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('med_dispatch_user', JSON.stringify(res.data));
          } else {
            // Token might be invalid or expired
            logout();
          }
        } catch {
          // If server offline or network error, keep cached user session
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    if (result.success && result.data) {
      setToken(result.data.token);
      setUser(result.data.user);
      return { success: true, user: result.data.user };
    }
    return { success: false, error: result.error || 'Login failed' };
  };

  const logout = () => {
    localStorage.removeItem('med_dispatch_token');
    localStorage.removeItem('med_dispatch_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  const isDistrictAdmin = user?.role === 'districtAdmin';
  const isHospitalStaff = user?.role === 'hospitalStaff';
  const isAmbulanceDriver = user?.role === 'ambulanceDriver';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        role: user?.role || null,
        isDistrictAdmin,
        isHospitalStaff,
        isAmbulanceDriver,
        hasRole,
        login,
        logout,
      }}
    >
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

export default AuthContext;
