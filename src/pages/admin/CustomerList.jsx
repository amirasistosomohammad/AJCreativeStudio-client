import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { showAlert } from "../../services/notificationService";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaUserCheck, FaUserTimes, FaEye } from 'react-icons/fa';
import LoadingSpinner from '../../components/admin/LoadingSpinner';
import CustomerDetailsModal from './CustomerDetailsModal';

const CustomerList = () => {
  const { token } = useAuth();
  const [allCustomers, setAllCustomers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState('');
  const [signupMethodFilter, setSignupMethodFilter] = useState('');
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
    totalCustomers: 0,
    activeCustomers: 0,
    verifiedCustomers: 0,
    unverifiedCustomers: 0,
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Fetch all customers
  const fetchAllCustomers = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/customers?per_page=1000`, {
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

      if (data.success && data.customers) {
        setAllCustomers(data.customers);
      } else {
        setAllCustomers([]);
      }

      // Fetch stats separately
      await fetchStats();
    } catch (error) {
      console.error("Error fetching customers:", error);
      showAlert.error(
        "Customers Error",
        error.message || "Unable to load customers"
      );
      setAllCustomers([]);
      setStats({
        totalCustomers: 0,
        activeCustomers: 0,
        verifiedCustomers: 0,
        unverifiedCustomers: 0,
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, apiBaseUrl]);

  // Fetch customer statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/customers/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats({
            totalCustomers: data.stats.total || 0,
            activeCustomers: data.stats.active || 0,
            verifiedCustomers: data.stats.verified || 0,
            unverifiedCustomers: data.stats.unverified || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [token, apiBaseUrl]);

  // Filter and paginate customers client-side
  const filterAndPaginateCustomers = useCallback(() => {
    let filtered = [...allCustomers];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((customer) => {
        const nameMatch = customer.name?.toLowerCase().includes(search);
        const emailMatch = customer.email?.toLowerCase().includes(search);
        return nameMatch || emailMatch;
      });
    }

    // Apply status filter
    if (statusFilter) {
      if (statusFilter === 'active') {
        filtered = filtered.filter(c => c.is_active === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(c => c.is_active === false);
      } else if (statusFilter === 'verified') {
        filtered = filtered.filter(c => 
          c.register_status === 'verified' && c.is_active === true
        );
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(c => 
          c.register_status !== 'verified' || !c.is_active
        );
      }
    }

    // Apply signup method filter
    if (signupMethodFilter) {
      if (signupMethodFilter === 'google') {
        filtered = filtered.filter(c => c.signup_method === 'google');
      } else if (signupMethodFilter === 'email') {
        filtered = filtered.filter(c => c.signup_method === 'email');
      }
    }

    // Calculate pagination
    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    // Update displayed customers
    setCustomers(paginated);
    
    // Update pagination meta
    setPaginationMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });
  }, [allCustomers, searchTerm, statusFilter, signupMethodFilter, currentPage, itemsPerPage]);

  // Fetch all customers on mount
  useEffect(() => {
    fetchAllCustomers();
  }, [fetchAllCustomers]);

  // Filter and paginate when filters change
  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateCustomers();
    }
  }, [filterAndPaginateCustomers, initialLoading]);

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

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleSignupMethodFilterChange = (event) => {
    setSignupMethodFilter(event.target.value);
    setCurrentPage(1);
  };

  const isActionDisabled = () => actionLock || actionLoading !== null;

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const EmptyState = () => (
    <div className="text-center py-5">
      <FaUsers className="mb-3" style={{ fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.5 }} />
      <h5 className="text-muted mb-2">No customers found</h5>
      <p className="text-muted small mb-3">
        {searchTerm || statusFilter || signupMethodFilter
          ? "Try adjusting your search or filter criteria"
          : "No customers have registered yet"}
      </p>
      {(searchTerm || statusFilter || signupMethodFilter) && (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
            setSignupMethodFilter("");
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
        <LoadingSpinner text="Loading customers data..." />
      ) : (
        <>
          {/* Page Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
        <div className="flex-grow-1 mb-2 mb-md-0">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: "var(--text-primary)" }}
          >
            <FaUsers className="me-2" />
            Customer Management
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            View and manage all registered customers in your ecommerce system
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div
            className="badge px-3 py-2 text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            <i className="fas fa-users me-2"></i>
            Total Customers: {loading ? '...' : stats.totalCustomers}
          </div>
          <button
            className="btn btn-sm"
            onClick={fetchAllCustomers}
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
          { label: "Total Customers", value: stats.totalCustomers, icon: "fa-users", color: "var(--primary-color)" },
          { label: "Active Customers", value: stats.activeCustomers, icon: "fa-check-circle", color: "#28a745" },
          { label: "Verified Customers", value: stats.verifiedCustomers, icon: "fa-user-check", color: "#17a2b8" },
          { label: "Unverified Customers", value: stats.unverifiedCustomers, icon: "fa-user-times", color: "#ffc107" },
        ].map((stat, idx) => (
          <div className="col-6 col-md-3" key={idx}>
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
            <div className="col-md-3">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Filter by Status
              </label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="">All Customers</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div className="col-md-3">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Filter by Signup Method
              </label>
              <select
                className="form-select form-select-sm"
                value={signupMethodFilter}
                onChange={handleSignupMethodFilterChange}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="">All Methods</option>
                <option value="email">Email/Password</option>
                <option value="google">Google</option>
              </select>
            </div>
            <div className="col-md-3">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Items per page
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
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
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
              <i className="fas fa-users me-2"></i>
              Customer List
              {!loading && (
                <small className="opacity-75 ms-2 text-white">
                  ({paginationMeta.total} total)
                </small>
              )}
            </h5>
          </div>
        </div>
        <div className="card-body p-0">
          {customers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead style={{ backgroundColor: "var(--background-light)" }}>
                  <tr>
                    <th className="text-center small fw-semibold" style={{ width: "4%" }}>#</th>
                    <th className="text-center small fw-semibold" style={{ width: "80px", minWidth: "80px" }}>Actions</th>
                    <th className="small fw-semibold" style={{ width: "20%" }}>Name</th>
                    <th className="small fw-semibold" style={{ width: "20%" }}>Email</th>
                    <th className="text-center small fw-semibold" style={{ width: "10%" }}>Status</th>
                    <th className="text-center small fw-semibold" style={{ width: "10%" }}>Verified</th>
                    <th className="text-center small fw-semibold" style={{ width: "12%" }}>Signup Method</th>
                    <th className="text-center small fw-semibold" style={{ width: "14%" }}>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id} className="align-middle">
                      <td
                        className="text-center fw-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td className="text-center" style={{ width: "80px", minWidth: "80px", whiteSpace: "nowrap" }}>
                        <div className="d-flex justify-content-center">
                          <button
                            className="btn btn-info btn-sm text-white"
                            onClick={() => handleViewDetails(customer)}
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
                      <td style={{ maxWidth: "200px", overflow: "hidden" }}>
                        <div
                          className="fw-medium"
                          style={{
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={customer.name}
                        >
                          {customer.name}
                        </div>
                      </td>
                      <td style={{ maxWidth: "200px", overflow: "hidden" }}>
                        <div
                          className="small"
                          style={{
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={customer.email}
                        >
                          {customer.email}
                        </div>
                      </td>
                      <td className="text-center">
                        {customer.is_active ? (
                          <span className="badge bg-success">
                            <FaCheckCircle className="me-1" />
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            <FaTimesCircle className="me-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="text-center">
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
                      </td>
                      <td className="text-center">
                        {customer.signup_method === 'google' ? (
                          <span className="badge bg-danger" title="Signed up with Google">
                            <i className="fab fa-google me-1"></i>
                            Google
                          </span>
                        ) : (
                          <span className="badge bg-primary" title="Signed up with Email/Password">
                            <i className="fas fa-envelope me-1"></i>
                            Email
                          </span>
                        )}
                      </td>
                      <td className="text-center text-muted small">
                        {customer.created_at ? (
                          <div className="d-flex flex-column align-items-center">
                            <span className="text-nowrap">
                              {formatDate(customer.created_at)}
                            </span>
                            <span 
                              className="text-nowrap"
                              style={{ fontSize: "0.75rem", opacity: 0.8 }}
                            >
                              {new Date(customer.created_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </span>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination - unified style (same as LandingPageSections) */}
        {!loading && customers.length > 0 && (
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
                        startIndex + customers.length,
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
                  customers
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

      {/* Customer Details Modal */}
      {selectedCustomer && showDetailModal && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailModal(false);
            setTimeout(() => setSelectedCustomer(null), 250);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};

export default CustomerList;

