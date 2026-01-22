import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { showAlert } from "../../services/notificationService";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaClock, FaSignInAlt, FaSignOutAlt, FaUser, FaFilter, FaEye } from 'react-icons/fa';
import LoadingSpinner from '../../components/admin/LoadingSpinner';
import TimeLogDetailsModal from './TimeLogDetailsModal';

const TimeLogging = () => {
  const { token } = useAuth();
  const [allTimeLogs, setAllTimeLogs] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    loginLogs: 0,
    logoutLogs: 0,
  });
  const [selectedTimeLog, setSelectedTimeLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Fetch all customers for filter
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/customers?per_page=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.customers) {
          setCustomers(data.customers);
        }
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, [token, apiBaseUrl]);

  // Fetch time logs ONCE (all data), filtering + pagination are handled client-side
  const fetchTimeLogs = useCallback(async (isInitial = false) => {
    setLoading(true);
    if (isInitial) {
      setInitialLoading(true);
    }
    try {
      // Build query parameters: fetch a large page once, no filters
      const params = new URLSearchParams();
      params.append('per_page', '1000');
      params.append('page', '1');
      params.append('sort_by', 'logged_at');
      params.append('sort_order', 'desc');

      const response = await fetch(`${apiBaseUrl}/customer-time-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
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
        console.error("API Error Response:", data);
        const errorMessage =
          data.message ||
          data.error ||
          `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (data.success && data.time_logs) {
        // Store all logs for client-side filtering
        const logs = data.time_logs;
        setAllTimeLogs(logs);

        // Stats based on all logs
        const loginCount = logs.filter(log => log.action === 'login').length;
        const logoutCount = logs.filter(log => log.action === 'logout').length;
        setStats({
          totalLogs: logs.length,
          loginLogs: loginCount,
          logoutLogs: logoutCount,
        });
      } else {
        setAllTimeLogs([]);
        setStats({
          totalLogs: 0,
          loginLogs: 0,
          logoutLogs: 0,
        });
      }

      // Reset visible logs & pagination; actual filtering done in filterAndPaginateTimeLogs
      setTimeLogs([]);
      setPaginationMeta({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
      });
    } catch (error) {
      console.error("Error fetching time logs:", error);
      toast.error(error.message || "Unable to load time logs");
      setTimeLogs([]);
      setAllTimeLogs([]);
      setPaginationMeta({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
      });
      setStats({
        totalLogs: 0,
        loginLogs: 0,
        logoutLogs: 0,
      });
    } finally {
      setLoading(false);
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  }, [token, apiBaseUrl]);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch ALL time logs once on mount (or when token/base URL changes)
  useEffect(() => {
    fetchTimeLogs(true);
  }, [fetchTimeLogs]);

  // Ensure toast container has highest z-index above modals
  useEffect(() => {
    const setToastZIndex = () => {
      const toastContainers = document.querySelectorAll('.Toastify__toast-container');
      toastContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.style.setProperty('z-index', '100002', 'important');
          container.style.setProperty('position', 'fixed', 'important');
        }
      });
      
      const toasts = document.querySelectorAll('.Toastify__toast');
      toasts.forEach(toast => {
        if (toast instanceof HTMLElement) {
          toast.style.setProperty('z-index', '100002', 'important');
        }
      });
    };

    setToastZIndex();
    
    const timeouts = [
      setTimeout(setToastZIndex, 10),
      setTimeout(setToastZIndex, 50),
      setTimeout(setToastZIndex, 100),
      setTimeout(setToastZIndex, 200),
      setTimeout(setToastZIndex, 500),
    ];
    
    const observer = new MutationObserver(() => {
      setToastZIndex();
    });
    const body = document.body;
    observer.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      observer.disconnect();
    };
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const isActionDisabled = () => actionLock || actionLoading !== null;

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  // Client-side filter + pagination (similar to CustomerList)
  const filterAndPaginateTimeLogs = useCallback(() => {
    let filtered = [...allTimeLogs];

    // Search by customer name or email
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((log) => {
        const nameMatch = log.customer_name?.toLowerCase().includes(search);
        const emailMatch = log.customer_email?.toLowerCase().includes(search);
        return nameMatch || emailMatch;
      });
    }

    // Filter by action
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Filter by customer
    if (customerFilter) {
      filtered = filtered.filter(log => {
        if (log.customer_id == null) return false;
        return String(log.customer_id) === String(customerFilter);
      });
    }

    // Filter by date range (using logged_at)
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(log => {
        if (!log.logged_at) return false;
        const logDate = new Date(log.logged_at);
        // Compare by date only
        return logDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      // Include entire end day
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => {
        if (!log.logged_at) return false;
        const logDate = new Date(log.logged_at);
        return logDate <= toDate;
      });
    }

    // Calculate pagination
    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const current = Math.min(currentPage, lastPage);
    const start = (current - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);

    setTimeLogs(paginated);
    setPaginationMeta({
      current_page: current,
      last_page: lastPage,
      total,
      from: total > 0 ? start + 1 : 0,
      to: Math.min(end, total),
    });
  }, [allTimeLogs, searchTerm, actionFilter, customerFilter, dateFrom, dateTo, currentPage, itemsPerPage]);

  // Re-run client-side filtering whenever data or filters change
  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateTimeLogs();
    }
  }, [filterAndPaginateTimeLogs, initialLoading]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };


  const handleViewDetails = (timeLog) => {
    setSelectedTimeLog(timeLog);
    setShowDetailModal(true);
  };

  const EmptyState = () => (
    <div className="text-center py-5">
      <FaClock className="mb-3" style={{ fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.5 }} />
      <h5 className="text-muted mb-2">No time logs found</h5>
      <p className="text-muted small mb-3">
        {searchTerm || actionFilter || customerFilter || dateFrom || dateTo
          ? "Try adjusting your search or filter criteria"
          : "No customer login/logout activity has been recorded yet"}
      </p>
      {(searchTerm || actionFilter || customerFilter || dateFrom || dateTo) && (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            setSearchTerm("");
            setActionFilter("");
            setCustomerFilter("");
            setDateFrom("");
            setDateTo("");
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 admin-dashboard-container ${!loading ? 'fadeIn' : ''}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {loading ? (
        <LoadingSpinner text="Loading time logs data..." />
      ) : (
        <>
          {/* Page Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
        <div className="flex-grow-1 mb-2 mb-md-0">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: "var(--text-primary)" }}
          >
            <FaClock className="me-2" />
            Customer Time Logging
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            Track customer login and logout activity
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div
            className="badge px-3 py-2 text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            <i className="fas fa-clock me-2"></i>
            Total Logs: {loading ? '...' : stats.totalLogs}
          </div>
          <button
            className="btn btn-sm"
            onClick={() => {
              setCurrentPage(1);
              fetchTimeLogs(false);
            }}
            disabled={loading || isActionDisabled()}
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
              if (!e.target.disabled) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "var(--primary-color)";
              }
            }}
          >
            <i className="fas fa-sync-alt me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Logs", value: stats.totalLogs, icon: "fa-clock", color: "var(--primary-color)" },
          { label: "Login Logs", value: stats.loginLogs, icon: "fa-sign-in-alt", color: "#28a745" },
          { label: "Logout Logs", value: stats.logoutLogs, icon: "fa-sign-out-alt", color: "#dc3545" },
        ].map((stat, idx) => (
          <div className="col-6 col-md-4" key={idx}>
            <div 
              className="card stats-card h-100 shadow-sm"
              style={{ 
                border: '1px solid rgba(0, 0, 0, 0.125)',
                borderRadius: '0.375rem'
              }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div
                      className="text-xs fw-semibold text-uppercase mb-1"
                      style={{ color: stat.color }}
                    >
                      {stat.label}
                    </div>
                    <div
                      className="h4 mb-0 fw-bold"
                      style={{ color: stat.color }}
                    >
                      {initialLoading ? '...' : stat.value}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i
                      className={`fas ${stat.icon} fa-2x`}
                      style={{
                        color: stat.color,
                        opacity: 0.7,
                      }}
                    ></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-3"
        style={{ backgroundColor: "var(--background-white)" }}
      >
        <div className="card-body p-3">
          <div className="row g-2 align-items-start">
            <div className="col-md-3">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Search Customers
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
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
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
                    disabled={loading || isActionDisabled()}
                    style={{
                      color: "#6c757d",
                      backgroundColor: "transparent",
                      border: "none",
                      padding: "0.25rem 0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        const icon = e.target.querySelector("i");
                        if (icon) icon.style.color = "white";
                        e.target.style.color = "white";
                        e.target.style.backgroundColor = "#dc3545";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.target.disabled) {
                        const icon = e.target.querySelector("i");
                        if (icon) icon.style.color = "#6c757d";
                        e.target.style.color = "#6c757d";
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <i
                      className="fas fa-times"
                      style={{ color: "inherit" }}
                    ></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Filter by Action
              </label>
              <select
                className="form-select form-select-sm"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Filter by Customer
              </label>
              <select
                className="form-select form-select-sm"
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Date From
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              />
            </div>
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Date To
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              />
            </div>
            <div className="col-md-1">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
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
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Time Logs Table */}
      <div
        className="card border-0 shadow-sm"
        style={{ backgroundColor: "var(--background-white)" }}
      >
        <div
          className="card-header border-bottom-0 py-2"
          style={{
            background: "var(--topbar-bg)",
            color: "var(--topbar-text)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0 fw-semibold text-white">
              <i className="fas fa-clock me-2"></i>
              Time Logs
              {!loading && (
                <small className="opacity-75 ms-2 text-white">
                  ({paginationMeta.total} total)
                </small>
              )}
            </h5>
          </div>
        </div>
        <div className="card-body p-0">
          {timeLogs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="table table-striped table-hover mb-0" style={{ minWidth: '800px', tableLayout: 'fixed', width: '100%' }}>
                <thead style={{ backgroundColor: "var(--background-light)" }}>
                  <tr>
                    <th className="text-center small fw-semibold" style={{ width: "40px", minWidth: "40px" }}>#</th>
                    <th className="text-center small fw-semibold" style={{ width: "80px", minWidth: "80px" }}>Actions</th>
                    <th className="small fw-semibold" style={{ width: "120px", minWidth: "120px" }}>Customer</th>
                    <th className="small fw-semibold" style={{ width: "150px", minWidth: "150px" }}>Email</th>
                    <th className="text-center small fw-semibold" style={{ width: "80px", minWidth: "80px" }}>Action</th>
                    <th className="small fw-semibold" style={{ width: "160px", minWidth: "160px" }}>Date & Time</th>
                    <th className="text-center small fw-semibold" style={{ width: "120px", minWidth: "120px" }}>IP Address</th>
                    <th className="text-center small fw-semibold" style={{ width: "130px", minWidth: "130px" }}>User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {timeLogs.map((log, index) => (
                    <tr key={log.id} className="align-middle" style={{ height: '48px', whiteSpace: 'nowrap' }}>
                      <td
                        className="text-center fw-bold"
                        style={{ 
                          color: "var(--text-primary)",
                          width: "40px",
                          minWidth: "40px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td className="text-center" style={{ width: "80px", minWidth: "80px", whiteSpace: "nowrap" }}>
                        <div className="d-flex justify-content-center">
                          <button
                            className="btn btn-info btn-sm text-white"
                            onClick={() => handleViewDetails(log)}
                            disabled={isActionDisabled()}
                            title="View Details"
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
                            onMouseEnter={(e) => {
                              if (!e.target.disabled) {
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow =
                                  "0 4px 8px rgba(0,0,0,0.2)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!e.target.disabled) {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "none";
                              }
                            }}
                          >
                            <FaEye style={{ fontSize: "0.875rem" }} />
                          </button>
                        </div>
                      </td>
                      <td style={{ 
                        width: "120px",
                        minWidth: "120px",
                        overflow: "hidden",
                        whiteSpace: "nowrap"
                      }}>
                        <div
                          className="fw-medium"
                          style={{
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.875rem"
                          }}
                          title={log.customer_name}
                        >
                          {log.customer_name || 'N/A'}
                        </div>
                      </td>
                      <td style={{ 
                        width: "150px",
                        minWidth: "150px",
                        overflow: "hidden",
                        whiteSpace: "nowrap"
                      }}>
                        <div
                          className="small"
                          style={{
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.8rem"
                          }}
                          title={log.customer_email}
                        >
                          {log.customer_email || 'N/A'}
                        </div>
                      </td>
                      <td className="text-center" style={{ width: "80px", minWidth: "80px", whiteSpace: "nowrap" }}>
                        {log.action === 'login' ? (
                          <span className="badge bg-success" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}>
                            <FaSignInAlt className="me-1" style={{ fontSize: "0.7rem" }} />
                            Login
                          </span>
                        ) : (
                          <span className="badge bg-danger" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}>
                            <FaSignOutAlt className="me-1" style={{ fontSize: "0.7rem" }} />
                            Logout
                          </span>
                        )}
                      </td>
                      <td className="text-muted small" style={{ 
                        width: "160px",
                        minWidth: "160px",
                        overflow: "hidden",
                        whiteSpace: "nowrap"
                      }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.8rem"
                          }}
                          title={log.logged_at ? formatDateTime(log.logged_at) : 'N/A'}
                        >
                          {log.logged_at ? formatDateTime(log.logged_at) : 'N/A'}
                        </div>
                      </td>
                      <td className="text-center text-muted small" style={{ 
                        width: "120px",
                        minWidth: "120px",
                        overflow: "hidden",
                        whiteSpace: "nowrap"
                      }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.8rem"
                          }}
                          title={log.ip_address || 'N/A'}
                        >
                          {log.ip_address || 'N/A'}
                        </div>
                      </td>
                      <td className="text-center text-muted small" style={{ 
                        width: "130px",
                        minWidth: "130px",
                        overflow: "hidden",
                        whiteSpace: "nowrap"
                      }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.75rem"
                          }}
                          title={log.user_agent || 'N/A'}
                        >
                          {log.user_agent ? (log.user_agent.length > 25 ? log.user_agent.substring(0, 25) + '...' : log.user_agent) : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination - unified style (same as LandingPageSections) */}
        {!loading && timeLogs.length > 0 && (
          <div className="card-footer bg-white border-top px-3 py-2">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
              <div className="text-center text-md-start">
                <small style={{ color: "var(--text-muted)" }}>
                  Showing{" "}
                  <span
                    className="fw-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {paginationMeta.from || startIndex + 1}-
                    {paginationMeta.to ||
                      Math.min(
                        startIndex + timeLogs.length,
                        paginationMeta.total
                      )}
                  </span>{" "}
                  of{" "}
                  <span
                    className="fw-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {paginationMeta.total}
                  </span>{" "}
                  time logs
                </small>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={
                    paginationMeta.current_page === 1 ||
                    loading ||
                    isActionDisabled()
                  }
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

                <div className="d-none d-md-flex gap-1">
                  {(() => {
                    let pages = [];
                    const maxVisiblePages = 5;
                    const totalPages = paginationMeta.last_page;

                    if (totalPages <= maxVisiblePages) {
                      pages = Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                      );
                    } else {
                      pages.push(1);
                      let start = Math.max(2, paginationMeta.current_page - 1);
                      let end = Math.min(
                        totalPages - 1,
                        paginationMeta.current_page + 1
                      );

                      if (paginationMeta.current_page <= 2) {
                        end = 4;
                      } else if (
                        paginationMeta.current_page >=
                        totalPages - 1
                      ) {
                        start = totalPages - 3;
                      }

                      if (start > 2) {
                        pages.push("...");
                      }

                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      if (end < totalPages - 1) {
                        pages.push("...");
                      }

                      if (totalPages > 1) {
                        pages.push(totalPages);
                      }
                    }

                    return pages.map((page, index) => (
                      <button
                        key={index}
                        className="btn btn-sm"
                        onClick={() => page !== "..." && setCurrentPage(page)}
                        disabled={page === "..." || isActionDisabled()}
                        style={{
                          transition: "all 0.2s ease-in-out",
                          border: `2px solid ${
                            paginationMeta.current_page === page
                              ? "var(--primary-color)"
                              : "var(--input-border)"
                          }`,
                          color:
                            paginationMeta.current_page === page
                              ? "white"
                              : "var(--text-primary)",
                          backgroundColor:
                            paginationMeta.current_page === page
                              ? "var(--primary-color)"
                              : "transparent",
                          minWidth: "40px",
                        }}
                        onMouseEnter={(e) => {
                          if (
                            !e.target.disabled &&
                            paginationMeta.current_page !== page
                          ) {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow =
                              "0 2px 4px rgba(0,0,0,0.1)";
                            e.target.style.backgroundColor =
                              "var(--primary-light)";
                            e.target.style.color = "var(--text-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (
                            !e.target.disabled &&
                            paginationMeta.current_page !== page
                          ) {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "var(--text-primary)";
                          }
                        }}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>

                <div className="d-md-none">
                  <small style={{ color: "var(--text-muted)" }}>
                    Page {paginationMeta.current_page} of{" "}
                    {paginationMeta.last_page}
                  </small>
                </div>

                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, paginationMeta.last_page)
                    )
                  }
                  disabled={
                    paginationMeta.current_page === paginationMeta.last_page ||
                    loading ||
                    isActionDisabled()
                  }
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

      {/* Time Log Details Modal */}
      {selectedTimeLog && showDetailModal && (
        <TimeLogDetailsModal
          timeLog={selectedTimeLog}
          onClose={() => {
            setShowDetailModal(false);
            setTimeout(() => setSelectedTimeLog(null), 250);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};

export default TimeLogging;

