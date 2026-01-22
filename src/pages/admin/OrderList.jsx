import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaFileInvoice,
  FaSearch,
  FaSyncAlt,
  FaMoneyCheckAlt,
  FaFilter,
  FaEye,
} from "react-icons/fa";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import OrderDetailsModal from "./OrderDetailsModal";

const OrderList = () => {
  const { token } = useAuth();

  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLock, setActionLock] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const isActionDisabled = () => actionLock || actionLoading !== null;

  const formatCurrency = (value = 0) =>
    `₱${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  // Fetch all orders once (admin can see all), then filter client-side
  const fetchOrders = useCallback(async (isInitial = false) => {
    if (!token) return;
    setLoading(true);
    if (isInitial) setInitialLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("per_page", "1000");
      params.append("page", "1");

      const response = await fetch(`${apiBaseUrl}/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        console.error("Failed to parse orders JSON:", err);
        const text = await response.text();
        console.error("Orders response text:", text);
        throw new Error(
          `Invalid response from server: ${response.status} ${response.statusText}`
        );
      }

      if (!response.ok) {
        console.error("Orders API error:", data);
        const message =
          data.message || data.error || "Failed to load orders from server";
        throw new Error(message);
      }

      const fetchedOrders = Array.isArray(data.orders) ? data.orders : [];
      setAllOrders(fetchedOrders);

      // compute stats
      const totalOrders = fetchedOrders.length;
      const paidOrders = fetchedOrders.filter(
        (o) => o.payment_status === "paid"
      ).length;
      const pendingOrders = fetchedOrders.filter(
        (o) => o.payment_status === "pending"
      ).length;
      const totalRevenue = fetchedOrders
        .filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      setStats({
        totalOrders,
        paidOrders,
        pendingOrders,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(error.message || "Unable to load orders");
      setAllOrders([]);
      setStats({
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
      });
    } finally {
      setLoading(false);
      if (isInitial) setInitialLoading(false);
    }
  }, [apiBaseUrl, token]);

  // Initial fetch
  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Client-side filter + pagination
  const filterAndPaginateOrders = useCallback(() => {
    let filtered = [...allOrders];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const orderMatch =
          order.order_number?.toLowerCase().includes(search) ||
          String(order.id).includes(search);
        const nameMatch = order.customer?.name
          ?.toLowerCase()
          .includes(search);
        const emailMatch =
          order.customer?.email?.toLowerCase().includes(search) ||
          order.guest_email?.toLowerCase().includes(search);
        return orderMatch || nameMatch || emailMatch;
      });
    }

    if (paymentStatusFilter) {
      filtered = filtered.filter(
        (order) => order.payment_status === paymentStatusFilter
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((order) => {
        if (!order.created_at) return false;
        const created = new Date(order.created_at);
        return created >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => {
        if (!order.created_at) return false;
        const created = new Date(order.created_at);
        return created <= toDate;
      });
    }

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const current = Math.min(currentPage, lastPage);
    const start = (current - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);

    setOrders(paginated);
    setPaginationMeta({
      current_page: current,
      last_page: lastPage,
      total,
      from: total > 0 ? start + 1 : 0,
      to: Math.min(end, total),
    });
  }, [
    allOrders,
    searchTerm,
    paymentStatusFilter,
    dateFrom,
    dateTo,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateOrders();
    }
  }, [filterAndPaginateOrders, initialLoading]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePaymentStatusFilterChange = (e) => {
    setPaymentStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value);
    setCurrentPage(1);
  };

  const handleDateToChange = (e) => {
    setDateTo(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleRefresh = async () => {
    if (isActionDisabled()) return;
    await fetchOrders(false);
    filterAndPaginateOrders();
    toast.info("Orders refreshed");
  };

  const handleExportCsv = () => {
    if (!allOrders.length) {
      toast.warn("No orders to export");
      return;
    }

    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Status",
      "Payment Status",
      "Total Amount",
      "Created At",
    ];

    const rows = allOrders.map((o) => [
      o.order_number || `ORDER-${o.id}`,
      o.customer?.name || o.guest_name || "",
      o.customer?.email || o.guest_email || "",
      o.status || "",
      o.payment_status || "",
      o.total_amount || 0,
      formatDateTime(o.created_at),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((field) =>
              `"${String(field ?? "")
                .replace(/"/g, '""')
                .replace(/\n/g, " ")}"`
            )
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `orders_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const EmptyState = () => (
    <div className="text-center py-5">
      <FaFileInvoice
        className="mb-3"
        style={{
          fontSize: "3rem",
          color: "var(--text-muted)",
          opacity: 0.5,
        }}
      />
      <h5 className="text-muted mb-2">No orders found</h5>
      <p className="text-muted small mb-0">
        {searchTerm ||
        paymentStatusFilter ||
        dateFrom ||
        dateTo
          ? "Try adjusting your search or filter criteria"
          : "No orders have been placed yet"}
      </p>
    </div>
  );

  if (loading && initialLoading) {
    return (
      <div className="container-fluid px-3 pt-0 pb-2 admin-dashboard-container">
        <LoadingSpinner text="Loading orders data..." />
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 pt-0 pb-2 admin-dashboard-container fadeIn">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
        <div className="flex-grow-1 mb-2 mb-md-0">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: "var(--text-primary)" }}
          >
            <FaFileInvoice className="me-2" />
            Orders &amp; Sales
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            View and manage all customer orders
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div
            className="badge px-3 py-2 text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            <i className="fas fa-file-invoice me-2"></i>
            Total Orders: {initialLoading ? "..." : stats.totalOrders}
          </div>
          <button
            className="btn btn-sm"
            onClick={handleRefresh}
            disabled={loading || isActionDisabled()}
            style={{
              transition: "all 0.2s ease-in-out",
              border: "2px solid var(--primary-color)",
              color: "var(--primary-color)",
              backgroundColor: "transparent",
            }}
          >
            <FaSyncAlt className="me-1" />
            Refresh
          </button>
          <button
            className="btn btn-sm btn-success text-white"
            onClick={handleExportCsv}
            disabled={loading || !allOrders.length}
          >
            <FaMoneyCheckAlt className="me-1" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="card stats-card h-100 shadow-sm"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.125)",
              borderRadius: "0.375rem",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div
                    className="text-xs fw-semibold text-uppercase mb-1"
                    style={{ color: "var(--primary-color)" }}
                  >
                    Total Orders
                  </div>
                  <div
                    className="h4 mb-0 fw-bold"
                    style={{ color: "var(--primary-color)" }}
                  >
                    {initialLoading ? "..." : stats.totalOrders}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="fas fa-file-invoice fa-2x"
                    style={{
                      color: "var(--primary-light)",
                      opacity: 0.7,
                    }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card stats-card h-100 shadow-sm"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.125)",
              borderRadius: "0.375rem",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div
                    className="text-xs fw-semibold text-uppercase mb-1"
                    style={{ color: "#28a745" }}
                  >
                    Paid Orders
                  </div>
                  <div
                    className="h4 mb-0 fw-bold"
                    style={{ color: "#28a745" }}
                  >
                    {initialLoading ? "..." : stats.paidOrders}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="fas fa-check-circle fa-2x"
                    style={{ color: "#28a745", opacity: 0.7 }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card stats-card h-100 shadow-sm"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.125)",
              borderRadius: "0.375rem",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div
                    className="text-xs fw-semibold text-uppercase mb-1"
                    style={{ color: "#ffc107" }}
                  >
                    Pending
                  </div>
                  <div
                    className="h4 mb-0 fw-bold"
                    style={{ color: "#ffc107" }}
                  >
                    {initialLoading ? "..." : stats.pendingOrders}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="fas fa-clock fa-2x"
                    style={{ color: "#ffc107", opacity: 0.7 }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card stats-card h-100 shadow-sm"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.125)",
              borderRadius: "0.375rem",
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div
                    className="text-xs fw-semibold text-uppercase mb-1"
                    style={{ color: "var(--accent-color)" }}
                  >
                    Paid Revenue
                  </div>
                  <div
                    className="h5 mb-0 fw-bold"
                    style={{ color: "var(--accent-color)" }}
                  >
                    {initialLoading ? "..." : formatCurrency(stats.totalRevenue)}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="fas fa-money-check-alt fa-2x"
                    style={{
                      color: "var(--accent-light)",
                      opacity: 0.7,
                    }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-3"
        style={{ backgroundColor: "var(--background-white)" }}
      >
        <div className="card-body p-3">
          <div className="row g-2 align-items-start">
            <div className="col-md-4">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Search Orders
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
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by order #, customer name or email..."
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
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Payment
              </label>
              <select
                className="form-select form-select-sm"
                value={paymentStatusFilter}
                onChange={handlePaymentStatusFilterChange}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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
                onChange={handleDateFromChange}
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
                onChange={handleDateToChange}
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
                Items per page
              </label>
              <select
                className="form-select form-select-sm"
                value={itemsPerPage}
                onChange={handlePerPageChange}
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

      {/* Orders Table */}
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
              <i className="fas fa-file-invoice me-2"></i>
              Orders
              {!loading && (
                <small className="opacity-75 ms-2 text-white">
                  ({paginationMeta.total} total)
                </small>
              )}
            </h5>
          </div>
        </div>
        <div className="card-body p-0">
          {orders.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0 orders-admin-table">
                <thead
                  style={{ backgroundColor: "var(--background-light)" }}
                >
                  <tr>
                    <th className="text-center small fw-semibold" style={{ width: "4%" }}>
                      #
                    </th>
                    <th
                      className="text-center small fw-semibold"
                      style={{ width: "80px", minWidth: "80px" }}
                    >
                      Actions
                    </th>
                    <th className="small fw-semibold" style={{ width: "22%" }}>
                      Order
                    </th>
                    <th className="small fw-semibold" style={{ width: "26%" }}>
                      Customer
                    </th>
                    <th className="text-center small fw-semibold" style={{ width: "12%" }}>
                      Payment
                    </th>
                    <th className="text-end small fw-semibold" style={{ width: "12%" }}>
                      Total
                    </th>
                    <th className="small fw-semibold" style={{ width: "16%" }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.id} className="align-middle">
                      <td
                        className="text-center fw-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {paginationMeta.from + index}
                      </td>
                      <td
                        className="text-center"
                        style={{
                          width: "80px",
                          minWidth: "80px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div className="d-flex justify-content-center">
                          <button
                            className="btn btn-info btn-sm text-white"
                            onClick={() => handleViewDetails(order)}
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
                      <td style={{ maxWidth: "260px", overflow: "hidden" }}>
                        <div
                          className="fw-medium"
                          style={{
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={
                            order.order_number ||
                            `Order #${order.id}`
                          }
                        >
                          {order.order_number || `Order #${order.id}`}
                        </div>
                      </td>
                      <td style={{ maxWidth: "260px", overflow: "hidden" }}>
                        <div
                          className="fw-medium"
                          style={{
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={
                            order.customer?.name ||
                            order.guest_name ||
                            "Guest Customer"
                          }
                        >
                          {order.customer?.name ||
                            order.guest_name ||
                            "Guest Customer"}
                        </div>
                        <div
                          className="small text-muted"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={
                            order.customer?.email ||
                            order.guest_email ||
                            ""
                          }
                        >
                          {order.customer?.email || order.guest_email || ""}
                        </div>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            order.payment_status === "paid"
                              ? "bg-success"
                              : order.payment_status === "failed"
                              ? "bg-danger"
                              : order.payment_status === "pending"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                          }`}
                        >
                          {order.payment_status || "N/A"}
                        </span>
                      </td>
                      <td className="text-end fw-semibold">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="small text-muted">
                        {formatDateTime(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination - unified style (same as LandingPageSections) */}
        {!loading && orders.length > 0 && (
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
                        startIndex + orders.length,
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
                  orders
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

      {/* Order Details Modal */}
      {selectedOrder && showDetailModal && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setTimeout(() => setSelectedOrder(null), 250);
          }}
        />
      )}

      {/* Mobile-specific table row styling to reduce row height */}
      <style>{`
        @media (max-width: 768px) {
          .orders-admin-table > :not(caption) > * > * {
            padding-top: 0.35rem;
            padding-bottom: 0.35rem;
          }

          .orders-admin-table th,
          .orders-admin-table td {
            font-size: 0.8rem;
            line-height: 1.2;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            vertical-align: middle;
          }

          .orders-admin-table td:nth-child(3),
          .orders-admin-table td:nth-child(4),
          .orders-admin-table td:nth-child(7) {
            max-width: 160px;
          }
        }

        @media (max-width: 480px) {
          .orders-admin-table th,
          .orders-admin-table td {
            font-size: 0.75rem;
          }

          .orders-admin-table td:nth-child(3),
          .orders-admin-table td:nth-child(4),
          .orders-admin-table td:nth-child(7) {
            max-width: 140px;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderList;


