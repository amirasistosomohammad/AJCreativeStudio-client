import React from 'react';

/**
 * Modern, simple loading spinner component for admin pages
 * Displays a circular spinner with optional text below
 * 
 * @param {string} text - Optional text to display below the spinner
 * @param {string} size - Spinner size: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} color - Spinner color (default: primary color)
 * @param {object} style - Additional inline styles
 * @param {string} className - Additional CSS classes
 */
const LoadingSpinner = ({ 
  text = 'Loading...', 
  size = 'md',
  color,
  style = {},
  className = ''
}) => {
  // Size mappings
  const sizeMap = {
    sm: { spinner: '1rem', border: '0.15rem' },
    md: { spinner: '2rem', border: '0.2rem' },
    lg: { spinner: '3rem', border: '0.25rem' }
  };

  const spinnerSize = sizeMap[size] || sizeMap.md;
  const spinnerColor = color || 'var(--primary-color, #007bff)';

  return (
    <div 
      className={`d-flex flex-column align-items-center justify-content-center ${className}`}
      style={{
        padding: '3rem 2rem',
        minHeight: '150px',
        animation: 'none',
        transition: 'none',
        ...style
      }}
    >
      <div
        className="spinner-border"
        role="status"
        style={{
          width: spinnerSize.spinner,
          height: spinnerSize.spinner,
          borderWidth: spinnerSize.border,
          borderColor: `${spinnerColor} transparent ${spinnerColor} ${spinnerColor}`,
          animation: 'spinner-border 0.75s linear infinite',
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <p 
          className="mt-3 mb-0 small"
          style={{
            color: 'var(--text-muted, #6c757d)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

