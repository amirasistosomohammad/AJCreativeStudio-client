import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";

// Import logo and background
import Logo from "../assets/images/logo.jpg";
import BackgroundImage from "../assets/images/background_image.png";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ 
    username: "", 
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [imagesError, setImagesError] = useState({ logo: false, background: false });
  
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  // Color scheme with yellow as primary branding
  const theme = {
    primary: "#FFD700", // Gold/Yellow
    primaryDark: "#D4AF37", // Darker gold
    primaryLight: "#FFE44D", // Light yellow
    primaryLighter: "#FFF9E6", // Very light yellow
    secondary: "#FFA500", // Orange
    secondaryLight: "#FFB84D",
    accent: "#FFD700",
    textPrimary: "#1a1a1a",
    textSecondary: "#4a4a4a",
    textLight: "#6b6b6b",   
    backgroundLight: "#F5F5F0",
    backgroundWhite: "#ffffff",
    borderColor: "#e6d9a5",
    borderLight: "#f5f0d8",
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
  };

  useEffect(() => {
    // Load background image
    const img = new Image();
    img.src = BackgroundImage;
    img.onload = () => {
      console.log("Background image loaded successfully");
      setBackgroundLoaded(true);
    };
    img.onerror = () => {
      console.warn("Background image failed to load");
      setImagesError(prev => ({ ...prev, background: true }));
      setBackgroundLoaded(true);
    };

    // Check if user is already logged in - ONLY if not loading
    if (!loading) {
      const token = localStorage.getItem("admin_token");
      if (token) {
        console.log("Login: User already logged in, redirecting to admin dashboard");
        navigate("/admin/dashboard");
      }
    }
  }, [navigate, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔄 Login: Form submission started");

    // Basic validation
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    console.log("🔄 Login: Setting isSubmitting to true");

    try {
      // Use AuthContext login method
      console.log("📡 Login: Calling AuthContext login method");
      const result = await login({
        username: form.username,
        password: form.password
      });

      if (result.success) {
        console.log("✅ Login: AuthContext login successful");
        
        // Show success toast
        toast.success(`Welcome back, ${result.user.name || result.user.username}!`);

        console.log("🔄 Login: Redirecting to admin dashboard...");
        // Redirect to admin dashboard
        navigate("/admin/dashboard");
        
      } else {
        console.log("❌ Login: AuthContext login failed:", result.error);
        toast.error(result.error || "Login failed. Please check your credentials.");
      }

    } catch (error) {
      console.error("🚨 Login: Error occurred:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      console.log("🏁 Login: Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Show loading if AuthContext is still checking authentication
  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: theme.backgroundLight }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: theme.primary }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 style={{ color: theme.textPrimary }}>Loading...</h5>
        </div>
      </div>
    );
  }

  // Fallback background style if image fails to load
  const backgroundStyle = imagesError.background 
    ? {
        backgroundColor: theme.backgroundLight,
      }
    : {
        backgroundImage: `url(${BackgroundImage})`,
        backgroundColor: theme.backgroundLight,
      };

  return (
    <div className="login-page-container min-vh-100 d-flex flex-column align-items-center justify-content-center position-relative px-2" style={{ paddingTop: 0, marginTop: 0 }}>
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Background Image */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          ...backgroundStyle,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Logo Section - Outside the white panel */}
      <div className="position-relative mb-3 mb-md-4" style={{ zIndex: 10, marginTop: "0" }}>
        <div className="d-flex align-items-center justify-content-center">
          {/* System Logo */}
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "clamp(100px, 20vw, 140px)",
              height: "clamp(100px, 20vw, 140px)",
              flexShrink: 0,
              filter: logoLoaded ? "blur(0px)" : "blur(8px)",
              opacity: logoLoaded ? 1 : 0,
              transition: "all 0.6s ease",
            }}
          >
            {imagesError.logo ? (
              // Fallback logo if image fails to load
              <div 
                className="d-flex flex-column align-items-center justify-content-center"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <span 
                  className="fw-bold"
                  style={{
                    color: theme.primary,
                    fontSize: "1.5rem",
                    lineHeight: "1"
                  }}
                >
                  AJ
                </span>
                <span 
                  className="small fw-semibold mt-1"
                  style={{
                    color: theme.textLight,
                    fontSize: "0.6rem"
                  }}
                >
                  Studio
                </span>
              </div>
            ) : (
              <img
                src={Logo}
                alt="AJ Creative Studio Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onLoad={() => {
                  console.log("Logo loaded successfully");
                  setLogoLoaded(true);
                }}
                onError={(e) => {
                  console.warn("Logo failed to load");
                  setImagesError(prev => ({ ...prev, logo: true }));
                  setLogoLoaded(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Welcome Text - Outside the form card in column layout */}
      <div
        className="position-relative text-center mb-3 mb-md-4"
        style={{
          zIndex: 10,
          opacity: backgroundLoaded && logoLoaded ? 1 : 0,
          transform:
            backgroundLoaded && logoLoaded
              ? "translateY(0)"
              : "translateY(10px)",
          transition: "all 0.6s ease-in-out",
          maxWidth: "90%",
        }}
      >
        <div className="d-flex flex-column align-items-center">
          <h1
            className="fw-bold mb-1 mb-md-2 text-center"
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(1.3rem, 4.5vw, 1.8rem)",
              lineHeight: "1.2",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            Welcome to AJ Creative Studio
          </h1>
        </div>
      </div>

      {/* Form Card */}
      <div
        className="bg-white rounded-4 shadow-lg p-3 p-sm-4 p-md-5 position-relative mx-2"
        style={{
          maxWidth: "420px",
          width: "95%",
          border: `1px solid ${theme.borderLight}`,
          zIndex: 10,
          opacity: backgroundLoaded && logoLoaded ? 1 : 0,
          transform:
            backgroundLoaded && logoLoaded
              ? "translateY(0)"
              : "translateY(20px)",
          transition: "all 0.6s ease-in-out",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3) !important",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="mb-3">
            <label
              htmlFor="username"
              className="form-label fw-semibold mb-2"
              style={{
                fontSize: "0.9rem",
                color: theme.textSecondary,
              }}
            >
              Username
            </label>
            <div className="position-relative">
              <FaEnvelope
                className="position-absolute top-50 translate-middle-y ms-3"
                style={{ color: theme.primary }}
                size={16}
              />
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                className="form-control ps-5 fw-bolder"
                value={form.username}
                onChange={handleInput}
                disabled={isSubmitting}
                required
                style={{
                  backgroundColor: theme.primaryLighter,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: "10px",
                  height: "48px",
                  fontSize: "0.95rem",
                  transition: "all 0.2s ease",
                }}
                id="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="form-label fw-semibold mb-2"
              style={{
                fontSize: "0.9rem",
                color: theme.textSecondary,
              }}
            >
              Password
            </label>
            <div className="position-relative">
              <FaLock
                className="position-absolute top-50 translate-middle-y ms-3"
                style={{ color: theme.primary }}
                size={16}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                className="form-control ps-5 pe-5 fw-bolder"
                value={form.password}
                onChange={handleInput}
                disabled={isSubmitting}
                required
                style={{
                  backgroundColor: theme.primaryLighter,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: "10px",
                  height: "48px",
                  fontSize: "0.95rem",
                  transition: "all 0.2s ease",
                }}
                id="password"
              />
              <span
                onClick={() => !isSubmitting && setShowPassword(!showPassword)}
                className="position-absolute top-50 end-0 translate-middle-y me-3"
                style={{
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  zIndex: 10,
                  color: theme.primary,
                }}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn w-100 fw-semibold d-flex justify-content-center align-items-center position-relative"
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? theme.primaryLight : theme.primary,
              color: "white",
              height: "50px",
              borderRadius: "12px",
              border: "none",
              fontSize: "1.05rem",
              transition: "all 0.3s ease-in-out",
              overflow: "hidden",
              boxShadow: isSubmitting 
                ? "0 2px 4px rgba(0, 0, 0, 0.1)" 
                : "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = theme.primaryDark;
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = theme.primary;
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }
            }}
            onMouseDown={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="spinner me-2" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      {/* Custom Styles */}
      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .form-control:focus {
          border-color: ${theme.primary};
          box-shadow: 0 0 0 0.25rem ${theme.primary}20;
          background-color: ${theme.primaryLighter};
        }
        
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
        }

        .form-control:hover:not(:focus):not(:disabled) {
          border-color: ${theme.primary}80;
          background-color: ${theme.primaryLighter};
        }
      `}</style>
    </div>
  );
}

