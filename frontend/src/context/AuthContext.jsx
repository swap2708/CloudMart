import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext(null);

// Helper function to decode JWT payload safely
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cloudmart_token'));
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const logout = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    localStorage.removeItem('cloudmart_token');
    localStorage.removeItem('cloudmart_user');
    setToken(null);
    setUser(null);
  }, []);

  // Schedule auto-logout when token expires
  const scheduleAutoLogout = useCallback((expiresAtMs) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    const timeout = expiresAtMs - Date.now();
    if (timeout <= 0) {
      logout();
    } else {
      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, timeout);
    }
  }, [logout]);

  // Validate and load session on initial mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('cloudmart_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      const decoded = decodeJwt(storedToken);
      if (!decoded || !decoded.exp || Date.now() >= decoded.exp * 1000) {
        logout();
        if (isMounted) setLoading(false);
        return;
      }

      scheduleAutoLogout(decoded.exp * 1000);

      try {
        const userData = await authApi.getMe();
        if (isMounted) {
          setUser(userData);
          localStorage.setItem('cloudmart_user', JSON.stringify(userData));
        }
      } catch (err) {
        console.warn('Could not fetch user profile with token, falling back to payload:', err);
        if (isMounted) {
          setUser({
            id: decoded.user_id,
            email: decoded.sub,
            role: decoded.role,
            full_name: decoded.full_name || decoded.sub,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [logout, scheduleAutoLogout]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const accessToken = res.access_token;

    localStorage.setItem('cloudmart_token', accessToken);
    setToken(accessToken);

    const decoded = decodeJwt(accessToken);
    if (decoded && decoded.exp) {
      scheduleAutoLogout(decoded.exp * 1000);
    }

    try {
      const profile = await authApi.getMe();
      setUser(profile);
      localStorage.setItem('cloudmart_user', JSON.stringify(profile));
      return profile;
    } catch {
      const fallbackUser = {
        id: decoded?.user_id,
        email: decoded?.sub || credentials.email,
        role: decoded?.role || 'customer',
        full_name: credentials.email,
      };
      setUser(fallbackUser);
      localStorage.setItem('cloudmart_user', JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  const register = async (userData) => {
    const newUser = await authApi.register(userData);
    return newUser;
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
