import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  /*
   * Determine admin status from the user object.
   */
  const determineAdminStatus = useCallback((userData) => {
    if (!userData) return false;

    return (
      userData.isAdmin === true ||
      userData.role === 'admin' 
    );
  }, []);

  /*
   * Restore authentication when the app starts.
   */
  useEffect(() => {
    const restoreAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');


        if (!storedToken || !storedUser) {
          console.log('⚠️ No stored authentication found');
          setUser(null);
          setToken(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        let parsedUser;

        try {
          parsedUser = JSON.parse(storedUser);
        } catch (parseError) {
          console.error('❌ Invalid stored user:', parseError);

          localStorage.removeItem('user');
          localStorage.removeItem('token');

          setUser(null);
          setToken(null);
          setIsAdmin(false);
          setLoading(false);

          return;
        }

        if (!parsedUser) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');

          setUser(null);
          setToken(null);
          setIsAdmin(false);
          setLoading(false);

          return;
        }

        const adminStatus = determineAdminStatus(parsedUser);

        setToken(storedToken);
        setUser(parsedUser);
        setIsAdmin(adminStatus);
        
      } catch (err) {
        console.error('❌ Authentication restore failed:', err);

        localStorage.removeItem('user');
        localStorage.removeItem('token');

        setUser(null);
        setToken(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, [determineAdminStatus]);

  /*
   * Login
   */
  const login = async (email, password) => {
    try {
      setError(null);

      console.log('🔐 Logging in:', email);

      const response = await authAPI.login({
        email,
        password,
      });

      console.log('🔐 Login response:', response);

      if (!response?.success) {
        const loginError = response?.error || 'Login failed';
        setError(loginError);

        return {
          success: false,
          error: loginError,
        };
      }

      /*
       * The backend should return a JWT/token.
       */
      const newToken = response.token;

      if (!newToken) {
        console.error('❌ Login succeeded but no token was returned');

        return {
          success: false,
          error: 'Login succeeded but no authentication token was returned',
        };
      }

      let userData = response.user || {
        email,
      };

      /*
       * Get the latest profile from the backend.
       */
      try {
        const profileResponse = await authAPI.getProfile();

        console.log('👤 Profile response:', profileResponse);

        if (profileResponse?.success && profileResponse?.profile) {
          userData = {
            ...userData,
            ...profileResponse.profile,
          };
        }
      } catch (profileError) {
        console.warn(
          '⚠️ Profile request failed, using login user data:',
          profileError
        );
      }

      /*
       * Determine admin status.
       */
      const adminStatus = determineAdminStatus(userData);

      userData = {
        ...userData,
        isAdmin: adminStatus,
      };

      /*
       * Persist authentication FIRST.
       */
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      /*
       * Then update React state.
       */
      setToken(newToken);
      setUser(userData);
      setIsAdmin(adminStatus);

      console.log('👤 User:', userData);
						
      return {
        success: true,
        isAdmin: adminStatus,
        user: userData,
        token: newToken,
      };
    } catch (err) {
      console.error('❌ Login error:', err);

      const message =
        err?.response?.data?.error ||
        err?.error ||
        err?.message ||
        'Login failed';

      setError(message);

      return {
        success: false,
        error: message,
      };
    }
  };

  /*
   * Registration
   */
  const register = async (email, password, full_name) => {
    try {
      setError(null);

      const response = await authAPI.register({
        email,
        password,
        full_name,
      });

      if (response?.success) {
        return {
          success: true,
          user: response.user,
        };
      }

      return {
        success: false,
        error: response?.error || 'Registration failed',
      };
    } catch (err) {
      console.error('❌ Registration error:', err);

      const message =
        err?.response?.data?.error ||
        err?.error ||
        err?.message ||
        'Registration failed';

      setError(message);

      return {
        success: false,
        error: message,
      };
    }
  };

  /*
   * Logout
   */
  const logout = () => {
    console.log('🚪 Logging out...');

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setToken(null);
    setIsAdmin(false);
    setError(null);

    console.log('✅ Logged out');
  };

  /*
   * Update current user.
   */
  const updateUser = (updatedData) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...updatedData,
    };

    const adminStatus = determineAdminStatus(updatedUser);

    updatedUser.isAdmin = adminStatus;

    localStorage.setItem('user', JSON.stringify(updatedUser));

    setUser(updatedUser);
    setIsAdmin(adminStatus);
  };

  const isAuthenticated = Boolean(user && token);

  const value = {
    user,
    token,
    loading,
    error,

    login,
    register,
    logout,
    updateUser,

    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};