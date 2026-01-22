import React, { useState, useEffect } from "react";
import Portal from "../../components/Portal";
import { FaClock, FaSignInAlt, FaSignOutAlt, FaUser, FaGlobe, FaDesktop } from "react-icons/fa";

const TimeLogDetailsModal = ({ 
  timeLog, 
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

  if (!timeLog) return null;

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
                <FaClock className="me-2" />
                Time Log Details
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
                          background: timeLog.action === 'login' 
                            ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
                            : "linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)", 
                          fontSize: "2rem" 
                        }}
                      >
                        {timeLog.action === 'login' ? <FaSignInAlt /> : <FaSignOutAlt />}
                      </div>
                    </div>
                    <div className="col">
                      <h4 className="mb-1 text-dark">{timeLog.customer_name || 'N/A'}</h4>
                      <p className="text-muted mb-2 small">{timeLog.customer_email || 'N/A'}</p>
                      <div className="d-flex flex-wrap gap-2">
                        <span className={`badge ${timeLog.action === 'login' ? 'bg-success' : 'bg-danger'} fs-6`}>
                          {timeLog.action === 'login' ? (
                            <>
                              <FaSignInAlt className="me-1" />
                              Login
                            </>
                          ) : (
                            <>
                              <FaSignOutAlt className="me-1" />
                              Logout
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Log Information */}
              <div className="card border-0 bg-white mb-4">
                <div className="card-header bg-transparent border-bottom">
                  <h6 className="mb-0 fw-semibold text-dark">
                    <i className="fas fa-info-circle me-2 text-primary"></i>Time Log Information
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <FaUser className="me-1" />Customer Name
                      </label>
                      <p className="mb-0 fw-semibold text-dark">{timeLog.customer_name || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <i className="fas fa-envelope me-1"></i>Email Address
                      </label>
                      <p className="mb-0 text-dark">{timeLog.customer_email || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <FaClock className="me-1" />Action
                      </label>
                      <p className="mb-0">
                        <span className={`badge ${timeLog.action === 'login' ? 'bg-success' : 'bg-danger'}`}>
                          {timeLog.action === 'login' ? (
                            <>
                              <FaSignInAlt className="me-1" />
                              Login
                            </>
                          ) : (
                            <>
                              <FaSignOutAlt className="me-1" />
                              Logout
                            </>
                          )}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <i className="fas fa-calendar-alt me-1"></i>Date & Time
                      </label>
                      <p className="mb-0 text-dark">{formatDateTime(timeLog.logged_at)}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <FaGlobe className="me-1" />IP Address
                      </label>
                      <p className="mb-0 text-dark">{timeLog.ip_address || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">
                        <FaDesktop className="me-1" />User Agent
                      </label>
                      <p className="mb-0 text-dark" style={{ wordBreak: 'break-word' }}>
                        {timeLog.user_agent || 'N/A'}
                      </p>
                    </div>
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

export default TimeLogDetailsModal;

