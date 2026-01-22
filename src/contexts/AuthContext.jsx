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
      
      // Check for admin token first
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
          setIsAuthenticated(true);
          setIsCustomerAuthenticated(false);
          setCustomer(null);
          setLoading(false);
          return;
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
          setIsCustomerAuthenticated(true);
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        } else if (response.status === 401 || response.status === 403) {
          // Token invalid/expired – clear it
          localStorage.removeItem('customer_token');
        }
      }

      // No valid tokens found
      setUser(null);
      setCustomer(null);
      setIsAuthenticated(false);
      setIsCustomerAuthenticated(false);
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

  const logout = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Handle admin logout
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
      
      // Handle customer logout - call backend to revoke token
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
      console.error('Logout error:', error);
    } finally {
      // Always remove tokens from localStorage and clear state
      localStorage.removeItem('token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('customer_token');
      setUser(null);
      setCustomer(null);
      setIsAuthenticated(false);
      setIsCustomerAuthenticated(false);
    }
  };

  // Get tokens from localStorage - these are reactive
  // Note: These values are computed on each render, but the actual auth state
  // is managed by the state variables above (isAuthenticated, isCustomerAuthenticated)
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  const customerToken = localStorage.getItem('customer_token');

  // For backward compatibility, also expose as 'admin'
  // isAuthenticated now represents either admin OR customer authentication
  const combinedIsAuthenticated = isAuthenticated || isCustomerAuthenticated;

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        admin: user, // Alias for backward compatibility
        token, // Admin token for API calls
        customerToken, // Customer token for API calls
        loading,
        isAuthenticated: combinedIsAuthenticated, // Combined auth state for backward compatibility
        isCustomerAuthenticated, // Specific customer auth state
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

