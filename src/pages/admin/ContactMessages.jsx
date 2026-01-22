import React, { useCallback, useEffect, useMemo, useState } from "react";
import Portal from "../../components/Portal";
import { useAuth } from "../../contexts/AuthContext";
import { showAlert } from "../../services/notificationService";
import { toast } from "react-toastify";
import { FaEye, FaEnvelope } from "react-icons/fa";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const ContactMessages = () => {
  const { token } = useAuth();
  const [allMessages, setAllMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    last7Days: 0,
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailClosing, setDetailClosing] = useState(false);

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const fetchAllMessages = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/contact-messages?per_page=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-cache",
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        const text = await response.text();
        console.error("Response text:", text);
        throw new Error(
          `Invalid response from server: ${response.status} ${response.statusText}`
        );
      }

      if (!response.ok) {
        const errorMessage =
          data.message ||
          data.error ||
          `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (data.success && data.messages) {
        setAllMessages(data.messages);
      } else {
        setAllMessages([]);
      }
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      showAlert.error(
        "Contact Messages Error",
        error.message || "Unable to load contact messages"
      );
      setAllMessages([]);
      setStats({ total: 0, last7Days: 0 });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, apiBaseUrl]);

  const filterAndPaginateMessages = useCallback(() => {
    let filtered = [...allMessages];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((message) => {
        return (
          (message.name || "").toLowerCase().includes(search) ||
          (message.email || "").toLowerCase().includes(search) ||
          (message.phone || "").toLowerCase().includes(search) ||
          (message.comment || "").toLowerCase().includes(search)
        );
      });
    }

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    setMessages(paginated);
    setPaginationMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });
  }, [allMessages, searchTerm, currentPage, itemsPerPage]);

  const updateStats = useCallback(() => {
    const total = allMessages.length;
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 7);
    const last7Days = allMessages.filter((msg) => {
      if (!msg.created_at) return false;
      return new Date(msg.created_at) >= recentCutoff;
    }).length;

    setStats({ total, last7Days });
  }, [allMessages]);

  useEffect(() => {
    fetchAllMessages();
  }, [fetchAllMessages]);

  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateMessages();
      updateStats();
    }
  }, [filterAndPaginateMessages, initialLoading, updateStats]);

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  const isActionDisabled = (id = null) =>
    actionLock || (actionLoading && actionLoading !== id);

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setDetailClosing(false);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setDetailClosing(true);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedMessage(null);
      setDetailClosing(false);
    }, 180);
  };

  const handleDeleteMessage = async (message) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes");
      return;
    }

    const confirmation = await showAlert.confirm(
      "Delete Message",
      "Remove this contact message permanently?",
      "Delete",
      "Cancel"
    );

    if (!confirmation.isConfirmed) {
      return;
    }

    setActionLock(true);
    setActionLoading(message.id);
    showAlert.processing("Deleting Message", "Please wait...");

    try {
      const response = await fetch(`${apiBaseUrl}/contact-messages/${message.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete message");
      }

      showAlert.close();
      toast.success("Message deleted");
      setAllMessages((prev) => prev.filter((item) => item.id !== message.id));
    } catch (error) {
      console.error("Message delete error:", error);
      showAlert.close();
      toast.error(error.message || "Unable to delete message");
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 inventory-categories-container ${!loading ? "fadeIn" : ""}`}>
      {loading ? (
        <LoadingSpinner text="Loading Contact Messages..." />
      ) : (
        <>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <div className="flex-grow-1 mb-2 mb-md-0">
              <h1 className="h4 mb-1 fw-bold" style={{ color: "var(--text-primary)" }}>
                <i className="fas fa-envelope me-2"></i>
                Contact Messages
              </h1>
              <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
                View customer inquiries submitted from the contact form.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-sm"
                onClick={fetchAllMessages}
                disabled={loading}
                style={{
                  transition: "all 0.2s ease-in-out",
                  border: "2px solid var(--primary-color)",
                  color: "var(--primary-color)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                    e.target.style.backgroundColor = "var(--primary-color)";
                    e.target.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "var(--primary-color)";
                }}
              >
                <i className="fas fa-sync-alt me-1" />
                Refresh
              </button>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card stats-card h-100 shadow-sm" style={{ border: "1px solid rgba(0, 0, 0, 0.125)", borderRadius: "0.375rem" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--primary-color)" }}>
                        Total Messages
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
                        {initialLoading ? "..." : stats.total}
                      </div>
                    </div>
                    <div className="col-auto">
                      <FaEnvelope className="fa-2x" style={{ color: "var(--primary-light)", opacity: 0.7 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stats-card h-100 shadow-sm" style={{ border: "1px solid rgba(0, 0, 0, 0.125)", borderRadius: "0.375rem" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--accent-color)" }}>
                        Last 7 Days
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--accent-color)" }}>
                        {initialLoading ? "..." : stats.last7Days}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-calendar-alt fa-2x" style={{ color: "var(--accent-light)", opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-3" style={{ backgroundColor: "var(--background-white)" }}>
            <div className="card-body p-3">
              <div className="row g-2 align-items-start">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    Search Messages
                  </label>
                  <div className="input-group input-group-sm">
                    <span
                      className="input-group-text"
                      style={{
                        backgroundColor: "var(--background-light)",
                        borderColor: "var(--input-border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, email, phone, or comment..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-border)",
                        color: "var(--input-text)",
                      }}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-sm clear-search-btn"
                        type="button"
                        onClick={() => setSearchTerm("")}
                        disabled={loading}
                        style={{
                          color: "#6c757d",
                          backgroundColor: "transparent",
                          border: "none",
                          padding: "0.25rem 0.5rem",
                        }}
                        onMouseEnter={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.color = "#495057";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = "#6c757d";
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    Per Page
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header border-bottom-0 py-2" style={{ background: "var(--topbar-bg)", color: "var(--topbar-text)" }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 fw-semibold text-white">
                  <i className="fas fa-envelope me-2"></i>
                  Contact Messages
                  {!loading && (
                    <small className="opacity-75 ms-2 text-white">({paginationMeta.total} total)</small>
                  )}
                </h5>
              </div>
            </div>
            <div className="card-body p-0">
              {messages.length === 0 ? (
                <div className="p-3 text-muted small">No contact messages found.</div>
              ) : (
                <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table className="table table-striped table-hover mb-0" style={{ minWidth: "900px", tableLayout: "fixed", width: "100%" }}>
                    <thead style={{ backgroundColor: "var(--background-light)" }}>
                      <tr>
                        <th className="text-center small fw-semibold" style={{ width: "4%" }}>
                          #
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: "120px", minWidth: "120px" }}>
                          Actions
                        </th>
                        <th className="small fw-semibold" style={{ width: "200px", minWidth: "200px" }}>
                          Name
                        </th>
                        <th className="small fw-semibold" style={{ width: "220px", minWidth: "220px" }}>
                          Email
                        </th>
                        <th className="small fw-semibold" style={{ width: "180px", minWidth: "180px" }}>
                          Phone
                        </th>
                        <th className="small fw-semibold" style={{ width: "260px", minWidth: "260px" }}>
                          Comment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((message, index) => (
                        <tr key={message.id} className="align-middle" style={{ height: "48px", whiteSpace: "nowrap" }}>
                          <td className="text-center fw-bold" style={{ color: "var(--text-primary)", width: "40px", minWidth: "40px" }}>
                            {startIndex + index + 1}
                          </td>
                          <td className="text-center" style={{ width: "120px", minWidth: "120px", padding: "0.5rem" }}>
                            <div className="d-flex justify-content-center gap-1" style={{ gap: "0.25rem" }}>
                              <button
                                className="btn btn-info btn-sm text-white"
                                onClick={() => handleViewMessage(message)}
                                disabled={isActionDisabled(message.id)}
                                title="View Message"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "6px",
                                  transition: "all 0.2s ease-in-out",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <FaEye style={{ fontSize: "0.875rem" }} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm text-white"
                                onClick={() => handleDeleteMessage(message)}
                                disabled={isActionDisabled(message.id)}
                                title="Delete Message"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "6px",
                                  transition: "all 0.2s ease-in-out",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="fw-semibold text-truncate" title={message.name || "—"}>
                              {message.name || "—"}
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="text-muted text-truncate" title={message.email}>
                              {message.email}
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="text-muted text-truncate" title={message.phone || "—"}>
                              {message.phone || "—"}
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="text-muted small text-truncate" title={message.comment}>
                              {message.comment}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!loading && messages.length > 0 && (
              <div className="card-footer bg-white border-top px-3 py-2">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                  <div className="text-center text-md-start">
                    <small style={{ color: "var(--text-muted)" }}>
                      Showing{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.from || startIndex + 1}-{paginationMeta.to || Math.min(startIndex + messages.length, paginationMeta.total)}
                      </span>{" "}
                      of{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.total}
                      </span>{" "}
                      messages
                    </small>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={paginationMeta.current_page === 1}
                      style={{
                        transition: "all 0.2s ease-in-out",
                        border: "2px solid var(--primary-color)",
                        color: "var(--primary-color)",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!e.target.disabled) {
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                          e.target.style.backgroundColor = "var(--primary-color)";
                          e.target.style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "var(--primary-color)";
                      }}
                    >
                      <i className="fas fa-chevron-left me-1"></i>
                      Previous
                    </button>

                    <div className="d-md-none">
                      <small style={{ color: "var(--text-muted)" }}>
                        Page {paginationMeta.current_page} of {paginationMeta.last_page}
                      </small>
                    </div>

                    <button
                      className="btn btn-sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, paginationMeta.last_page))}
                      disabled={paginationMeta.current_page === paginationMeta.last_page}
                      style={{
                        transition: "all 0.2s ease-in-out",
                        border: "2px solid var(--primary-color)",
                        color: "var(--primary-color)",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!e.target.disabled) {
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                          e.target.style.backgroundColor = "var(--primary-color)";
                          e.target.style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "var(--primary-color)";
                      }}
                    >
                      Next
                      <i className="fas fa-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {showDetailModal && selectedMessage && (
            <Portal>
              <div
                className={`modal fade show d-block modal-backdrop-animation ${detailClosing ? "exit" : ""}`}
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  transition: "background-color 0.2s ease",
                  zIndex: 9999,
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  height: "100%",
                }}
                onClick={() => {
                  closeDetailModal();
                }}
                aria-modal="true"
                role="dialog"
              >
                <div
                  className="modal-dialog modal-dialog-centered modal-lg"
                  style={{ zIndex: 10000 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`modal-content border-0 modal-content-animation ${detailClosing ? "exit" : ""}`}
                    style={{
                      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      zIndex: 10000,
                    }}
                  >
                    <div className="modal-header border-0 text-white modal-smooth" style={{ backgroundColor: "var(--primary-color)" }}>
                      <h5 className="modal-title fw-bold">
                        <i className="fas fa-envelope-open-text me-2"></i>
                        Contact Message
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white btn-smooth"
                        onClick={() => {
                          closeDetailModal();
                        }}
                        aria-label="Close"
                      />
                    </div>
                    <div className="modal-body modal-smooth" style={{ backgroundColor: "#f8f9fa" }}>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <div className="fw-semibold">Name</div>
                          <div className="text-muted">{selectedMessage.name || "—"}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="fw-semibold">Email</div>
                          <div className="text-muted">{selectedMessage.email}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="fw-semibold">Phone</div>
                          <div className="text-muted">{selectedMessage.phone || "—"}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="fw-semibold">Submitted</div>
                          <div className="text-muted">
                            {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : "—"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="fw-semibold">Comment</div>
                        <div className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                          {selectedMessage.comment}
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer border-top bg-white modal-smooth">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-smooth"
                        onClick={() => {
                          closeDetailModal();
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Portal>
          )}
        </>
      )}
    </div>
  );
};

export default ContactMessages;

