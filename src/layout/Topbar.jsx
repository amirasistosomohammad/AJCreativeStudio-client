import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useBranding } from "../contexts/BrandingContext";

const Topbar = ({ onToggleSidebar }) => {
  const { user, admin, logout, loading, isAuthenticated } = useAuth();
  const { logoSrc, logoText, isLoading: brandingLoading } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is admin - STATIC CHECK (no DB lookup needed)
  // If we're authenticated and on admin routes, assume admin until proven otherwise
  const currentUser = user || admin;
  const hasToken = Boolean(localStorage.getItem('token') || localStorage.getItem('admin_token'));
  const isOnAdminRoute = location.pathname.startsWith('/admin');
  
  // Determine if admin: check user data if available, otherwise assume admin if authenticated on admin routes
  const isAdmin = useMemo(() => {
    if (currentUser) {
      // If user data is loaded, check role/type/username
      return currentUser.role === 'admin' || 
             currentUser.type === 'admin' || 
             currentUser.username === 'admin@admin.com';
    }
    // If user data not loaded yet but we're authenticated on admin routes, assume admin
    // This allows immediate display of "System Administrator" without waiting for user data
    return hasToken && isOnAdminRoute && !loading;
  }, [currentUser, hasToken, isOnAdminRoute, loading]);
  
  // Static display name - admin is always "System Administrator" (no loading state), personnel loads their name
  const displayName = isAdmin ? "System Administrator" : (currentUser?.name || currentUser?.username || "User");
  const displayRole = isAdmin ? "Administrator" : (currentUser?.position || currentUser?.role || "User");

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        logout();
        toast.success("You have been logged out successfully");
        navigate("/admin/login");
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("There was a problem logging out. Please try again.");
      }
    }
  };

  return (
    <nav className="sb-topnav navbar navbar-expand navbar-dark">
      {/* Navbar Brand - RESPONSIVE */}
      <div className="navbar-brand ps-3 ps-sm-4 d-flex align-items-center">
        <div className="d-flex align-items-center" style={{ gap: "12px" }}>
          {/* Larger Responsive Logo */}
          {brandingLoading || !logoSrc ? (
            <div
              aria-hidden="true"
              className="d-none d-sm-block"
              style={{
                width: 45,
                height: 45,
                borderRadius: 12,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.2s ease-in-out infinite",
              }}
            />
          ) : (
            <img
              src={logoSrc}
              alt={`${logoText} Logo`}
              className="d-none d-sm-block"
              style={{
                width: "45px",
                height: "45px",
                objectFit: "contain",
              }}
            />
          )}

          {/* Mobile Logo - Smaller */}
          {brandingLoading || !logoSrc ? (
            <div
              aria-hidden="true"
              className="d-block d-sm-none"
              style={{
                width: 35,
                height: 35,
                borderRadius: 10,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.2s ease-in-out infinite",
              }}
            />
          ) : (
            <img
              src={logoSrc}
              alt={`${logoText} Logo`}
              className="d-block d-sm-none"
              style={{
                width: "35px",
                height: "35px",
                objectFit: "contain",
              }}
            />
          )}

          {/* Text Brand Name - Responsive */}
          <div className="d-flex flex-column justify-content-center">
            {/* Desktop & Tablet */}
            <span
              className="fw-bold text-white d-none d-md-block"
              style={{
                fontSize: "20px",
                lineHeight: "1.1",
              }}
            >
              {brandingLoading ? "" : logoText}
            </span>

            {/* Mobile - All screens (showing full name) */}
            <span
              className="fw-bold text-white d-block d-md-none"
              style={{
                fontSize: "clamp(16px, 4.5vw, 20px)",
                lineHeight: "1.2",
              }}
            >
              {brandingLoading ? "" : logoText}
            </span>

            {/* Subtitle - Desktop & Tablet only */}
            <small
              className="text-white-50 d-none d-sm-block"
              style={{
                fontSize: "11px",
                lineHeight: "1.1",
              }}
            >
              Admin Portal
            </small>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle */}
      <button
        className="btn btn-link btn-sm order-1 order-lg-0 me-2 me-lg-0"
        id="sidebarToggle"
        onClick={onToggleSidebar}
        style={{
          color: "var(--background-white)",
          marginLeft: window.innerWidth >= 992 ? "1rem" : "0",
        }}
      >
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <i className="fas fa-bars"></i>
      </button>

      {/* User Dropdown */}
      <ul className="navbar-nav ms-auto me-2 me-lg-3">
        <li className="nav-item dropdown">
          <a
            className="nav-link dropdown-toggle d-flex align-items-center"
            id="navbarDropdown"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div className="position-relative me-2">
              <div
                className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                }}
              >
                <i
                  className="fas fa-user text-dark"
                  style={{ fontSize: "14px" }}
                ></i>
              </div>
            </div>
            {/* Hide username on mobile */}
            <span className="d-none d-lg-inline">
              {displayName}
            </span>
          </a>
          <ul
            className="dropdown-menu dropdown-menu-end"
            aria-labelledby="navbarDropdown"
          >
            <li>
              <div className="dropdown-header">
                <strong>{displayName}</strong>
                {!isAdmin && currentUser && (
                  <div className="small text-muted">{currentUser?.username || "Username"}</div>
                )}
                <div className="small text-muted">{displayRole}</div>
              </div>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button
                className="dropdown-item custom-dropdown-item"
                onClick={() => navigate("/admin/profile")}
              >
                <i className="fas fa-user me-2"></i>Profile
              </button>
            </li>
            <li>
              <button
                className="dropdown-item custom-dropdown-item"
                onClick={() => navigate("/admin/settings")}
              >
                <i className="fas fa-cog me-2"></i>Settings
              </button>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button
                className="dropdown-item custom-dropdown-item logout-item"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt me-2"></i>Logout
              </button>
            </li>
          </ul>
        </li>
      </ul>

      {/* Custom CSS for dropdown hover effects */}
      <style jsx>{`
        .custom-dropdown-item {
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          padding: 0.375rem 1rem;
          color: #212529;
          transition: all 0.15s ease-in-out;
        }

        .custom-dropdown-item:hover {
          background-color: #f8f9fa;
          color: #16181b;
        }

        .custom-dropdown-item:focus {
          background-color: #f8f9fa;
          color: #16181b;
          outline: none;
        }

        .logout-item {
          color: #dc3545 !important;
        }

        .logout-item:hover {
          background-color: rgba(220, 53, 69, 0.1) !important;
          color: #dc3545 !important;
        }

        .logout-item:focus {
          background-color: rgba(220, 53, 69, 0.1) !important;
          color: #dc3545 !important;
          outline: none;
        }

        .dropdown-menu .custom-dropdown-item {
          display: block;
          clear: both;
          font-weight: 400;
          text-decoration: none;
          white-space: nowrap;
          border: 0;
        }

        .dropdown-menu {
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }

        .dropdown-menu .custom-dropdown-item:active {
          background-color: var(--primary-color);
          color: white;
        }
      `}</style>
    </nav>
  );
};

export default Topbar;

