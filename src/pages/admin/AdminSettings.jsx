import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useBranding } from "../../contexts/BrandingContext";
import { showAlert, showToast } from "../../services/notificationService";
import {
  FaKey,
  FaLock,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaShieldAlt,
  FaCog,
  FaImage,
} from "react-icons/fa";

const AdminSettings = () => {
  const { user, token, checkAuth } = useAuth();
  const { refresh: refreshBranding } = useBranding();
  const [activeTab, setActiveTab] = useState("password");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingData, setBrandingData] = useState(null);
  const [brandingText, setBrandingText] = useState("");
  const [brandingLogoFile, setBrandingLogoFile] = useState(null);
  const [brandingLogoPreview, setBrandingLogoPreview] = useState(null);
  const brandingLoadedRef = useRef(false);

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  // Use the same Admin theme variables from `src/index.css` for consistency
  const theme = useMemo(
    () => ({
      primary: "var(--primary-color)",
      primaryDark: "var(--primary-dark)",
      primaryLight: "var(--primary-light)",
      accent: "var(--primary-color)",
      accentLight: "var(--primary-light)",
      textPrimary: "var(--text-primary)",
      textSecondary: "var(--text-secondary)",
      inputBg: "var(--input-bg)",
      inputText: "var(--input-text)",
      inputBorder: "var(--input-border)",
    }),
    []
  );

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.current_password) {
      errors.current_password = ["Current password is required."];
    }

    if (!passwordForm.new_password) {
      errors.new_password = ["New password is required."];
    } else if (passwordForm.new_password.length < 6) {
      errors.new_password = ["Password must be at least 6 characters long."];
    }

    if (!passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = ["Please confirm your new password."];
    } else if (
      passwordForm.new_password !== passwordForm.new_password_confirmation
    ) {
      errors.new_password_confirmation = ["Passwords do not match."];
    }

    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showAlert.error("Validation Error", "Please check the form for errors.");
      return;
    }

    const result = await showAlert.confirm(
      "Change Password",
      "Are you sure you want to change your password?",
      "Yes, Change Password",
      "Cancel",
      {
        confirmButtonColor: theme.accent,
        cancelButtonColor: "#6c757d",
      }
    );

    if (!result.isConfirmed) return;

    showAlert.loading(
      "Changing Password...",
      "Please wait while we securely update your password",
      {
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
      }
    );

    setIsPasswordLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/admin/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          new_password_confirmation: passwordForm.new_password_confirmation,
        }),
      });

      const data = await response.json().catch(() => ({}));
      showAlert.close();

      if (response.ok) {
        // Ensure the success confirmation is visible even if SweetAlert is closing/animating.
        setTimeout(() => {
          showToast.success("Password changed successfully!");
        }, 80);
        showAlert.success("Success", "Password changed successfully!", {
          confirmButtonColor: "var(--primary-color)",
        });
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        setFormErrors({});
        await checkAuth();
      } else {
        if (data?.errors) {
          setFormErrors(data.errors);
          const errorMessages = Object.values(data.errors).flat().join("\n");
          showAlert.error("Password Change Failed", errorMessages);
        } else if (data?.message) {
          if (
            typeof data.message === "string" &&
            data.message.toLowerCase().includes("current password")
          ) {
            setFormErrors({
              current_password: ["Current password is incorrect."],
            });
          }
          showAlert.error("Password Change Failed", data.message);
        } else {
          showAlert.error(
            "Password Change Failed",
            "An unknown error occurred."
          );
        }
      }
    } catch (error) {
      showAlert.close();
      showAlert.error(
        "Network Error",
        "Unable to connect to server. Please try again."
      );
      console.error("Password change error:", error);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormErrors({});
  };

  const fetchBranding = async () => {
    if (!token) return;
    setBrandingLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/branding`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.branding) {
        const resolvedLogoUrl = data.branding.logo_url
          ? new URL(data.branding.logo_url, apiBaseUrl).toString()
          : null;
        setBrandingData(data.branding);
        setBrandingText(data.branding.logo_text || "AJ Creative Studio");
        setBrandingLogoPreview(resolvedLogoUrl);
      } else {
        showToast.error(data?.message || "Failed to load branding settings.");
      }
    } catch (e) {
      console.error("Branding fetch error:", e);
      showToast.error("Network error while loading branding settings.");
    } finally {
      setBrandingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "branding") return;
    if (brandingLoadedRef.current) return;
    brandingLoadedRef.current = true;
    fetchBranding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (brandingLogoPreview && brandingLogoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(brandingLogoPreview);
      }
    };
  }, [brandingLogoPreview]);

  return (
    <div className="container-fluid px-3 pt-0 pb-2 fadeIn">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center mb-3 gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: "72px",
              height: "72px",
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
              color: "white",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.25)",
            }}
          >
            <FaCog size={28} />
          </div>
          <div className="text-start">
            <h1 className="h4 mb-1 fw-bold" style={{ color: theme.textPrimary }}>
              Administrator Settings
            </h1>
            <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
              {user?.name || "System Administrator"} • System Administrator
            </p>
            <small style={{ color: "var(--text-muted)" }}>
              System maintenance and security settings
            </small>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Sidebar Navigation */}
        <div className="col-12 col-lg-3">
          <div
            className="card border-0 h-100"
            style={{ boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
          >
            <div className="card-header bg-transparent border-0 py-3 px-3">
              <h6 className="mb-0 fw-bold" style={{ color: theme.textPrimary }}>
                Settings Menu
              </h6>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-2">
                {/* Password Change Tab */}
                <button
                  className={`btn text-start p-3 d-flex align-items-center border-0 position-relative overflow-hidden ${
                    activeTab === "password" ? "active" : ""
                  }`}
                  onClick={() => handleTabChange("password")}
                  style={{
                    background:
                      activeTab === "password"
                        ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`
                        : "#f8f9fa",
                    border:
                      activeTab === "password" ? "none" : "1px solid #dee2e6",
                    borderRadius: "8px",
                    color: activeTab === "password" ? "white" : "#495057",
                    fontWeight: activeTab === "password" ? "600" : "500",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "password") {
                      e.currentTarget.style.background = "#e9ecef";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 8px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "password") {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      background:
                        activeTab === "password"
                          ? "rgba(255, 255, 255, 0.2)"
                          : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                      color: "white",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FaShieldAlt size={16} />
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                      Change Password
                    </div>
                    <small
                      style={{
                        opacity: activeTab === "password" ? 0.9 : 0.7,
                        fontSize: "0.75rem",
                      }}
                    >
                      Update administrator password
                    </small>
                  </div>
                </button>

                {/* Branding Tab */}
                <button
                  className={`btn text-start p-3 d-flex align-items-center border-0 position-relative overflow-hidden ${
                    activeTab === "branding" ? "active" : ""
                  }`}
                  onClick={() => handleTabChange("branding")}
                  style={{
                    background:
                      activeTab === "branding"
                        ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`
                        : "#f8f9fa",
                    border:
                      activeTab === "branding" ? "none" : "1px solid #dee2e6",
                    borderRadius: "8px",
                    color: activeTab === "branding" ? "white" : "#495057",
                    fontWeight: activeTab === "branding" ? "600" : "500",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "branding") {
                      e.currentTarget.style.background = "#e9ecef";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 8px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "branding") {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      background:
                        activeTab === "branding"
                          ? "rgba(255, 255, 255, 0.2)"
                          : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                      color: "white",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FaImage size={16} />
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                      Branding
                    </div>
                    <small
                      style={{
                        opacity: activeTab === "branding" ? 0.9 : 0.7,
                        fontSize: "0.75rem",
                      }}
                    >
                      Update logo and brand name
                    </small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-12 col-lg-9">
          {activeTab === "password" && (
            <div
              className="card border-0 h-100"
              style={{ boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
            >
              <div className="card-header bg-transparent border-0 py-3 px-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                      color: "white",
                    }}
                  >
                    <FaShieldAlt size={14} />
                  </div>
                  <h6 className="mb-0 fw-bold" style={{ color: theme.textPrimary }}>
                    Change Administrator Password
                  </h6>
                </div>
              </div>
              <div className="card-body p-3">
                <div
                  className="alert mb-4 border-0"
                  style={{
                    backgroundColor: "rgba(212, 160, 23, 0.12)",
                    border: "1px solid rgba(212, 160, 23, 0.25)",
                    color: "var(--text-primary)",
                  }}
                >
                  <strong>Administrator Note:</strong> As a system administrator,
                  you can only change your password. Personal information
                  modifications are restricted for security reasons.
                </div>

                <form onSubmit={handlePasswordChange}>
                  <div className="row g-3">
                    {/* Current Password */}
                    <div className="col-12">
                      <label
                        className="form-label small fw-semibold mb-2"
                        style={{ color: theme.textPrimary }}
                      >
                        Current Password *
                      </label>
                      <div className="input-group">
                        <span
                          className="input-group-text bg-transparent border-end-0"
                          style={{
                            borderColor: formErrors.current_password
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                        >
                          <FaLock
                            style={{
                              color: formErrors.current_password
                                ? "#dc3545"
                                : theme.textSecondary,
                            }}
                          />
                        </span>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="current_password"
                          className={`form-control border-start-0 ps-2 fw-semibold ${
                            formErrors.current_password ? "is-invalid" : ""
                          }`}
                          style={{
                            backgroundColor: theme.inputBg,
                            color: theme.inputText,
                            borderColor: formErrors.current_password
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                          value={passwordForm.current_password}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter current password"
                          disabled={isPasswordLoading}
                          required
                        />
                        <span
                          className="input-group-text bg-transparent border-start-0"
                          style={{
                            borderColor: formErrors.current_password
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            style={{
                              color: formErrors.current_password
                                ? "#dc3545"
                                : theme.textSecondary,
                            }}
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            disabled={isPasswordLoading}
                          >
                            {showCurrentPassword ? (
                              <FaEyeSlash style={{ fontSize: "0.95rem" }} />
                            ) : (
                              <FaEye style={{ fontSize: "0.95rem" }} />
                            )}
                          </button>
                        </span>
                      </div>
                      {formErrors.current_password && (
                        <div className="invalid-feedback d-block small mt-1">
                          {formErrors.current_password[0]}
                        </div>
                      )}
                    </div>

                    {/* New Password */}
                    <div className="col-12 col-md-6">
                      <label
                        className="form-label small fw-semibold mb-2"
                        style={{ color: theme.textPrimary }}
                      >
                        New Password *
                      </label>
                      <div className="input-group">
                        <span
                          className="input-group-text bg-transparent border-end-0"
                          style={{
                            borderColor: formErrors.new_password
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                        >
                          <FaLock
                            style={{
                              color: formErrors.new_password
                                ? "#dc3545"
                                : theme.textSecondary,
                            }}
                          />
                        </span>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="new_password"
                          className={`form-control border-start-0 ps-2 fw-semibold ${
                            formErrors.new_password ? "is-invalid" : ""
                          }`}
                          style={{
                            backgroundColor: theme.inputBg,
                            color: theme.inputText,
                            borderColor: formErrors.new_password
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                          value={passwordForm.new_password}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter new password"
                          disabled={isPasswordLoading}
                          required
                          minLength={6}
                        />
                        <span
                          className="input-group-text bg-transparent border-start-0"
                          style={{
                            borderColor: formErrors.new_password
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            style={{
                              color: formErrors.new_password
                                ? "#dc3545"
                                : theme.textSecondary,
                            }}
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={isPasswordLoading}
                          >
                            {showNewPassword ? (
                              <FaEyeSlash style={{ fontSize: "0.95rem" }} />
                            ) : (
                              <FaEye style={{ fontSize: "0.95rem" }} />
                            )}
                          </button>
                        </span>
                      </div>
                      {formErrors.new_password && (
                        <div className="invalid-feedback d-block small mt-1">
                          {formErrors.new_password[0]}
                        </div>
                      )}
                      <div
                        className="form-text small mt-1"
                        style={{ color: theme.textSecondary }}
                      >
                        Password must be at least 6 characters long
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="col-12 col-md-6">
                      <label
                        className="form-label small fw-semibold mb-2"
                        style={{ color: theme.textPrimary }}
                      >
                        Confirm New Password *
                      </label>
                      <div className="input-group">
                        <span
                          className="input-group-text bg-transparent border-end-0"
                          style={{
                            borderColor: formErrors.new_password_confirmation
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                        >
                          <FaLock
                            style={{
                              color: formErrors.new_password_confirmation
                                ? "#dc3545"
                                : theme.textSecondary,
                            }}
                          />
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="new_password_confirmation"
                          className={`form-control border-start-0 ps-2 fw-semibold ${
                            formErrors.new_password_confirmation
                              ? "is-invalid"
                              : ""
                          }`}
                          style={{
                            backgroundColor: theme.inputBg,
                            color: theme.inputText,
                            borderColor: formErrors.new_password_confirmation
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                          value={passwordForm.new_password_confirmation}
                          onChange={handlePasswordInputChange}
                          placeholder="Confirm new password"
                          disabled={isPasswordLoading}
                          required
                          minLength={6}
                        />
                        <span
                          className="input-group-text bg-transparent border-start-0"
                          style={{
                            borderColor: formErrors.new_password_confirmation
                              ? "#dc3545"
                              : theme.inputBorder,
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            style={{
                              color: formErrors.new_password_confirmation
                                ? "#dc3545"
                                : theme.textSecondary,
                            }}
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={isPasswordLoading}
                          >
                            {showConfirmPassword ? (
                              <FaEyeSlash style={{ fontSize: "0.95rem" }} />
                            ) : (
                              <FaEye style={{ fontSize: "0.95rem" }} />
                            )}
                          </button>
                        </span>
                      </div>
                      {formErrors.new_password_confirmation && (
                        <div className="invalid-feedback d-block small mt-1">
                          {formErrors.new_password_confirmation[0]}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn w-100 d-flex align-items-center justify-content-center py-2 border-0"
                        disabled={isPasswordLoading}
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                          color: "white",
                          borderRadius: "6px",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isPasswordLoading) {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.primary} 100%)`;
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 8px rgba(0,0,0,0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isPasswordLoading) {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`;
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        {isPasswordLoading ? (
                          <>
                            <FaSpinner
                              className="spinner me-2 flex-shrink-0"
                              style={{ fontSize: "0.75rem" }}
                            />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <FaKey
                              className="me-2 flex-shrink-0"
                              style={{ fontSize: "0.75rem" }}
                            />
                            Change Administrator Password
                            <FaArrowRight
                              className="ms-2 flex-shrink-0"
                              style={{ fontSize: "0.625rem" }}
                            />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div
              className="card border-0 h-100"
              style={{ boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
            >
              <div className="card-header bg-transparent border-0 py-3 px-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                      color: "white",
                    }}
                  >
                    <FaImage size={14} />
                  </div>
                  <h6 className="mb-0 fw-bold" style={{ color: theme.textPrimary }}>
                    Branding Settings
                  </h6>
                </div>
              </div>

              <div className="card-body p-3">
                <div
                  className="alert mb-4 border-0"
                  style={{
                    backgroundColor: "rgba(0, 102, 204, 0.08)",
                    border: "1px solid rgba(0, 102, 204, 0.15)",
                    color: "var(--text-primary)",
                  }}
                >
                  <strong>Tip:</strong> This updates the public storefront logo and brand name.
                </div>

                {brandingLoading ? (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <FaSpinner className="spinner me-2" style={{ fontSize: "0.9rem" }} />
                    <span>Loading branding…</span>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      if (!token) {
                        showToast.error("You are not authenticated.");
                        return;
                      }

                      const result = await showAlert.confirm(
                        "Update Branding",
                        "Save these branding changes?",
                        "Yes, Save",
                        "Cancel",
                        {
                          confirmButtonColor: theme.accent,
                          cancelButtonColor: "#6c757d",
                        }
                      );

                      if (!result.isConfirmed) return;

                      setBrandingSaving(true);
                      showAlert.loading("Saving Branding…", "Uploading and saving changes.", {
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                      });

                      try {
                        const fd = new FormData();
                        fd.append("logo_text", brandingText);
                        if (brandingLogoFile) fd.append("logo", brandingLogoFile);

                        const res = await fetch(`${apiBaseUrl}/admin/branding`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                          },
                          body: fd,
                        });

                        const data = await res.json().catch(() => null);
                        showAlert.close();

                        if (res.ok && data?.success && data?.branding) {
                          const resolvedLogoUrl = data.branding.logo_url
                            ? new URL(data.branding.logo_url, apiBaseUrl).toString()
                            : null;
                          setBrandingData(data.branding);
                          setBrandingText(data.branding.logo_text || "AJ Creative Studio");
                          setBrandingLogoFile(null);
                          setBrandingLogoPreview(resolvedLogoUrl);
                          await refreshBranding();
                          showToast.success("Branding updated.");
                        } else if (res.status === 422) {
                          showToast.error("Validation error. Please check your logo file and text.");
                        } else {
                          showToast.error(data?.message || "Failed to update branding.");
                        }
                      } catch (err) {
                        showAlert.close();
                        console.error("Branding update error:", err);
                        showToast.error("Network error while saving branding.");
                      } finally {
                        setBrandingSaving(false);
                      }
                    }}
                  >
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold" style={{ color: theme.textPrimary }}>
                          Logo Text
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandingText}
                          onChange={(e) => setBrandingText(e.target.value)}
                          placeholder="AJ Creative Studio"
                          style={{
                            background: theme.inputBg,
                            color: theme.inputText,
                            border: `1px solid ${theme.inputBorder}`,
                          }}
                        />
                        <small className="text-muted">Shown next to the logo in the navbar.</small>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold" style={{ color: theme.textPrimary }}>
                          Logo Image
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setBrandingLogoFile(file);
                            if (!file) return;
                            const url = URL.createObjectURL(file);
                            setBrandingLogoPreview(url);
                          }}
                          style={{
                            background: theme.inputBg,
                            color: theme.inputText,
                            border: `1px solid ${theme.inputBorder}`,
                          }}
                        />
                        <small className="text-muted">PNG/JPG/WEBP up to 2MB.</small>
                      </div>

                      <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 12,
                                border: "1px solid rgba(0,0,0,0.1)",
                                background: "#fff",
                                overflow: "hidden",
                              }}
                            >
                              {brandingLogoPreview ? (
                                <img
                                  src={brandingLogoPreview}
                                  alt="Logo preview"
                                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                              ) : (
                                <span className="text-muted" style={{ fontSize: 12 }}>
                                  No logo
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ color: theme.textPrimary }}>
                                Preview
                              </div>
                              <div className="text-muted" style={{ fontSize: 13 }}>
                                {brandingText || brandingData?.logo_text || "AJ Creative Studio"}
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn d-flex align-items-center gap-2"
                            disabled={brandingSaving}
                            style={{
                              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                              color: "white",
                              borderRadius: 8,
                              padding: "0.6rem 1rem",
                              fontWeight: 600,
                              border: "none",
                            }}
                          >
                            {brandingSaving ? (
                              <>
                                <FaSpinner className="spinner me-2 flex-shrink-0" style={{ fontSize: "0.8rem" }} />
                                Saving…
                              </>
                            ) : (
                              <>
                                Save Branding <FaArrowRight />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .fadeIn {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;


