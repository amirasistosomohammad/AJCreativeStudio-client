import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { showAlert } from '../services/notificationService';

const GoogleSignupButton = ({ onSuccess, onError, disabled = false, loading: externalLoading = false }) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const loading = externalLoading || internalLoading;
  
  useEffect(() => {
    console.log('🔵 GoogleSignupButton MOUNTED/RENDERED', { disabled, loading, externalLoading, internalLoading });
    const button = document.querySelector('button:has(svg path[fill="#4285F4"])');
    console.log('🔵 Button found in DOM:', !!button);
    if (button) {
      console.log('🔵 Button computed styles:', {
        display: window.getComputedStyle(button).display,
        visibility: window.getComputedStyle(button).visibility,
        opacity: window.getComputedStyle(button).opacity,
        height: window.getComputedStyle(button).height,
        width: window.getComputedStyle(button).width,
      });
    }
  }, [disabled, loading, externalLoading, internalLoading]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔵 GoogleSignupButton clicked!', { disabled, loading });
    
    if (disabled || loading) {
      console.log('🔵 Button disabled or loading, returning');
      return;
    }

    setInternalLoading(true);
    
    // Show loading alert
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

    try {
      console.log('🔵 Starting Firebase signup...');
      const provider = new GoogleAuthProvider();
      
      // Add custom parameters to potentially reduce Google's 2FA prompts
      // NOTE: We CANNOT control which 2FA method Google uses (SMS, authenticator app, etc.)
      // That is determined by the user's Google account settings and Google's security system
      // Users can configure their preferred 2FA methods at: https://myaccount.google.com/security
      provider.setCustomParameters({
        prompt: 'select_account', // Show account picker, may reduce 2FA prompts for returning users
        // Other available prompts: 'consent', 'none', but we cannot control 2FA method selection
      });
      
      // Add additional scopes if needed (email and profile are included by default)
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get the ID token
      const idToken = await user.getIdToken();
      console.log('Firebase ID token obtained:', idToken ? 'Yes' : 'No');
      
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log('API Base URL:', apiBaseUrl);
      
      const response = await fetch(`${apiBaseUrl}/auth/firebase/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ 
          id_token: idToken,
          email: user.email,
          name: user.displayName,
        }),
      });
      
      const data = await response.json().catch(() => ({}));
      console.log('Firebase signup response:', data);
      console.log('Firebase signup - email_verified_at:', data?.customer?.email_verified_at);
      
      showAlert.close();
      setInternalLoading(false);
      
      if (response.ok && data.success) {
        // Firebase signup users are already verified by Google, so they should NEVER see OTP
        // The backend sets email_verified_at and register_status='verified'
        if (data.customer?.email_verified_at) {
          console.log('✅ Firebase user is verified - skipping OTP');
        }
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        const error = new Error(data?.message || 'Google registration failed. Please try again.');
        error.code = data?.code;
        if (onError) {
          onError(error);
        }
      }
    } catch (err) {
      console.error('Firebase Google signup error:', err);
      setInternalLoading(false);
      
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the Google auth popup
        // Close the processing alert first, then show cancellation message after a brief delay
        showAlert.close();
        setTimeout(() => {
          showAlert.info(
            'Sign-up Cancelled',
            'You cancelled the Google sign-up. Please try again if you want to continue.',
            {
              width: 360,
              padding: '0.9rem 1rem',
              confirmButtonText: 'OK',
              confirmButtonColor: '#ffc107',
              allowOutsideClick: true,
              allowEscapeKey: true,
            }
          );
        }, 300); // Small delay to ensure processing alert closes first
        return; // Don't call onError for cancelled popup
      }
      
      // For other errors, close processing alert and show error
      showAlert.close();
      const errorMessage = 'Network error. Please check your connection and try again.';
      if (onError) {
        onError(new Error(errorMessage));
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
      style={{
        fontSize: '0.9rem',
        padding: '0.6rem 1.2rem',
        borderColor: '#4285F4',
        color: '#4285F4',
        backgroundColor: '#ffffff',
        minWidth: '260px',
        width: '260px',
        gap: '8px',
        fontWeight: 500,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '24px',
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        display: 'flex',
        opacity: (disabled || loading) ? 0.6 : 1,
        visibility: 'visible',
        position: 'relative',
        zIndex: 100,
        margin: '0 auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          setIsHovered(true);
          e.currentTarget.style.backgroundColor = '#E8F0FE';
          e.currentTarget.style.borderColor = '#1A73E8';
          e.currentTarget.style.color = '#1A73E8';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(66, 133, 244, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          setIsHovered(false);
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#4285F4';
          e.currentTarget.style.color = '#4285F4';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <path fill={isHovered ? '#1A73E8' : '#4285F4'} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill={isHovered ? '#188038' : '#34A853'} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill={isHovered ? '#F9AB00' : '#FBBC05'} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill={isHovered ? '#D93025' : '#EA4335'} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>{loading ? 'Google' : 'Google'}</span>
    </button>
  );
};

export default GoogleSignupButton;

