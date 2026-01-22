import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { showAlert } from "../../services/notificationService";
import { FaEnvelope } from "react-icons/fa";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const EmailSubscribers = () => {
  const { token } = useAuth();
  const [allSubscribers, setAllSubscribers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
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
    totalSubscribers: 0,
    recentSubscribers: 0,
  });

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/email-subscribers?per_page=1000`, {
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

      if (data.success && data.subscribers) {
        setAllSubscribers(data.subscribers);
      } else {
        setAllSubscribers([]);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      showAlert.error(
        "Subscribers Error",
        error.message || "Unable to load email subscribers"
      );
      setAllSubscribers([]);
      setStats({
        totalSubscribers: 0,
        recentSubscribers: 0,
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, apiBaseUrl]);

  const filterAndPaginateSubscribers = useCallback(() => {
    let filtered = [...allSubscribers];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((subscriber) =>
        (subscriber.email || "").toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    setSubscribers(paginated);
    setPaginationMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });
  }, [allSubscribers, searchTerm, currentPage, itemsPerPage]);

  const updateStats = useCallback(() => {
    const total = allSubscribers.length;
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 7);

    const recent = allSubscribers.filter((subscriber) => {
      if (!subscriber.created_at) {
        return false;
      }
      return new Date(subscriber.created_at) >= recentCutoff;
    }).length;

    setStats({
      totalSubscribers: total,
      recentSubscribers: recent,
    });
  }, [allSubscribers]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateSubscribers();
      updateStats();
    }
  }, [filterAndPaginateSubscribers, initialLoading, updateStats]);

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 inventory-categories-container ${!loading ? "fadeIn" : ""}`}>
      {loading ? (
        <LoadingSpinner text="Loading Email Subscribers..." />
      ) : (
        <>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <div className="flex-grow-1 mb-2 mb-md-0">
              <h1 className="h4 mb-1 fw-bold" style={{ color: "var(--text-primary)" }}>
                <i className="fas fa-envelope me-2"></i>
                Email Subscribers
              </h1>
              <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
                View customers who subscribed from the landing page.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-sm"
                onClick={fetchSubscribers}
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
              <div
                className="card stats-card h-100 shadow-sm"
                style={{ border: "1px solid rgba(0, 0, 0, 0.125)", borderRadius: "0.375rem" }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--primary-color)" }}>
                        Total Subscribers
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
                        {initialLoading ? "..." : stats.totalSubscribers}
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
              <div
                className="card stats-card h-100 shadow-sm"
                style={{ border: "1px solid rgba(0, 0, 0, 0.125)", borderRadius: "0.375rem" }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--accent-color)" }}>
                        Last 7 Days
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--accent-color)" }}>
                        {initialLoading ? "..." : stats.recentSubscribers}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-user-plus fa-2x" style={{ color: "var(--accent-light)", opacity: 0.7 }}></i>
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
                    Search Subscribers
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
                      placeholder="Search by email..."
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
            <div
              className="card-header border-bottom-0 py-2"
              style={{ background: "var(--topbar-bg)", color: "var(--topbar-text)" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 fw-semibold text-white">
                  <i className="fas fa-envelope me-2"></i>
                  Subscriber List
                  {!loading && (
                    <small className="opacity-75 ms-2 text-white">({paginationMeta.total} total)</small>
                  )}
                </h5>
              </div>
            </div>
            <div className="card-body p-0">
              {subscribers.length === 0 ? (
                <div className="p-3 text-muted small">No email subscribers found.</div>
              ) : (
                <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table className="table table-striped table-hover mb-0" style={{ minWidth: "700px", tableLayout: "fixed", width: "100%" }}>
                    <thead style={{ backgroundColor: "var(--background-light)" }}>
                      <tr>
                        <th className="text-center small fw-semibold" style={{ width: "4%" }}>
                          #
                        </th>
                        <th className="small fw-semibold" style={{ width: "60%" }}>
                          Email
                        </th>
                        <th className="small fw-semibold text-center" style={{ width: "36%" }}>
                          Subscribed At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber, index) => (
                        <tr key={subscriber.id} className="align-middle" style={{ height: "48px", whiteSpace: "nowrap" }}>
                          <td
                            className="text-center fw-bold"
                            style={{ color: "var(--text-primary)", width: "40px", minWidth: "40px", whiteSpace: "nowrap" }}
                          >
                            {startIndex + index + 1}
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="fw-semibold text-truncate" title={subscriber.email}>
                              {subscriber.email}
                            </div>
                          </td>
                          <td className="text-center" style={{ color: "var(--text-muted)" }}>
                            {subscriber.created_at ? new Date(subscriber.created_at).toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!loading && subscribers.length > 0 && (
              <div className="card-footer bg-white border-top px-3 py-2">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                  <div className="text-center text-md-start">
                    <small style={{ color: "var(--text-muted)" }}>
                      Showing{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.from || startIndex + 1}-{paginationMeta.to || Math.min(startIndex + subscribers.length, paginationMeta.total)}
                      </span>{" "}
                      of{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.total}
                      </span>{" "}
                      subscribers
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
        </>
      )}
    </div>
  );
};

export default EmailSubscribers;

