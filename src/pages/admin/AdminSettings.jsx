import React, { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
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
} from "react-icons/fa";

const AdminSettings = () => {
  const { user, token, checkAuth } = useAuth();
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


