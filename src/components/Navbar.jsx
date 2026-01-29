import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import logoImage from '../assets/images/logo.jpg';
import './Navbar.css';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import PublicLogin from '../pages/public/auth/Login';
import { showAlert } from '../services/notificationService';

const Navbar = () => {
  const { logoSrc, logoText, isLoading: brandingLoading } = useBranding();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const baseNavHeightRef = useRef(0); // Store base height (without mobile menu)
  const location = useLocation();
  const navRef = useRef(null);
  const { setCartOpen, getCartItemCount } = useCart();
  const { isCustomerAuthenticated, customer, logoutCustomer, checkAuth, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  const userButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchPanelRef = useRef(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown) {
        // Check if click is outside both the button and the dropdown (which is in portal)
        const clickedButton = userButtonRef.current && userButtonRef.current.contains(event.target);
        const clickedDropdown = event.target.closest('[data-user-dropdown="true"]');
        
        if (!clickedButton && !clickedDropdown) {
          setShowUserDropdown(false);
        }
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

  // If the customer becomes authenticated, ensure the login modal is closed.
  useEffect(() => {
    if (isCustomerAuthenticated) {
      setShowLoginModal(false);
    }
  }, [isCustomerAuthenticated]);

  useEffect(() => {
    // Close the mobile menu on route change
    setMobileOpen(false);
    setSearchOpen(false);

    // Temporarily disable global smooth scrolling so the jump to top is instant
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    window.scrollTo(0, 0);

    // Restore previous scroll behavior after the jump
    root.style.scrollBehavior = previousScrollBehavior || '';
  }, [location.pathname]);

  // Close search when clicking outside or pressing Escape
  useEffect(() => {
    if (!searchOpen) return undefined;

    const handleClickOutside = (event) => {
      const clickedButton = event.target.closest('.navbar-search-btn');
      const clickedPanel = searchPanelRef.current && searchPanelRef.current.contains(event.target);
      if (!clickedButton && !clickedPanel) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [searchOpen]);

  // Calculate and store base navbar height (without mobile menu)
  // Only update on resize, NOT when mobile menu opens/closes
  useEffect(() => {
    const updateBaseNavHeight = () => {
      if (navRef.current && !mobileOpen) {
        // Only calculate when menu is closed to get accurate base height
        const navbarMainRow = navRef.current.querySelector('.navbar-main-row');
        const wrapper = navRef.current.querySelector('.w-100');
        
        const mainRowHeight = navbarMainRow?.offsetHeight || 0;
        const wrapperPadding = wrapper ? 
          parseFloat(getComputedStyle(wrapper).paddingTop) + parseFloat(getComputedStyle(wrapper).paddingBottom) : 24;
        
        const baseHeight = mainRowHeight + wrapperPadding;
        const height = Math.ceil(baseHeight);
        
        // Store base height
        baseNavHeightRef.current = height;
        setNavHeight(height);
        
        // Always use stored base height for CSS variable
        document.documentElement.style.setProperty('--navbar-height', `${baseNavHeightRef.current}px`);
        
        // Remove padding-top from main-content-wrapper to eliminate whitespace
        const mainContentWrapper = document.querySelector('.main-content-wrapper');
        if (mainContentWrapper) {
          mainContentWrapper.style.paddingTop = '0px';
          mainContentWrapper.style.marginTop = '0px';
          mainContentWrapper.style.paddingBottom = '0px';
          mainContentWrapper.style.borderTop = 'none';
        }
      } else if (navRef.current && baseNavHeightRef.current > 0) {
        // Menu is open, but use stored base height
        document.documentElement.style.setProperty('--navbar-height', `${baseNavHeightRef.current}px`);
      }
    };

    // Calculate base height when menu is closed
    if (!mobileOpen) {
      updateBaseNavHeight();
      const timeoutId = setTimeout(updateBaseNavHeight, 100);
      const rafId = requestAnimationFrame(updateBaseNavHeight);
      
      window.addEventListener('resize', updateBaseNavHeight);
      return () => {
        clearTimeout(timeoutId);
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', updateBaseNavHeight);
      };
    } else {
      // Menu is open, just ensure we use stored base height
      if (baseNavHeightRef.current > 0) {
        document.documentElement.style.setProperty('--navbar-height', `${baseNavHeightRef.current}px`);
      }
    }
  }, [mobileOpen]);
  
  // Also update on initial mount to ensure it's set immediately
  useEffect(() => {
    const updateBaseNavHeight = () => {
      if (navRef.current && !mobileOpen) {
        const navbarMainRow = navRef.current.querySelector('.navbar-main-row');
        const wrapper = navRef.current.querySelector('.w-100');
        
        const mainRowHeight = navbarMainRow?.offsetHeight || 0;
        const wrapperPadding = wrapper ? 
          parseFloat(getComputedStyle(wrapper).paddingTop) + parseFloat(getComputedStyle(wrapper).paddingBottom) : 24;
        
        const baseHeight = mainRowHeight + wrapperPadding;
        const height = Math.ceil(baseHeight);
        
        // Store base height
        baseNavHeightRef.current = height;
        setNavHeight(height);
        
        // Always use stored base height for CSS variable
        document.documentElement.style.setProperty('--navbar-height', `${baseNavHeightRef.current}px`);
        
        // Remove padding-top from main-content-wrapper to eliminate whitespace
        const mainContentWrapper = document.querySelector('.main-content-wrapper');
        if (mainContentWrapper) {
          mainContentWrapper.style.paddingTop = '0px';
          mainContentWrapper.style.marginTop = '0px';
          mainContentWrapper.style.paddingBottom = '0px';
          mainContentWrapper.style.borderTop = 'none';
        }
      }
    };
    
    // Set immediately
    updateBaseNavHeight();
    
    // Use multiple methods to ensure it's set
    requestAnimationFrame(() => {
      updateBaseNavHeight();
      setTimeout(updateBaseNavHeight, 50);
      setTimeout(updateBaseNavHeight, 200);
    });
    
    // Also listen for resize to update base height
    window.addEventListener('resize', updateBaseNavHeight);
    return () => {
      window.removeEventListener('resize', updateBaseNavHeight);
    };
  }, []);


  const navLinks = [
    'Home',
    'All Products',
    'Contact',
  ];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    setSearchOpen(false);
    if (trimmed) {
      navigate(`/all-products?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/all-products');
    }
  };

  return (
    <>
    <motion.nav 
      className="navbar px-0"
      ref={navRef}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#FFFFFF', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: mobileOpen || searchOpen ? 'visible' : 'hidden',
        overflowY: mobileOpen || searchOpen ? 'visible' : 'hidden',
        overflowX: 'hidden',
        height: mobileOpen ? 'auto' : (navHeight ? `${navHeight}px` : 'auto'),
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        margin: 0,
        marginBottom: 0,
      }}
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0 }}
    >
      {/* Full-width inner wrapper with horizontal padding matching Products page exactly */}
      <div
        className="w-100 navbar-wrapper"
        style={{
          paddingTop: '12px',
          paddingBottom: mobileOpen ? '0px' : '12px',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          overflow: searchOpen ? 'visible' : 'hidden',
          overflowY: mobileOpen || searchOpen ? 'visible' : 'hidden',
        }}
      >
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
          }}
        >
        {/* Main navigation row: Logo (left/center on mobile), Menu items (desktop center), Icons (right) */}
        <div className="d-flex align-items-center justify-content-between w-100 navbar-main-row">
          {/* Left - Logo */}
          <Link
            to="/"
            className="navbar-brand d-flex align-items-center m-0"
            style={{ textDecoration: 'none' }}
          >
            <div className="d-flex align-items-center gap-2 navbar-logo-container">
              {brandingLoading || !logoSrc ? (
                <>
                  <div
                    aria-hidden="true"
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: 10,
                      background: "linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.2s ease-in-out infinite",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      height: 14,
                      width: 140,
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.2s ease-in-out infinite",
                    }}
                  />
                </>
              ) : (
                <>
                  <img
                    src={logoSrc}
                    alt={`${logoText || 'AJ Creative Studio'} logo`}
                className="navbar-logo"
                style={{
                  height: '40px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              <span className="navbar-brand-text" style={{ color: '#000', fontWeight: 600, fontSize: '1.125rem' }}>
                    {logoText || 'AJ Creative Studio'}
              </span>
                </>
              )}
            </div>
          </Link>

          {/* Center - Menu items (desktop only) */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            {navLinks.map((link) => {
              const getPath = () => {
                if (link === 'Home') return '/';
                if (link === 'All Products') return '/all-products';
                return `/${link.toLowerCase().replace(/\s+/g, '-')}`;
              };
              const path = getPath();
              const isActive = location.pathname === path || 
                (link === 'All Products' && location.pathname === '/all-products');
              return (
                <Link
                  key={link}
                  to={path}
                  className="nav-link px-0 navbar-menu-link"
                  style={{
                    textDecoration: isActive ? 'underline' : 'none',
                    textUnderlineOffset: '4px',
                  }}
                >
                  {link}
                </Link>
              );
            })}
          </div>

          {/* Right - Icons: Search, User, Cart */}
          <div
            className="d-flex align-items-center gap-3 navbar-icons-wrapper"
            style={{
              overflow: 'visible',
              height: '40px',
              alignItems: 'center',
              position: 'relative',
              paddingRight: '10px',
              marginRight: '-10px',
            }}
          >
            {/* Search icon */}
            <motion.button
              type="button"
              className="btn btn-link p-0 navbar-icon-btn navbar-search-btn"
              style={{ color: '#000', textDecoration: 'none' }}
              aria-label="Search"
              aria-expanded={searchOpen}
              whileHover={{ opacity: 0.7 }}
              whileTap={{ opacity: 0.5 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (!searchOpen) {
                  setSearchOpen(true);
                } else {
                  searchInputRef.current?.focus();
                }
              }}
            >
              <svg
                className="navbar-icon-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: 'all 0.2s ease' }}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            </motion.button>

            {/* User/Person icon with dropdown */}
            <div ref={userDropdownRef} style={{ position: 'relative' }}>
            <motion.button
                ref={userButtonRef}
              type="button"
              className="btn btn-link p-0 navbar-icon-btn navbar-user-btn"
              style={{ color: '#000', textDecoration: 'none' }}
              aria-label="User Account"
                aria-expanded={showUserDropdown}
              disabled={authLoading}
              aria-disabled={authLoading}
              whileHover={{ opacity: 0.7 }}
              whileTap={{ opacity: 0.5 }}
              transition={{ duration: 0.2 }}
                onClick={() => {
                  if (authLoading) return;
                  if (isCustomerAuthenticated) {
                    setShowUserDropdown(!showUserDropdown);
                } else {
                  setShowLoginModal(true);
                }
              }}
            >
              <svg
                className="navbar-icon-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'all 0.2s ease',
                  opacity: authLoading ? 0.45 : 1,
                }}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {authLoading && (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '14px',
                    height: '14px',
                    marginTop: '-7px',
                    marginLeft: '-7px',
                    color: '#111',
                  }}
                />
              )}
            </motion.button>
            </div>

            {/* User Dropdown Menu - Rendered via Portal to avoid overflow clipping */}
            {showUserDropdown && isCustomerAuthenticated && userButtonRef.current && createPortal(
              <motion.div
                data-user-dropdown="true"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed',
                  top: userButtonRef.current.getBoundingClientRect().bottom + 8,
                  right: window.innerWidth - userButtonRef.current.getBoundingClientRect().right,
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  zIndex: 10000,
                  overflow: 'hidden',
                }}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                  {/* User Info */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111' }}>
                      {customer?.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                      {customer?.email || ''}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigate('/orders');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#333',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <i className="fas fa-shopping-bag me-2" style={{ width: '16px' }}></i>
                      My Orders
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setShowUserDropdown(false);
                        const result = await showAlert.confirm(
                          'Logout',
                          'Are you sure you want to logout?',
                          'Logout',
                          'Cancel',
                          {
                            confirmButtonColor: '#ffc107',
                            cancelButtonColor: '#6c757d',
                            width: 340,
                            padding: '0.9rem 1rem',
                          }
                        );
                        if (result.isConfirmed) {
                          showAlert.loading('Logging out…');
                          await logoutCustomer();
                          showAlert.close();
                          showAlert.success('Logged Out', 'You have been logged out successfully.', {
                            width: 340,
                            padding: '0.9rem 1rem',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#ffc107',
                            timer: 2000,
                            timerProgressBar: true,
                          });
                          navigate('/');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#dc3545',
                        transition: 'background-color 0.2s',
                        borderTop: '1px solid #e5e7eb',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <i className="fas fa-sign-out-alt me-2" style={{ width: '16px' }}></i>
                      Logout
                    </button>
                  </div>
                </motion.div>,
                document.body
              )}

            {/* Shopping Cart with badge */}
            <div style={{ position: 'relative', overflow: 'visible' }}>
              <button
                type="button"
                className="btn btn-link p-0 position-relative navbar-icon-btn navbar-cart-btn"
                style={{ 
                  color: '#000', 
                  textDecoration: 'none', 
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Shopping Cart"
                onClick={() => setCartOpen(true)}
              >
              <svg
                className="navbar-icon-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: 'all 0.2s ease' }}
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
                {/* Cart badge */}
                {getCartItemCount() > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      backgroundColor: '#000',
                      color: '#FFF',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      zIndex: 1001,
                      minWidth: '18px',
                      boxSizing: 'border-box',
                      pointerEvents: 'none',
                    }}
                  >
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>

            {/* Hamburger visible only on mobile */}
            <button
              type="button"
              className="btn btn-link d-lg-none p-0"
              style={{ color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <div
                style={{
                  position: 'relative',
                  width: '22px',
                  height: '18px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#000',
                    borderRadius: '2px',
                    transition: 'transform 0.25s ease, top 0.25s ease',
                    top: mobileOpen ? '8px' : '1px',
                    transform: mobileOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#000',
                    borderRadius: '2px',
                    transition: 'opacity 0.2s ease',
                    top: '8.5px',
                    opacity: mobileOpen ? 0 : 1,
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#000',
                    borderRadius: '2px',
                    transition: 'transform 0.25s ease, top 0.25s ease',
                    top: mobileOpen ? '8px' : '16px',
                    transform: mobileOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
                  }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Search bar dropdown + backdrop */}
        <AnimatePresence>
          {searchOpen && (
            <>
              <motion.div
                className="navbar-search-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSearchOpen(false)}
              />
              <motion.div
                className="navbar-search-panel"
                ref={searchPanelRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
                  <div className="navbar-search-input-wrapper">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search"
                      className="navbar-search-input"
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="navbar-search-submit"
                      aria-label="Submit search"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <line x1="16.65" y1="16.65" x2="21" y2="21" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    className="navbar-search-close"
                    aria-label="Close search"
                    onClick={() => setSearchOpen(false)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>

        {/* Mobile: animated dropdown (items appear at bottom of navbar) */}
        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              className="d-lg-none mt-3"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="py-2"
                style={{
                  borderTop: '1px solid rgba(0,0,0,0.15)',
                }}
              >
                <div className="navbar-nav text-center">
                  {navLinks.map((link, index) => {
                    const getPath = () => {
                      if (link === 'Home') return '/';
                      if (link === 'All Products') return '/all-products';
                      return `/${link.toLowerCase().replace(/\s+/g, '-')}`;
                    };
                    const path = getPath();
                    const isActive = location.pathname === path || 
                      (link === 'All Products' && location.pathname === '/all-products');
                    return (
                      <Link
                        key={index}
                        to={path}
                        className="nav-link py-2 navbar-menu-link"
                        style={{
                          textDecoration: isActive ? 'underline' : 'none',
                          textUnderlineOffset: '4px',
                        }}
                        onClick={() => setMobileOpen(false)}
                      >
                        {link}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
    {showLoginModal && (
      <PublicLogin
        onClose={async () => {
          setShowLoginModal(false);
          await checkAuth();
        }}
        returnTo="/orders"
      />
    )}
    </>
  );
};

export default Navbar;

