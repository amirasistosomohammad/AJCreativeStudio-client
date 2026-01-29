import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCustomerAuthenticated, setIsCustomerAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

      let adminAuthenticated = false;
      let customerAuthenticated = false;

      // Check admin token
      const adminToken = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (adminToken) {
        const response = await fetch(`${apiBaseUrl}/admin/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AuthContext - /admin/me response:', JSON.stringify(data, null, 2));
          setUser(data.user);
          adminAuthenticated = true;
        } else if (response.status === 401 || response.status === 403) {
          // Token invalid/expired – clear it
          localStorage.removeItem('token');
          localStorage.removeItem('admin_token');
        }
      }

      // Check for customer token
      const customerToken = localStorage.getItem('customer_token');
      if (customerToken) {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${customerToken}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AuthContext - /auth/me response:', JSON.stringify(data, null, 2));
          setCustomer(data.customer);
          customerAuthenticated = true;
        } else if (response.status === 401 || response.status === 403) {
          // Token invalid/expired – clear it
          localStorage.removeItem('customer_token');
        }
      }

      // Apply auth state (admin + customer are independent)
      setIsAuthenticated(adminAuthenticated);
      setIsCustomerAuthenticated(customerAuthenticated);

      if (!adminAuthenticated) {
        setUser(null);
      }
      if (!customerAuthenticated) {
        setCustomer(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Keep tokens so we can retry if this was just a transient error
      setIsAuthenticated(false);
      setIsCustomerAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token (use 'token' for Sanctum, but keep 'admin_token' for backward compatibility)
        localStorage.setItem('token', data.token);
        localStorage.setItem('admin_token', data.token); // Backward compatibility
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return { 
          success: false, 
          error: data.message || 'Login failed. Please check your credentials.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  const logoutAdmin = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const adminToken = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (adminToken) {
        await fetch(`${apiBaseUrl}/admin/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove admin tokens only
      localStorage.removeItem('token');
      localStorage.removeItem('admin_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const logoutCustomer = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const customerToken = localStorage.getItem('customer_token');
      if (customerToken) {
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${customerToken}`,
            'Accept': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Customer logout error:', error);
    } finally {
      // Remove customer token only
      localStorage.removeItem('customer_token');
      setCustomer(null);
      setIsCustomerAuthenticated(false);
    }
  };

  // Get tokens from localStorage - these are reactive
  // Note: These values are computed on each render, but the actual auth state
  // is managed by the state variables above (isAuthenticated, isCustomerAuthenticated)
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  const customerToken = localStorage.getItem('customer_token');

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        admin: user, // Alias for backward compatibility
        token, // Admin token for API calls
        customerToken, // Customer token for API calls
        loading,
        isAuthenticated, // Admin authentication state (used for admin routes)
        isCustomerAuthenticated, // Specific customer auth state
        login,
        logout: logoutAdmin, // Backward compatible: "logout" is admin logout
        logoutAdmin,
        logoutCustomer,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

