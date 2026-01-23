import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { showAlert } from '../../../services/notificationService';
import { useBranding } from '../../../contexts/BrandingContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { logoSrc, logoText } = useBranding();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showAlert.error('Email required', 'Please enter your email address.', {
        width: 320,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
      });
      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      // Handle Google account response
      if (response.ok && data.code === 'GOOGLE_ACCOUNT') {
        showAlert.info(
          'Google Account Detected',
          'This account was created with Google. Please use "Sign in with Google" to access your account.',
          {
            width: 400,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4285F4',
          }
        ).then(() => {
          navigate('/auth/login');
        });
        return;
      }

      // Handle success (generic message for security)
      if (response.ok && data.success) {
        showAlert.success(
          'Reset link sent',
          'If an account exists with this email, a password reset link has been sent. Please check your inbox.',
          {
            width: 360,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
          }
        ).then(() => {
          navigate('/auth/login');
        });
      } else {
        // Still show success to prevent email enumeration
        showAlert.success(
          'Reset link sent',
          'If an account exists with this email, a password reset link has been sent. Please check your inbox.',
          {
            width: 360,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
          }
        ).then(() => {
          navigate('/auth/login');
        });
      }
    } catch (error) {
      showAlert.error(
        'Error',
        'An error occurred. Please try again later.',
        {
          width: 320,
          padding: '0.9rem 1rem',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ffc107',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '2rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '2.5rem',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src={logoSrc}
            alt={`${logoText} logo`}
            style={{
              maxWidth: '120px',
              height: 'auto',
            }}
          />
        </div>

        {/* Title */}
        <h2 className="fw-bold mb-2" style={{ fontSize: '1.75rem', color: '#111', textAlign: 'center' }}>
          Forgot Password?
        </h2>
        <p className="text-muted mb-4" style={{ fontSize: '0.95rem', textAlign: 'center', color: '#666' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
              Email:
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontSize: '0.95rem' }}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100 fw-semibold"
            disabled={loading}
            style={{
              color: '#000',
              fontSize: '0.98rem',
              padding: '0.75rem',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Back to login */}
        <div className="text-center mt-4">
          <Link
            to="/auth/login"
            style={{
              fontSize: '0.9rem',
              color: '#666',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

