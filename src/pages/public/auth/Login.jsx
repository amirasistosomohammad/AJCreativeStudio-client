import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import logoImage from '../../../assets/images/logo.jpg';
import OtpVerificationModal from '../../../components/OtpVerificationModal';
import GoogleSignupButton from '../../../components/GoogleSignupButton';
import GoogleLoginButton from '../../../components/GoogleLoginButton';
import { showAlert } from '../../../services/notificationService';
import { useAuth } from '../../../contexts/AuthContext';

// Accept optional props so this can be used as a modal overlay
// onClose: close handler when used as modal
// returnTo: path to navigate after successful login
const Login = ({ onClose, returnTo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();
  const isAuthSwap = Boolean(location.state?.authSwap);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const pendingCloseActionRef = useRef(null);
  const modalScrollRef = useRef(null);
  const [modalHasOverflow, setModalHasOverflow] = useState(false);
  const [activeTab, setActiveTab] = useState('password'); // kept for potential future expansion
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signupPasswordValidation, setSignupPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const emailInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleSignupLoading, setGoogleSignupLoading] = useState(false);
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const googleButtonRef = useRef(null);
  const googleButtonRenderedRef = useRef(false);
  const contentControls = useAnimationControls();

  // Detect whether the modal content actually overflows.
  // This prevents the scrollbar from appearing/flashing on open unless it's needed.
  useLayoutEffect(() => {
    const el = modalScrollRef.current;
    if (!el) return;

    let raf1 = 0;
    let raf2 = 0;
    const check = () => {
      const node = modalScrollRef.current;
      if (!node) return;
      // 1px tolerance to avoid “always overflow” due to sub-pixel rounding
      const has = node.scrollHeight - node.clientHeight > 1;
      setModalHasOverflow(has);
    };

    // Wait a couple frames so Framer Motion initial transforms/layout settle
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(check);
    });

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(check);
      ro.observe(el);
    }
    window.addEventListener('resize', check);

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      ro?.disconnect?.();
      window.removeEventListener('resize', check);
    };
    // Depend on the main UI toggles that can change content height
  }, [isSignup, showOtpModal, signupError, signupLoading, password, signupPassword]);

  // Lock background scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, []);

  // Entrance animation for the modal CONTENT (from bottom -> center)
  useEffect(() => {
    contentControls.set({ opacity: 0, y: 100 });
    contentControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    });
  }, [contentControls]);

  // Google Identity Services: render Google sign-up button (only in signup form view)
  useEffect(() => {
    if (!isSignup || showOtpModal) {
      googleButtonRenderedRef.current = false;
      return;
    }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return;
    }

    let cancelled = false;

    const loadGoogleScript = () =>
      new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }

        const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
        document.head.appendChild(script);
      });

    const init = async () => {
      try {
        await loadGoogleScript();
        if (cancelled) return;

        const googleId = window.google?.accounts?.id;
        if (!googleId) return;
        if (!googleButtonRef.current) return;

        if (googleButtonRenderedRef.current) return;
        googleButtonRenderedRef.current = true;

        googleId.initialize({
          client_id: googleClientId,
          callback: async (credentialResponse) => {
            const idToken = credentialResponse?.credential;
            if (!idToken) {
              setSignupError('Google sign-up failed. Please try again.');
              return;
            }

            setGoogleSignupLoading(true);
            setSignupError('');

            showAlert.processing('', '', {
              width: 320,
              padding: '0.75rem 0.9rem',
              html: `
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                  <div style="font-size:14px;font-weight:800;color:#111;line-height:1.2;">Signing up with Google...</div>
                  <div style="font-size:12px;color:#666;line-height:1.2;">Please wait</div>
                </div>
              `,
            });

            let postProcessingAction = null;
            try {
              const apiBaseUrl =
                import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

              const response = await fetch(`${apiBaseUrl}/auth/google/signup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body: JSON.stringify({ id_token: idToken }),
              });

              const data = await response.json().catch(() => ({}));

              if (response.ok && data.success) {
                setSignupSuccess(true);

                postProcessingAction = () =>
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
                      setShowOtpModal(false);
                      setIsSignup(false);
                    });
              } else {
                const message = data?.message || 'Google registration failed. Please try again.';
                setSignupError(message);

                if (data?.code === 'EMAIL_ALREADY_REGISTERED') {
                  postProcessingAction = () =>
                    showAlert
                      .confirm('Email already registered', message, 'Go to login', 'Cancel', {
                        confirmButtonColor: '#ffc107',
                        cancelButtonColor: '#6c757d',
                        width: 340,
                        padding: '0.9rem 1rem',
                        allowOutsideClick: true,
                        allowEscapeKey: true,
                      })
                      .then((result) => {
                        if (result.isConfirmed) {
                          setShowOtpModal(false);
                          setIsSignup(false);
                        }
                      });
                }

                if (data?.errors) {
                  const errorMessages = Object.values(data.errors).flat();
                  setSignupError(errorMessages.join(', '));
                }
              }
            } catch (err) {
              setSignupError('Network error. Please check your connection and try again.');
            } finally {
              showAlert.close();
              setGoogleSignupLoading(false);
              if (postProcessingAction) {
                setTimeout(postProcessingAction, 0);
              }
            }
          },
        });

        googleButtonRef.current.innerHTML = '';
        googleId.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'pill',
          width: 260,
        });
      } catch (e) {
        // Fail silently – fallback is that the Google button simply doesn't render.
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [isSignup, showOtpModal]);

  // Handle Google signup success (Firebase)
  const handleGoogleSignupSuccess = (data) => {
    console.log('✅ Google signup success in Login component:', data);
    console.log('✅ Firebase user email_verified_at:', data?.customer?.email_verified_at);
    
    // Firebase users are ALREADY verified by Google - NEVER show OTP modal
    setSignupSuccess(true);
    setGoogleSignupLoading(false);
    setShowOtpModal(false); // Explicitly ensure OTP is NOT shown
    
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
        setShowOtpModal(false); // Double-check OTP is closed
        setIsSignup(false);
      });
  };

  // Handle Google signup error (Firebase)
  const handleGoogleSignupError = (error) => {
    console.error('❌ Google signup error in Login component:', error);
    setGoogleSignupLoading(false);
    const message = error.message || 'Google registration failed. Please try again.';
    setSignupError(message);
    
    if (error.code === 'EMAIL_ALREADY_REGISTERED') {
      showAlert
        .confirm('Email already registered', message, 'Go to login', 'Cancel', {
          confirmButtonColor: '#ffc107',
          cancelButtonColor: '#6c757d',
          width: 340,
          padding: '0.9rem 1rem',
          allowOutsideClick: true,
          allowEscapeKey: true,
        })
        .then((result) => {
          if (result.isConfirmed) {
            setShowOtpModal(false);
            setIsSignup(false);
          }
        });
    } else {
      showAlert.error('Registration failed', message, {
        width: 340,
        padding: '0.9rem 1rem',
      });
    }
  };

  // Handle Google login success (Firebase)
  const handleGoogleLoginSuccess = async (data) => {
    console.log('✅ Google login success:', data);
    setGoogleLoginLoading(false);
    setLoginLoading(false);
    
    // Store token
    if (data.token) {
      localStorage.setItem('customer_token', data.token);
    }

    // Refresh auth context to update authentication state
    if (checkAuth) {
      await checkAuth();
    }

    showAlert.close();
    
    // Show success message and redirect to home
    showAlert.success('Login successful', 'Welcome back! Redirecting to home...', {
      width: 340,
      padding: '0.9rem 1rem',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ffc107',
      timer: 2000,
      timerProgressBar: true,
    }).then(() => {
      // Close modal if it was opened as overlay
      if (onClose) {
        onClose();
      }
      
      // Redirect to home page after login
      navigate('/');
    });
  };

  // Handle Google login error (Firebase)
  const handleGoogleLoginError = (error) => {
    console.error('❌ Google login error:', error);
    setGoogleLoginLoading(false);
    const message = error.message || 'Google login failed. Please try again.';
    setLoginError(message);
    
    // Handle specific error codes
    if (error.code === 'USER_NOT_FOUND') {
      showAlert.close();
      showAlert.confirm(
        'Account Not Found',
        error.message || 'No account found with this email address. Would you like to sign up instead?',
        'Sign Up',
        'Cancel',
        {
          confirmButtonColor: '#ffc107',
          cancelButtonColor: '#6c757d',
          width: 360,
          padding: '0.9rem 1rem',
          allowOutsideClick: true,
          allowEscapeKey: true,
        }
      ).then((result) => {
        if (result.isConfirmed) {
          // Switch to signup form
          setIsSignup(true);
        }
      });
    } else if (error.code === 'NOT_GOOGLE_ACCOUNT') {
      showAlert.close();
      showAlert.info(
        'Account Type Mismatch',
        message,
        {
          width: 400,
          padding: '0.9rem 1rem',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ffc107',
          allowOutsideClick: true,
          allowEscapeKey: true,
        }
      );
    } else if (error.code === 'EMAIL_NOT_VERIFIED' || error.code === 'ACCOUNT_INACTIVE') {
      showAlert.close();
      showAlert.error('Account Not Verified', message, {
        width: 340,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
      });
    } else {
      showAlert.close();
      showAlert.error('Login Failed', message, {
        width: 340,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
      });
    }
  };

  const requestModalClose = (action) => {
    pendingCloseActionRef.current = action;
    setIsModalVisible(false);
  };

  // Focus email field when component mounts (login form is shown by default)
  useEffect(() => {
    if (emailInputRef.current) {
      // Small delay to ensure the modal and form are fully rendered
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Focus email field when switching back to login form
  useEffect(() => {
    if (!isSignup && !showForgotPassword && !showOtpModal) {
      // With AnimatePresence mode="wait", we need to wait for exit (0.5s) + enter (0.5s) animations
      const timer = setTimeout(() => {
        // Try multiple times to ensure the element is ready (max 10 attempts)
        let attempts = 0;
        const maxAttempts = 10;
        const attemptFocus = () => {
          attempts++;
          if (emailInputRef.current && document.activeElement !== emailInputRef.current) {
            emailInputRef.current.focus();
          } else if (attempts < maxAttempts && !emailInputRef.current) {
            // Retry if element not ready yet
            setTimeout(attemptFocus, 50);
          }
        };
        attemptFocus();
      }, 1100); // Wait for both exit and enter animations to complete
      return () => clearTimeout(timer);
    }
  }, [isSignup, showForgotPassword, showOtpModal]);

  // Focus name field when signup form is shown
  useEffect(() => {
    if (isSignup) {
      // With AnimatePresence mode="wait", we need to wait for exit (0.5s) + enter (0.5s) animations
      const timer = setTimeout(() => {
        // Try multiple times to ensure the element is ready (max 10 attempts)
        let attempts = 0;
        const maxAttempts = 10;
        const attemptFocus = () => {
          attempts++;
          if (nameInputRef.current && document.activeElement !== nameInputRef.current) {
            nameInputRef.current.focus();
          } else if (attempts < maxAttempts && !nameInputRef.current) {
            // Retry if element not ready yet
            setTimeout(attemptFocus, 50);
          }
        };
        attemptFocus();
      }, 1100); // Wait for both exit and enter animations to complete
      return () => clearTimeout(timer);
    }
  }, [isSignup]);

  const handleClose = () => {
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
      requestModalClose(handleClose);
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

  const validateSignupPassword = (value) => {
    const validation = {
      minLength: value.length >= 8,
      hasLetter: /[a-zA-Z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    };
    
    setSignupPasswordValidation(validation);
    
    // Return true only if all validations pass
    return validation.minLength && validation.hasLetter && validation.hasNumber;
  };

  const handleSignupPasswordChange = (e) => {
    const value = e.target.value;
    setSignupPassword(value);
    validateSignupPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignup) {
      // Validate signup form
      if (!validateSignupPassword(signupPassword)) {
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
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: signupPassword,
          }),
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {
          setSignupSuccess(true);
          setShowOtpModal(true);
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
                    setIsSignup(false);
                    setShowOtpModal(false);
                  }
                });
          }
  
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat();
            setSignupError(errorMessages.join(', '));
          }
        }
      } catch (error) {
        setSignupError('Network error. Please check your connection and try again.');
      } finally {
        showAlert.close();
        setSignupLoading(false);
        if (postProcessingAction) {
          setTimeout(postProcessingAction, 0);
        }
      }
    } else {
      // LOGIN FORM SUBMISSION
      // Basic validation
      if (!loginEmail.trim()) {
        showAlert.error('Email required', 'Please enter your email address.', {
          width: 320,
          padding: '0.9rem 1rem',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ffc107',
        });
        return;
      }
  
      if (!password) {
        showAlert.error('Password required', 'Please enter your password.', {
          width: 320,
          padding: '0.9rem 1rem',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ffc107',
        });
        return;
      }
  
      setLoginLoading(true);
      setLoginError('');
      
      // Show loading alert
      showAlert.processing('', '', {
        width: 300,
        padding: '0.75rem 0.9rem',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <div style="font-size:14px;font-weight:800;color:#111;line-height:1.2;">Signing in...</div>
            <div style="font-size:12px;color:#666;line-height:1.2;">Please wait</div>
          </div>
        `,
      });
  
      try {
        const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email: loginEmail.trim(),
            password: password,
          }),
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {
          // SUCCESS: Account exists, is_active=1, register_status=verified, password correct
          // Store token
          if (data.token) {
            localStorage.setItem('customer_token', data.token);
          }

          // Refresh auth context to update authentication state
          if (checkAuth) {
            await checkAuth();
          }
  
          showAlert.close();
          
          // Show success message and redirect to home
          showAlert.success('Login successful', 'Welcome back! Redirecting to home...', {
            width: 340,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
            timer: 2000,
            timerProgressBar: true,
          }).then(() => {
            // Close modal if it was opened as overlay
            if (onClose) {
              onClose();
            }
            
            // Redirect to home page after login
            navigate('/');
          });
        } else {
          // HANDLE ALL ERROR CASES
          let errorMessage = data?.message || 'Login failed. Please try again.';
          let errorTitle = 'Login Failed';
          
          // CASE 1: USER_NOT_FOUND - Email not found OR register_status = 'pending'
          if (data?.code === 'USER_NOT_FOUND') {
            showAlert.close();
            showAlert.confirm(
              'Account Not Found',
              'No account found with this email address. Would you like to sign up instead?',
              'Sign Up',
              'Cancel',
              {
                confirmButtonColor: '#ffc107',
                cancelButtonColor: '#6c757d',
                width: 360,
                padding: '0.9rem 1rem',
                allowOutsideClick: true,
                allowEscapeKey: true,
              }
            ).then((result) => {
              if (result.isConfirmed) {
                // Switch to signup form with the email pre-filled
                setIsSignup(true);
                setEmail(loginEmail);
              }
            });
            setLoginLoading(false);
            return; // Exit early
          }
          
          // CASE 2: USE_GOOGLE_LOGIN
          // User signed up with Google, so they must use Google sign-in
          if (data?.code === 'USE_GOOGLE_LOGIN') {
            errorTitle = 'Google Account Detected';
            errorMessage = data?.message || 'This account was created with Google. Please use "Sign in with Google" to access your account.';
            setLoginError(errorMessage);
            showAlert.close();
            showAlert.info(
              errorTitle,
              errorMessage,
              {
                width: 400,
                padding: '0.9rem 1rem',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ffc107',
                allowOutsideClick: true,
                allowEscapeKey: true,
              }
            );
            setLoginLoading(false);
            return; // Exit early
          }
          
          // CASE 3: EMAIL_NOT_VERIFIED or ACCOUNT_INACTIVE
          // Email exists, but email not verified OR is_active=0 OR register_status not 'verified'
          if (data?.code === 'EMAIL_NOT_VERIFIED' || data?.code === 'ACCOUNT_INACTIVE') {
            errorTitle = 'Account Not Verified';
            errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification code or sign up again to receive a new code.';
            setLoginError(errorMessage);
            showAlert.close();
            showAlert.confirm(
              errorTitle,
              errorMessage,
              'Resend Verification Code',
              'Cancel',
              {
                confirmButtonColor: '#ffc107',
                cancelButtonColor: '#6c757d',
                width: 380,
                padding: '0.9rem 1rem',
                allowOutsideClick: true,
                allowEscapeKey: true,
              }
            ).then(async (result) => {
              if (result.isConfirmed) {
                // Resend OTP
                try {
                  const resendResponse = await fetch(`${apiBaseUrl}/auth/resend-otp`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                      email: loginEmail.trim(),
                    }),
                  });
                  
                  const resendData = await resendResponse.json();
                  
                  if (resendResponse.ok && resendData.success) {
                    showAlert.success('Verification code sent', 'Please check your email for the verification code.', {
                      width: 340,
                      padding: '0.9rem 1rem',
                      confirmButtonText: 'OK',
                      confirmButtonColor: '#ffc107',
                    });
                  } else {
                    showAlert.error('Failed to send code', resendData?.message || 'Please try again later.', {
                      width: 340,
                      padding: '0.9rem 1rem',
                      confirmButtonText: 'OK',
                      confirmButtonColor: '#ffc107',
                    });
                  }
                } catch (err) {
                  showAlert.error('Network error', 'Failed to resend verification code. Please try again later.', {
                    width: 340,
                    padding: '0.9rem 1rem',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ffc107',
                  });
                }
              }
            });
            setLoginLoading(false);
            return; // Exit early
          }
          
          // CASE 4: INVALID_PASSWORD
          // Email exists, is_active=1, register_status=verified, but password is incorrect
          if (data?.code === 'INVALID_PASSWORD') {
            errorTitle = 'Incorrect password';
            errorMessage = 'That password doesn’t match this account. Please try again, or reset your password.';
            setLoginError(errorMessage);
            showAlert.close();
            showAlert
              .confirm(errorTitle, errorMessage, 'Try again', 'Forgot password', {
                confirmButtonColor: '#ffc107',
                cancelButtonColor: '#6c757d',
                width: 380,
                padding: '0.9rem 1rem',
                allowOutsideClick: true,
                allowEscapeKey: true,
              })
              .then((result) => {
                if (result.isDismissed) {
                  // User clicked "Forgot password" - show forgot password view
                  setForgotPasswordEmail(loginEmail); // Pre-fill with login email
                  setShowForgotPassword(true);
                }
              });
            setLoginLoading(false);
            return; // Exit early
          }
  
          // DEFAULT ERROR: Any other error case
          setLoginError(errorMessage);
          showAlert.close();
          showAlert.error(errorTitle, errorMessage, {
            width: 340,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
          });
  
          // If there are validation errors from backend
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            setLoginError(errorMessages.join(', '));
          }
        }
      } catch (error) {
        // NETWORK ERROR
        setLoginError('Network error. Please check your connection and try again.');
        showAlert.close();
        showAlert.error(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          {
            width: 360,
            padding: '0.9rem 1rem',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
          }
        );
      } finally {
        setLoginLoading(false);
      }
    }
  };

  const handleOtpVerify = async (otp) => {
    const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        otp: otp,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setSignupSuccess(true);
      // Show a professional success SweetAlert, then switch to Login on OK.
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
            setShowOtpModal(false);
            // Reset signup form and show login form
            setName('');
            setEmail('');
            setSignupPassword('');
            setIsSignup(false);
          });
      }, 0);
    } else {
      throw new Error(data.message || 'Verification failed. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBaseUrl}/auth/resend-otp`, {
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

    if (response.ok && data.success) {
      // Success - OTP sent
      return;
    } else {
      throw new Error(data.message || 'Failed to resend code. Please try again.');
    }
  };

  const handleSwitchToSignup = () => {
    // Old behavior: keep the modal open and only animate the inner content.
    // This avoids the fade-out/fade-in "modal swap" when switching between login and signup.
    setIsSignup(true);
    setLoginError('');
    setLoginEmail('');
    setPassword('');
  };

  const handleSwitchToLogin = () => {
    setIsSignup(false);
    setSignupError('');
    setName('');
    setEmail('');
    setSignupPassword('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail.trim()) {
      showAlert.error('Email required', 'Please enter your email address.', {
        width: 320,
        padding: '0.9rem 1rem',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
      });
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(),
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
          setShowForgotPassword(false);
        });
        return;
      }

      // Handle success (generic message for security)
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
        setShowForgotPassword(false);
      });
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
      setForgotPasswordLoading(false);
    }
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
          key="auth-login-modal"
          className="login-modal-page"
          initial={isAuthSwap ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
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
          {/* Centered modal */}
          <motion.div
            className="bg-white rounded shadow-sm"
            initial={isAuthSwap ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
          <style>{`
            /* Custom scrollbar for auth modal content (Chrome/Edge/Safari + Firefox) */
            .aj-auth-modal-scroll {
              scrollbar-width: none;
            }

            .aj-auth-modal-scroll::-webkit-scrollbar {
              width: 0px;
            }

            /* Show the scrollbar whenever the content actually overflows */
            .aj-auth-modal-scroll.has-overflow {
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 193, 7, 0.85) rgba(0, 0, 0, 0.06);
            }

            .aj-auth-modal-scroll.has-overflow::-webkit-scrollbar {
              width: 8px;
            }

            .aj-auth-modal-scroll.has-overflow::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.06);
              border-radius: 999px;
            }

            .aj-auth-modal-scroll.has-overflow::-webkit-scrollbar-thumb {
              background: linear-gradient(
                180deg,
                rgba(255, 193, 7, 0.95),
                rgba(255, 193, 7, 0.55)
              );
              border-radius: 999px;
              border: 2px solid rgba(255, 255, 255, 0.75);
            }

            .aj-auth-modal-scroll.has-overflow::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(
                180deg,
                rgba(255, 193, 7, 1),
                rgba(255, 193, 7, 0.75)
              );
            }

          `}</style>
          {/* Header with logo and close icon */}
          <div
            className="d-flex align-items-center justify-content-between"
            style={{ 
              padding: '1.5rem 1.1rem 1rem',
              borderBottom: '1px solid #E0E0E0'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <img
                src={logoImage}
                alt="AJ Creative Studio logo"
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
              onClick={() => requestModalClose(handleClose)}
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

          {/* Body (modal stays; content animates INSIDE and is clipped so it won't slide over the logo/header) */}
          <div
            style={{
              // Padding is applied to the scroll container so Bootstrap focus rings (box-shadow)
              // have breathing room and don't get clipped by the scrollport edges.
              padding: 0,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              // Allow the modal body to take available space and scroll when content is tall
              flex: '1 1 auto',
              minHeight: 0,
            }}
          >
            {/* Scrollable content area (keeps header fixed, prevents long errors from pushing buttons off-screen) */}
            <div
              ref={modalScrollRef}
              className={`aj-auth-modal-scroll${modalHasOverflow ? ' has-overflow' : ''}`}
              style={{
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: modalHasOverflow ? 'auto' : 'hidden',
                overflowX: 'hidden',
                ...(modalHasOverflow ? { scrollbarGutter: 'stable' } : null),
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                // Extra side padding so `.form-control` focus ring isn't clipped on left/right,
                // and content doesn't feel cramped near the scrollbar.
                padding: '1rem 2rem 1.25rem',
              }}
            >
              <motion.div initial={{ opacity: 0, y: 100 }} animate={contentControls}>
                <AnimatePresence mode="wait" initial={false}>
                {showForgotPassword ? (
                  <motion.div
                    key="forgot-password"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <div style={{ padding: '0 0 0.85rem', flexShrink: 0 }}>
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
                        onClick={() => setShowForgotPassword(false)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#666';
                        }}
                      >
                        ← Back to login
                      </button>
                      <h2 className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111', lineHeight: '1.2' }}>
                        Forgot Password?
                      </h2>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.9rem', color: '#666' }}>
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    <form onSubmit={handleForgotPassword} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="mb-4" style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
                          Email:
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="your.email@example.com"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          style={{ fontSize: '0.95rem' }}
                          required
                          disabled={forgotPasswordLoading}
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-warning w-100 fw-semibold"
                        disabled={forgotPasswordLoading}
                        style={{
                          color: '#000',
                          fontSize: '0.98rem',
                          padding: '0.75rem',
                          opacity: forgotPasswordLoading ? 0.6 : 1,
                          cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                          marginTop: 'auto',
                        }}
                      >
                        {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </form>
                  </motion.div>
                ) : !isSignup ? (
                  <motion.div
                    key="login-form"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{ position: 'relative' }}
                  >
                  {/* Welcome text */}
                  <div style={{ 
                    padding: '0 0 1.25rem 0',
                    marginBottom: '0.5rem',
                  }}>
                    <h2 className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111', lineHeight: '1.2' }}>
                      Welcome back
                    </h2>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.9rem', color: '#666' }}>
                      Sign in to your account to continue
                    </p>
                  </div>

                <form onSubmit={handleSubmit}>
                {/* Email field */}
                <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Email:
                    </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    className="form-control"
                    placeholder="your.email@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
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
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={handlePasswordChange}
                      style={{ 
                        fontSize: '0.95rem',
                        paddingRight: '40px'
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
                        right: '8px',
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
                </div>

                <div className="d-flex justify-content-end mb-3">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => {
                      setForgotPasswordEmail(loginEmail); // Pre-fill with login email
                      setShowForgotPassword(true);
                    }}
                    style={{ 
                      fontSize: '0.85rem',
                      textDecoration: 'underline',
                      color: '#666',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#000';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#666';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

              {/* Error Message */}
              {loginError && (
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
                  {loginError}
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                className="btn btn-warning w-100 fw-semibold"
                disabled={loginLoading}
                style={{
                  color: '#000',
                  fontSize: '0.98rem',
                  marginTop: '0.25rem',
                  opacity: loginLoading ? 0.6 : 1,
                  cursor: loginLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {loginLoading ? 'Signing in...' : 'LOGIN'}
              </button>
                </form>

                {/* Signup/Login link */}
                <div className="text-center" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <span>Don't have an account? </span>
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
                    onClick={handleSwitchToSignup}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#000';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#666';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                  >
                    Sign up
                  </button>
                </div>

                {/* Divider */}
                <div className="d-flex align-items-center my-3" style={{ fontSize: '0.8rem', color: '#999' }}>
                  <div
                    style={{
                      height: 1,
                      backgroundColor: '#e0e0e0',
                      flex: 1,
                    }}
                  />
                  <span className="px-2">Or, login with</span>
                  <div
                    style={{
                      height: 1,
                      backgroundColor: '#e0e0e0',
                      flex: 1,
                    }}
                  />
                </div>

                {/* Social login buttons - USING FIREBASE */}
                <div className="d-flex justify-content-center gap-3 mb-1">
                  <GoogleLoginButton
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                    disabled={loginLoading || googleLoginLoading}
                    loading={googleLoginLoading}
                  />
                </div>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    {!showOtpModal ? (
                      <motion.div
                        key="signup-form"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        style={{ position: 'relative' }}
                      >
                      {/* Welcome text */}
                      <div style={{ 
                        padding: '0 0 1.25rem 0',
                        marginBottom: '0.5rem',
                      }}>
                        <h2 className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#111', lineHeight: '1.2' }}>
                          Create an account
                        </h2>
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.9rem', color: '#666' }}>
                          Sign up to get started with your account
                        </p>
                      </div>

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
                            type={showSignupPassword ? 'text' : 'password'}
                            className={`form-control ${signupPassword && (signupPasswordValidation.minLength && signupPasswordValidation.hasLetter && signupPasswordValidation.hasNumber) ? 'is-valid' : signupPassword && !(signupPasswordValidation.minLength && signupPasswordValidation.hasLetter && signupPasswordValidation.hasNumber) ? 'is-invalid' : ''}`}
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={handleSignupPasswordChange}
                            style={{ 
                              fontSize: '0.95rem',
                              paddingRight: signupPassword && (signupPasswordValidation.minLength && signupPasswordValidation.hasLetter && signupPasswordValidation.hasNumber) ? '70px' : signupPassword && !(signupPasswordValidation.minLength && signupPasswordValidation.hasLetter && signupPasswordValidation.hasNumber) ? '70px' : '40px'
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="btn p-0 position-absolute"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowSignupPassword(!showSignupPassword);
                            }}
                            style={{
                              right: signupPassword && (signupPasswordValidation.minLength && signupPasswordValidation.hasLetter && signupPasswordValidation.hasNumber) ? '38px' : signupPassword && !(signupPasswordValidation.minLength && signupPasswordValidation.hasLetter && signupPasswordValidation.hasNumber) ? '38px' : '8px',
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
                            {showSignupPassword ? (
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
                          {signupPassword && (
                            <motion.div
                              key="signup-validation-criteria"
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
                                  color: signupPasswordValidation.minLength ? '#28a745' : '#dc3545',
                                  marginBottom: '0.25rem',
                                  transition: 'color 0.3s ease'
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
                                  color: signupPasswordValidation.hasLetter ? '#28a745' : '#dc3545',
                                  marginBottom: '0.25rem',
                                  transition: 'color 0.3s ease'
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
                                  color: signupPasswordValidation.hasNumber ? '#28a745' : '#dc3545',
                                  transition: 'color 0.3s ease'
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
                        {signupLoading ? 'Signing up...' : 'SIGN UP'}
                      </button>
                      </form>

                      {/* Signup/Login link */}
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
                          onClick={handleSwitchToLogin}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#000';
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#666';
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                        >
                          Sign in
                        </button>
                      </div>

                      {/* Divider */}
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

                      {/* Social signup buttons - USING FIREBASE */}
                      <div className="d-flex justify-content-center gap-3 mb-1">
                        <GoogleSignupButton
                          onSuccess={handleGoogleSignupSuccess}
                          onError={handleGoogleSignupError}
                          disabled={googleSignupLoading || showOtpModal}
                          loading={googleSignupLoading}
                        />
                      </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="otp-inline"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                      >
                      <div style={{ padding: '0 0 0.85rem', flexShrink: 0 }}>
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
                          onClick={() => setShowOtpModal(false)}
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

                      <OtpVerificationModal
                        inline
                        embedded
                        hideHeader
                        hideIntro
                        animate={false}
                        isOpen={showOtpModal}
                        email={email}
                        userName={name}
                        onVerify={handleOtpVerify}
                        onResend={handleResendOtp}
                        onClose={() => setShowOtpModal(false)}
                      />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Login;