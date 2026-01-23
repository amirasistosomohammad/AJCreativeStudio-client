import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import OtpVerificationModal from '../../../components/OtpVerificationModal';
import GoogleSignupButton from '../../../components/GoogleSignupButton';
import { showAlert } from '../../../services/notificationService';
import { useBranding } from '../../../contexts/BrandingContext';

// Accept optional props so this can be used as a modal overlay
// onClose: close handler when used as modal
// returnTo: path to navigate after successful signup
const Signup = ({ onClose, returnTo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoSrc, logoText } = useBranding();
  const [isModalVisible, setIsModalVisible] = useState(true);
  const pendingCloseActionRef = useRef(null);
  const [isAuthSwappingOut, setIsAuthSwappingOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleSignupLoading, setGoogleSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  });
  const nameInputRef = useRef(null);
  const contentControls = useAnimationControls();

  // Debug: Add URL parameter when component mounts to verify it's rendering
  useEffect(() => {
    console.log('🔴 SIGNUP COMPONENT MOUNTED - Adding URL parameter');
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('signup_mounted', Date.now().toString());
    window.history.replaceState({}, '', currentUrl.toString());
    console.log('🔴 SIGNUP COMPONENT - URL updated:', window.location.href);
    console.log('🔴 SIGNUP COMPONENT - Current step:', step);
    console.log('🔴 SIGNUP COMPONENT - googleSignupLoading:', googleSignupLoading);
    console.log('🔴 SIGNUP COMPONENT - Will render Google button?', step === 'form');
    
    // Also add a visible indicator in the page title
    const originalTitle = document.title;
    document.title = `[SIGNUP MOUNTED] ${originalTitle}`;
    
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // Debug: Log step changes and update URL
  useEffect(() => {
    console.log('🔴 SIGNUP COMPONENT - Step changed to:', step);
    console.log('🔴 SIGNUP COMPONENT - googleSignupLoading:', googleSignupLoading);
    
    // Update URL when step changes
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('signup_step', step);
    window.history.replaceState({}, '', currentUrl.toString());
  }, [step, googleSignupLoading]);

  // Handle Google signup success
  const handleGoogleSignupSuccess = (data) => {
    console.log('✅ Google signup success:', data);
    setVerifySuccess(true);
    setStep('success');
    setGoogleSignupLoading(false);
    
    showAlert
      .success('Registration complete', 'Your Google account is linked. Please sign in to continue.', {
        width: 360,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
        allowOutsideClick: false,
        allowEscapeKey: false,
      })
      .then(() => {
        goToLoginModal();
      });
  };

  // Handle Google signup error
  const handleGoogleSignupError = (error) => {
    console.error('❌ Google signup error:', error);
    setGoogleSignupLoading(false);
    const message = error.message || 'Google registration failed. Please try again.';
    setSignupError(message);
    
    if (error.code === 'EMAIL_ALREADY_REGISTERED') {
      showAlert
        .confirm(
          'Email already registered',
          message,
          'Go to login',
          'Cancel',
          {
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            width: 340,
            padding: '0.9rem 1rem',
            allowOutsideClick: true,
            allowEscapeKey: true,
          }
        )
        .then((result) => {
          if (result.isConfirmed) {
            goToLoginModal();
          }
        });
    } else {
      showAlert.error('Registration failed', message, {
        width: 340,
        padding: '0.9rem 1rem',
      });
    }
  };

  // Lock background scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, []);

  // Focus name field when component mounts
  useEffect(() => {
    if (nameInputRef.current) {
      // Small delay to ensure the modal and form are fully rendered
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Play entrance animation on mount (CONTENT only — modal stays)
  useEffect(() => {
    contentControls.set({ opacity: 0, y: 100 });

    contentControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    });
  }, [contentControls]);

  // Removed old Google Identity Services code - now using @react-oauth/google

  const requestModalClose = (action) => {
    pendingCloseActionRef.current = action;
    setIsModalVisible(false);
  };

  const performClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    const bg = location.state?.backgroundLocation;
    // If we were opened as a modal over another page, always close back to that page.
    if (bg && bg.pathname && !String(bg.pathname).startsWith('/auth')) {
      navigate(bg.pathname + (bg.search || ''), { replace: true });
      return;
    }
    const search = new URLSearchParams(location.search);
    const target = returnTo || search.get('returnTo');
    if (target) {
      navigate(target);
    } else {
      navigate(-1);
    }
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop, not on child elements
    if (e.target === e.currentTarget) {
      requestModalClose(performClose);
    }
  };

  const validatePassword = (value) => {
    const validation = {
      minLength: value.length >= 8,
      hasLetter: /[a-zA-Z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    };
    
    setPasswordValidation(validation);
    
    // Return true only if all validations pass
    return validation.minLength && validation.hasLetter && validation.hasNumber;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password before submission
    if (!validatePassword(password)) {
      return;
    }

    if (!name.trim() || !email.trim()) {
      setSignupError('Please fill in all fields');
      return;
    }

    setSignupLoading(true);
    setSignupError('');
    showAlert.processing('', '', {
      width: 300,
      padding: '0.75rem 0.9rem',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="font-size:14px;font-weight:800;color:#111;line-height:1.2;">Signing up...</div>
          <div style="font-size:12px;color:#666;line-height:1.2;">Please wait</div>
        </div>
      `,
    });

    let postProcessingAction = null;
    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('otp');
      } else {
        const message = data?.message || 'Registration failed. Please try again.';
        setSignupError(message);

        if (data?.code === 'EMAIL_ALREADY_REGISTERED') {
          postProcessingAction = () =>
            showAlert
              .confirm(
                'Email already registered',
                message,
                'Go to login',
                'Cancel',
                {
                  confirmButtonColor: '#ffc107',
                  cancelButtonColor: '#6c757d',
                  width: 340,
                  padding: '0.9rem 1rem',
                  allowOutsideClick: true,
                  allowEscapeKey: true,
                }
              )
              .then((result) => {
                if (result.isConfirmed) {
                  goToLoginModal();
                }
              });
        }

        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          setSignupError(errorMessages.join(', '));
        }
      }
    } catch (err) {
      setSignupError('Network error. Please check your connection and try again.');
    } finally {
      showAlert.close();
      setSignupLoading(false);
      if (postProcessingAction) {
        setTimeout(postProcessingAction, 0);
      }
    }
  };

  const handleOtpVerify = async (otp) => {
    const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        otp,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setVerifySuccess(true);
      setStep('success');
      // Show a professional success SweetAlert, then route to Login on OK.
      // Use setTimeout so OTP's processing SweetAlert (inside OtpVerificationModal) can close first.
      setTimeout(() => {
        showAlert
          .success('Registration complete', 'Your email is verified. Please sign in to continue.', {
            width: 320,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
            allowOutsideClick: false,
            allowEscapeKey: false,
          })
          .then(() => {
            goToLoginModal();
          });
      }, 0);
      return;
    }

    throw new Error(data.message || 'Verification failed. Please try again.');
  };

  const handleResendOtp = async () => {
    const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const response = await fetch(`${apiBaseUrl}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return;
    }

    throw new Error(data.message || 'Failed to resend code. Please try again.');
  };

  const goToLoginModal = () => {
    if (isAuthSwappingOut) return;
    const bg = location.state?.backgroundLocation || location;
    setIsAuthSwappingOut(true);

    // Use the modal's exit animation timing, then navigate on exit complete.
    requestModalClose(() =>
      navigate('/auth/login', {
        state: { backgroundLocation: bg, authSwap: true },
        replace: true,
      })
    );
  };

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        const action = pendingCloseActionRef.current;
        pendingCloseActionRef.current = null;
        action?.();
      }}
    >
      {isModalVisible && (
        <motion.div
          key="auth-signup-modal"
          className="signup-modal-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // When swapping to Login, do NOT fade the frame; only slide the inner content.
          // Keep the backdrop present during the swap animation.
          exit={isAuthSwappingOut ? { opacity: 0.999 } : { opacity: 0 }}
          transition={isAuthSwappingOut ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] } : { duration: 0.25 }}
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
      {/* Custom scrollbar styles for better UX */}
      <style>{`
        .signup-modal-scrollable::-webkit-scrollbar {
          width: 8px;
        }
        .signup-modal-scrollable::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .signup-modal-scrollable::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .signup-modal-scrollable::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        .signup-modal-scrollable {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }

        /* Hide scrollbars (keep scroll if needed) — used for OTP step to feel like a clean "wizard" */
        .signup-hide-scrollbar {
          -ms-overflow-style: none; /* IE/Edge */
          scrollbar-width: none; /* Firefox */
        }
        .signup-hide-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          display: none;
        }

      `}</style>
        {/* Centered modal */}
        <motion.div
          className="bg-white rounded shadow-sm"
          initial={{ opacity: 0, scale: 0.98, y: 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          // When swapping to Login, do NOT fade/pop the card; only slide the inner content.
          exit={isAuthSwappingOut ? { opacity: 1, scale: 1, y: -160 } : { opacity: 0, scale: 0.98, y: 0 }}
          transition={isAuthSwappingOut ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            zIndex: 10002,
            width: '100%',
            maxWidth: '420px',
            maxHeight: '90vh',
            margin: '1rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header with logo and close icon - Fixed */}
          <div
            className="d-flex align-items-center justify-content-between"
            style={{ 
              padding: '1.5rem 1.1rem 1rem',
              borderBottom: '1px solid #E0E0E0',
              flexShrink: 0,
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <img
                src={logoSrc}
                alt={`${logoText} logo`}
                style={{
                  height: '40px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              <span style={{ color: '#000', fontWeight: 600, fontSize: '1.125rem' }}>
                AJ Creative Studio
              </span>
            </div>
            <button
              type="button"
              className="btn p-0 d-flex align-items-center justify-content-center"
              aria-label="Close"
              onClick={() => requestModalClose(performClose)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#666',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#666';
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'all 0.2s ease',
                }}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Content (modal stays; content animates INSIDE and is clipped so it won't slide over the logo/header) */}
          <div style={{ position: 'relative', overflow: 'hidden', flex: 1, minHeight: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={contentControls}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                      {step === 'form' && (
                        <motion.div
                          key="signup-form-step"
                          initial={{ opacity: 0, y: 100 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -100 }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                          onAnimationStart={() => {
                            console.log('🔴 SIGNUP FORM STEP - Animation started, form is rendering!');
                            const currentUrl = new URL(window.location.href);
                            currentUrl.searchParams.set('signup_form_rendered', Date.now().toString());
                            window.history.replaceState({}, '', currentUrl.toString());
                            console.log('🔴 SIGNUP FORM STEP - URL updated:', window.location.href);
                          }}
                        >
                    {/* Welcome text */}
                    <div
                      style={{
                        padding: '1.25rem 1.1rem 0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {/* Step indicator (modern 2-step flow) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '999px',
                            border: '1px solid #E0E0E0',
                            backgroundColor: step === 'form' ? 'rgba(255, 193, 7, 0.18)' : '#F7F7F7',
                            color: '#111',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: step === 'form' ? '#ffc107' : '#DADADA',
                              color: '#000',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            1
                          </span>
                          Details
                        </div>

                        <div style={{ flex: 1, height: 2, backgroundColor: '#E6E6E6', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: step === 'form' ? '50%' : '100%', height: '100%', backgroundColor: '#ffc107', transition: 'width 0.25s ease' }} />
                        </div>

                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '999px',
                            border: '1px solid #E0E0E0',
                            backgroundColor: step === 'otp' || step === 'success' ? 'rgba(255, 193, 7, 0.18)' : '#F7F7F7',
                            color: '#111',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: step === 'otp' || step === 'success' ? '#ffc107' : '#DADADA',
                              color: '#000',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            2
                          </span>
                          Verify
                        </div>
                      </div>

                      <h2 className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111', lineHeight: '1.2' }}>
                        Create an account
                      </h2>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.9rem', color: '#666' }}>
                        Sign up to get started with your account
                      </p>
                    </div>

                    {/* Scrollable Body */}
                    <div
                      className="signup-modal-scrollable"
                      style={{
                        padding: '1rem 2rem 1.25rem',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        flex: 1,
                        minHeight: 0,
                        scrollbarGutter: 'stable',
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        maxHeight: 'none',
                      }}
                    >
                      <form onSubmit={handleSubmit}>
                        {/* Name field */}
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Name:
                          </label>
                          <input
                            ref={nameInputRef}
                            type="text"
                            className="form-control"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ fontSize: '0.95rem' }}
                            required
                          />
                        </div>

                        {/* Email field */}
                        <div className="mb-3">
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
                          />
                        </div>

                        {/* Password field */}
                        <div className="mb-2 position-relative">
                          <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Password:
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

                        {/* Error Message */}
                        {signupError && (
                          <div
                            className="mb-3"
                            style={{
                              padding: '0.75rem',
                              backgroundColor: '#f8d7da',
                              color: '#721c24',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              marginTop: '0.5rem',
                            }}
                          >
                            {signupError}
                          </div>
                        )}

                        {/* Signup button */}
                        <button
                          type="submit"
                          className="btn btn-warning w-100 fw-semibold"
                          disabled={signupLoading}
                          style={{
                            color: '#000',
                            fontSize: '0.98rem',
                            marginTop: '1rem',
                            opacity: signupLoading ? 0.6 : 1,
                            cursor: signupLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {signupLoading ? 'Signing up…' : 'SIGN UP'}
                        </button>

                      </form>

                      {/* Login link */}
                      <div className="text-center" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        <span>Already have an account? </span>
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          style={{
                            fontSize: '0.9rem',
                            textDecoration: 'underline',
                            color: '#666',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            verticalAlign: 'baseline',
                            lineHeight: 'inherit',
                          }}
                          onClick={goToLoginModal}
                        >
                          Sign in
                        </button>
                      </div>

                      {/* Divider - EXACT COPY FROM LOGIN.JSX */}
                      <div className="d-flex align-items-center my-3" style={{ fontSize: '0.8rem', color: '#999' }}>
                        <div
                          style={{
                            height: 1,
                            backgroundColor: '#e0e0e0',
                            flex: 1,
                          }}
                        />
                        <span className="px-2">Or, sign up with</span>
                        <div
                          style={{
                            height: 1,
                            backgroundColor: '#e0e0e0',
                            flex: 1,
                          }}
                        />
                      </div>

                      {/* TEST: Always visible test button */}
                      <div style={{ 
                        padding: '20px', 
                        backgroundColor: 'yellow', 
                        border: '3px solid red', 
                        margin: '10px 0',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '16px' }}>
                          TEST: If you see this yellow box, the section is rendering!
                        </div>
                        <button
                          type="button"
                          onClick={() => alert('TEST BUTTON CLICKED!')}
                          style={{
                            marginTop: '10px',
                            padding: '10px 20px',
                            backgroundColor: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          TEST BUTTON - CLICK ME
                        </button>
                      </div>

                      {/* Social signup buttons - USING SEPARATE COMPONENT */}
                      <div className="d-flex justify-content-center gap-3 mb-1" style={{ minHeight: '60px', paddingBottom: '10px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(255,0,0,0.1)', padding: '10px', border: '2px dashed blue' }}>
                          <GoogleSignupButton
                            onSuccess={(data) => {
                              setGoogleSignupLoading(true);
                              handleGoogleSignupSuccess(data);
                            }}
                            onError={(error) => {
                              handleGoogleSignupError(error);
                            }}
                            disabled={step !== 'form'}
                            loading={googleSignupLoading}
                          />
                        </div>
                      </div>
                    </div>
                        </motion.div>
                      )}

                      {step === 'otp' && (
                        <motion.div
                          key="otp-step"
                          initial={{ opacity: 0, y: 100 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -100 }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                        >
                    <div style={{ padding: '1.25rem 1.1rem 0.85rem', flexShrink: 0 }}>
                      {/* Step indicator (modern 2-step flow) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '999px',
                            border: '1px solid #E0E0E0',
                            backgroundColor: '#F7F7F7',
                            color: '#111',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#ffc107',
                              color: '#000',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            ✓
                          </span>
                          Details
                        </div>

                        <div style={{ flex: 1, height: 2, backgroundColor: '#E6E6E6', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: '100%', height: '100%', backgroundColor: '#ffc107', transition: 'width 0.25s ease' }} />
                        </div>

                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '999px',
                            border: '1px solid #E0E0E0',
                            backgroundColor: 'rgba(255, 193, 7, 0.18)',
                            color: '#111',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#ffc107',
                              color: '#000',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            2
                          </span>
                          Verify
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-link p-0"
                        style={{
                          fontSize: '0.9rem',
                          textDecoration: 'underline',
                          color: '#666',
                          fontWeight: 600,
                          marginBottom: '0.5rem',
                          transition: 'color 0.2s ease',
                        }}
                        onClick={() => {
                          setSignupError('');
                          setStep('form');
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#666';
                        }}
                      >
                        ← Back to sign up
                      </button>
                      <h2 className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111', lineHeight: '1.2' }}>
                        Verify your email
                      </h2>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.9rem', color: '#666' }}>
                        Enter the 6-digit code we sent to <strong>{email}</strong>
                      </p>
                    </div>

                    <div
                      className="signup-modal-scrollable signup-hide-scrollbar"
                      style={{
                        padding: '1rem 2rem 1.25rem',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        flex: 1,
                        minHeight: 0,
                        scrollbarGutter: 'stable',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                      }}
                    >
                      <OtpVerificationModal
                        inline
                        embedded
                        hideHeader
                        hideIntro
                        animate={false}
                        isOpen
                        email={email}
                        userName={name}
                        onVerify={handleOtpVerify}
                        onResend={handleResendOtp}
                        onClose={() => setStep('form')}
                      />
                    </div>
                        </motion.div>
                      )}

                      {step === 'success' && (
                        <motion.div
                          key="success-step"
                          initial={{ opacity: 0, y: 100 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -100 }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                        >
                    <div style={{ padding: '1.25rem 1.1rem 0.85rem', flexShrink: 0 }}>
                      <h2 className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111', lineHeight: '1.2' }}>
                        Email verified
                      </h2>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.9rem', color: '#666' }}>
                        Your account is ready. You can now sign in.
                      </p>
                    </div>

                    <div
                      className="signup-modal-scrollable"
                      style={{
                        padding: '1rem 2rem 1.25rem',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        flex: 1,
                        minHeight: 0,
                        scrollbarGutter: 'stable',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                      }}
                    >
                      <button type="button" className="btn btn-warning w-100 fw-semibold" style={{ color: '#000', fontSize: '0.98rem', marginTop: '0.5rem' }} onClick={goToLoginModal}>
                        SIGN IN
                      </button>
                    </div>
                        </motion.div>
                      )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

// Export component
export default Signup;