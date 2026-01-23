import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { showAlert } from '../../../services/notificationService';
import { useBranding } from '../../../contexts/BrandingContext';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { logoSrc, logoText } = useBranding();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  });

  useEffect(() => {
    // Get token and email from URL params
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);

    if (!tokenParam || !emailParam) {
      showAlert.error(
        'Invalid Link',
        'This password reset link is invalid or has expired.',
        {
          width: 360,
          padding: '0.9rem 1rem',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ffc107',
        }
      ).then(() => {
        navigate('/auth/forgot-password');
      });
    }
  }, [searchParams, navigate]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordValidation({
      minLength: value.length >= 8,
      hasLetter: /[a-zA-Z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      showAlert.error('Fields required', 'Please fill in all fields.', {
        width: 320,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert.error('Passwords do not match', 'Please make sure both passwords are the same.', {
        width: 320,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
      });
      return;
    }

    if (!passwordValidation.minLength || !passwordValidation.hasLetter || !passwordValidation.hasNumber) {
      showAlert.error('Invalid password', 'Password must be at least 8 characters and contain both letters and numbers.', {
        width: 360,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
      });
      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          token: token,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert.success(
          'Password Reset',
          'Your password has been reset successfully. Please login with your new password.',
          {
            width: 360,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
          }
        ).then(() => {
          navigate('/');
        });
      } else {
        showAlert.error(
          'Reset Failed',
          data.message || 'Invalid or expired reset token. Please request a new one.',
          {
            width: 360,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
          }
        );
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
          Reset Password
        </h2>
        <p className="text-muted mb-4" style={{ fontSize: '0.95rem', textAlign: 'center', color: '#666' }}>
          Enter your new password below.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
              Email:
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              disabled
              style={{ fontSize: '0.95rem', backgroundColor: '#f5f5f5' }}
            />
          </div>

          <div className="mb-2 position-relative">
            <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
              New Password:
            </label>
            <div className="position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${password && (passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber) ? 'is-valid' : password && !(passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber) ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                style={{
                  fontSize: '0.95rem',
                  paddingRight:
                    password && (passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber)
                      ? '70px'
                      : password && !(passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber)
                      ? '70px'
                      : '40px',
                }}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn p-0 position-absolute"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                style={{
                  right:
                    password && (passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber)
                      ? '38px'
                      : password && !(passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber)
                      ? '38px'
                      : '8px',
                  top: '0',
                  bottom: '0',
                  height: 'auto',
                  width: '32px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  margin: 0,
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#666';
                }}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block' }}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block' }}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
            {/* Password validation criteria */}
            <AnimatePresence>
              {password && (
                <motion.div
                  key="validation-criteria"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ marginTop: '0.5rem', fontSize: '0.85rem', overflow: 'hidden' }}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
                    style={{
                      color: passwordValidation.minLength ? '#28a745' : '#dc3545',
                      marginBottom: '0.25rem',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    8 characters minimum
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
                    style={{
                      color: passwordValidation.hasLetter ? '#28a745' : '#dc3545',
                      marginBottom: '0.25rem',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    At least one letter
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25, delay: 0.15, ease: 'easeOut' }}
                    style={{
                      color: passwordValidation.hasNumber ? '#28a745' : '#dc3545',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    At least one number
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-4 position-relative">
            <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
              Confirm Password:
            </label>
            <div className="position-relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-control ${confirmPassword && password === confirmPassword ? 'is-valid' : confirmPassword && password !== confirmPassword ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  fontSize: '0.95rem',
                  paddingRight:
                    confirmPassword && password === confirmPassword
                      ? '70px'
                      : confirmPassword && password !== confirmPassword
                      ? '70px'
                      : '40px',
                }}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn p-0 position-absolute"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmPassword(!showConfirmPassword);
                }}
                style={{
                  right:
                    confirmPassword && password === confirmPassword
                      ? '38px'
                      : confirmPassword && password !== confirmPassword
                      ? '38px'
                      : '8px',
                  top: '0',
                  bottom: '0',
                  height: 'auto',
                  width: '32px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  margin: 0,
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#666';
                }}
              >
                {showConfirmPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block' }}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block' }}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
            <AnimatePresence>
              {confirmPassword && password !== confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#dc3545', overflow: 'hidden' }}
                >
                  Passwords do not match
                </motion.div>
              )}
            </AnimatePresence>
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
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;

