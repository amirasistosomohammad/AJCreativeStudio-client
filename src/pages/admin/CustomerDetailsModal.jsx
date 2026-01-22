import React, { useState, useEffect } from "react";
import Portal from "../../components/Portal";
import { FaUser, FaCheckCircle, FaTimesCircle, FaUserCheck, FaUserTimes, FaEnvelope, FaCalendarAlt, FaGoogle, FaKey } from "react-icons/fa";

const CustomerDetailsModal = ({ 
  customer, 
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget) {
      await closeModal();
    }
  };

  const handleEscapeKey = async (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      await closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    document.body.classList.add("modal-open");
    
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.classList.remove("modal-open");
    };
  }, []);

  const closeModal = async () => {
    setIsClosing(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    onClose();
  };

  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <Portal>
      <div 
        className={`modal fade show d-block modal-backdrop-animation ${isClosing ? 'exit' : ''}`} 
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }} 
        onClick={handleBackdropClick} 
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg mx-3 mx-sm-auto">
          <div 
            className={`modal-content border-0 modal-content-animation ${isClosing ? 'exit' : ''}`} 
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div 
              className="modal-header border-0 text-white modal-smooth" 
              style={{ background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)" }}
            >
              <h5 className="modal-title fw-bold">
                <FaUser className="me-2" />
                Customer Details
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white btn-smooth" 
                onClick={closeModal} 
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body bg-light modal-smooth" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Header Card */}
              <div className="card border-0 bg-white mb-4">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                        style={{ 
                          width: "80px", 
                          height: "80px", 
                          background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)", 
                          fontSize: "2rem" 
                        }}
                      >
                        <FaUser />
                      </div>
                    </div>
                    <div className="col">
                      <h4 className="mb-1 text-dark">{customer.name || 'N/A'}</h4>
                      <p className="text-muted mb-2 small">{customer.email || 'N/A'}</p>
                      <div className="d-flex flex-wrap gap-2">
                        <span className={`badge ${customer.is_active ? 'bg-success' : 'bg-secondary'} fs-6`}>
                          {customer.is_active ? (
                            <>
                              <FaCheckCircle className="me-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="me-1" />
                              Inactive
                            </>
                          )}
                        </span>
                        {customer.register_status === 'verified' && customer.is_active ? (
                          <span className="badge bg-info fs-6">
                            <FaUserCheck className="me-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark fs-6">
                            <FaUserTimes className="me-1" />
                            Unverified
                          </span>
                        )}
                        {customer.signup_method === 'google' ? (
                          <span className="badge bg-danger fs-6">
                            <FaGoogle className="me-1" />
                            Google
                          </span>
                        ) : (
                          <span className="badge bg-primary fs-6">
                            <FaEnvelope className="me-1" />
                            Email
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="card border-0 bg-white mb-4">
                <div className="card-header bg-transparent border-bottom">
                  <h6 className="mb-0 fw-semibold text-dark">
                    <i className="fas fa-info-circle me-2 text-primary"></i>Customer Information
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <FaUser className="me-1" />Full Name
                      </label>
                      <p className="mb-0 fw-semibold text-dark">{customer.name || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <FaEnvelope className="me-1" />Email Address
                      </label>
                      <p className="mb-0 text-dark">{customer.email || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <i className="fas fa-toggle-on me-1"></i>Status
                      </label>
                      <p className="mb-0">
                        <span className={`badge ${customer.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {customer.is_active ? (
                            <>
                              <FaCheckCircle className="me-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="me-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <i className="fas fa-shield-alt me-1"></i>Verification Status
                      </label>
                      <p className="mb-0">
                        {customer.register_status === 'verified' && customer.is_active ? (
                          <span className="badge bg-info">
                            <FaUserCheck className="me-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark">
                            <FaUserTimes className="me-1" />
                            Unverified
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <i className="fas fa-sign-in-alt me-1"></i>Signup Method
                      </label>
                      <p className="mb-0">
                        {customer.signup_method === 'google' ? (
                          <span className="badge bg-danger">
                            <FaGoogle className="me-1" />
                            Google
                          </span>
                        ) : (
                          <span className="badge bg-primary">
                            <FaEnvelope className="me-1" />
                            Email/Password
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <FaCalendarAlt className="me-1" />Registered At
                      </label>
                      <p className="mb-0 text-dark">
                        {customer.created_at ? formatDateTime(customer.created_at) : 'N/A'}
                      </p>
                    </div>
                    {customer.updated_at && customer.updated_at !== customer.created_at && (
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold text-muted mb-1">
                          <i className="fas fa-edit me-1"></i>Last Updated
                        </label>
                        <p className="mb-0 text-dark">{formatDateTime(customer.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer border-top bg-white modal-smooth">
              <button type="button" className="btn btn-outline-secondary btn-smooth" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default CustomerDetailsModal;

