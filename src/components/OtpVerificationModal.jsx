import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showAlert } from '../services/notificationService';
import { useBranding } from '../contexts/BrandingContext';

const OtpVerificationModal = ({
  email,
  userName,
  onVerify,
  onResend,
  onClose,
  isOpen,
  inline = false,
  hideHeader = false,
  embedded = false,
  hideIntro = false,
  animate = true,
}) => {
  const { logoSrc, logoText } = useBranding();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtp(newOtp.slice(0, 6));
      setError('');
      // Focus the last filled input or the last input
      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    showAlert.processing('', '', {
      width: 300,
      padding: '0.75rem 0.9rem',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="font-size:14px;font-weight:800;color:#111;line-height:1.2;">Verifying...</div>
          <div style="font-size:12px;color:#666;line-height:1.2;">Please wait</div>
        </div>
      `,
    });

    try {
      await onVerify(otpString);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      showAlert.close();
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    setError('');

    try {
      await onResend();
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  // Styles adapt for inline rendering vs overlay modal
  const backdropStyles = inline
    ? {}
    : {
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
      };

  const cardStyles = inline
    ? {
        position: 'relative',
        width: '100%',
        backgroundColor: embedded ? 'transparent' : 'white',
        borderRadius: embedded ? 0 : '10px',
        boxShadow: embedded ? 'none' : '0 8px 18px rgba(0,0,0,0.1)',
      }
    : {
        position: 'relative',
        zIndex: 10004,
        width: '100%',
        maxWidth: '520px',
        margin: '1rem',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 8px 18px rgba(0,0,0,0.15)',
      };

  const Backdrop = animate ? motion.div : 'div';
  const Card = animate ? motion.div : 'div';

  return (
    <Backdrop
      {...(animate
        ? {
            initial: { opacity: inline ? 1 : 0 },
            animate: { opacity: 1 },
            exit: { opacity: inline ? 1 : 0 },
          }
        : {})}
      style={backdropStyles}
      onClick={(e) => {
        if (!inline && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card
        {...(animate
          ? {
              initial: { opacity: 0, scale: inline ? 1 : 0.9, y: inline ? 0 : 20 },
              animate: { opacity: 1, scale: 1, y: 0 },
              exit: { opacity: 0, scale: inline ? 1 : 0.9, y: inline ? 0 : 20 },
              transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
            }
          : {})}
        onClick={(e) => {
          if (!inline) e.stopPropagation();
        }}
        style={cardStyles}
      >
        {!hideHeader && (
          <div
            className="d-flex align-items-center justify-content-between"
            style={{
              padding: '1.5rem 1.1rem 1rem',
              borderBottom: '1px solid #E0E0E0',
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
                {logoText}
              </span>
            </div>
            <button
              type="button"
              className="btn p-0 d-flex align-items-center justify-content-center"
              aria-label="Close"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#666',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            // When this OTP UI is embedded inside another modal (inline/embedded mode),
            // still give it comfortable left/right padding so it doesn't touch the edges.
            padding: embedded
              ? 'clamp(1rem, 2.5vw, 1.25rem) clamp(1.4rem, 4vw, 1.8rem) 1.5rem'
              : 'clamp(1rem, 2.5vw, 1.5rem)',
          }}
        >
          {!hideIntro && (
            <>
              <h2 className="fw-bold mb-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: '#111' }}>
                Verify Your Email
              </h2>
              <p className="text-muted mb-4" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1rem)', color: '#666' }}>
                We've sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit}>
            {/* OTP Input */}
            <div
              className="d-flex justify-content-center mb-4"
              style={{
                // One clean row of 6 boxes, aligned with the same left/right padding
                // as the heading and other content.
                flexWrap: 'nowrap',
                overflowX: 'visible',
                width: '100%',
                gap: 'clamp(4px, 1.4vw, 8px)',
                justifyContent: 'center',
              }}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  style={{
                    // Slightly smaller so all 6 boxes fit on one line on small screens
                    width: 'clamp(32px, 9.2vw, 52px)',
                    height: 'clamp(42px, 11.5vw, 60px)',
                    textAlign: 'center',
                    fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)',
                    fontWeight: 'bold',
                    border: error ? '2px solid #dc3545' : '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ffc107';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? '#dc3545' : '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  key="otp-error"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="mb-3"
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-warning w-100 fw-semibold"
              disabled={loading || otp.join('').length !== 6}
              style={{
                color: '#000',
                fontSize: '0.98rem',
                marginBottom: '1rem',
                // Align the button visually with the OTP boxes and text
                maxWidth: '320px',
                marginLeft: 'auto',
                marginRight: 'auto',
                opacity: otp.join('').length !== 6 ? 0.6 : 1,
                cursor: otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Code */}
            <div className="text-center" style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                Didn't receive the code?{' '}
              </span>
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  fontSize: '0.9rem',
                  textDecoration: 'underline',
                  color: resendCooldown > 0 ? '#999' : '#666',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  verticalAlign: 'baseline',
                  lineHeight: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (resendCooldown === 0) {
                    e.currentTarget.style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (resendCooldown === 0) {
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
                {resendLoading
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </Backdrop>
  );
};

export default OtpVerificationModal;

