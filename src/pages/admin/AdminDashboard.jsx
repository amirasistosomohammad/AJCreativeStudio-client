// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaFileInvoice,
  FaChartBar,
  FaMoneyCheckAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaHistory,
  FaDownload,
  FaCog,
  FaBell,
  FaChartLine,
  FaDatabase,
  FaSyncAlt,
} from "react-icons/fa";

const formatNumber = (value = 0) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const formatCurrency = (value = 0) =>
  `₱${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminDashboard() {
  const { admin, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    failedOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    activeProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const fetchDashboardStats = async (isInitial = false) => {
    if (!token) return;
    if (isInitial) {
      setLoading(true);
    }
    try {
      // 1) Customers stats
      let totalCustomers = 0;
      try {
        const respCustomers = await fetch(`${apiBaseUrl}/customers/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (respCustomers.ok) {
          const dataCustomers = await respCustomers.json();
          if (dataCustomers.success && dataCustomers.stats) {
            totalCustomers = dataCustomers.stats.total || 0;
          }
        }
      } catch (err) {
        console.error("Failed to load customer stats:", err);
      }

      // 2) Orders list (admin can see all)
      let totalOrders = 0;
      let paidOrders = 0;
      let pendingOrders = 0;
      let failedOrders = 0;
      let totalRevenue = 0;
      let todayRevenue = 0;
      let monthRevenue = 0;
      let recentOrdersData = [];

      try {
        const params = new URLSearchParams();
        params.append("per_page", "1000");
        params.append("page", "1");
        const respOrders = await fetch(
          `${apiBaseUrl}/orders?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (respOrders.ok) {
          const dataOrders = await respOrders.json();
          const orders = Array.isArray(dataOrders.orders)
            ? dataOrders.orders
            : [];
          totalOrders = orders.length;
          const today = new Date();
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );

          orders.forEach((o) => {
            const paymentStatus = o.payment_status;
            const amount = Number(o.total_amount || 0);

            if (paymentStatus === "paid") {
              paidOrders += 1;
              totalRevenue += amount;

              if (o.created_at) {
                const created = new Date(o.created_at);
                if (created.toDateString() === today.toDateString()) {
                  todayRevenue += amount;
                }
                if (created >= startOfMonth && created <= today) {
                  monthRevenue += amount;
                }
              }
            } else if (paymentStatus === "pending") {
              pendingOrders += 1;
            } else if (paymentStatus === "failed") {
              failedOrders += 1;
            }
          });

          recentOrdersData = orders
            .slice()
            .sort(
              (a, b) =>
                new Date(b.created_at || 0) - new Date(a.created_at || 0)
            )
            .slice(0, 5);
        }
      } catch (err) {
        console.error("Failed to load orders for dashboard:", err);
      }

      // 3) Products list (for activeProducts)
      let activeProducts = 0;
      try {
        const respProducts = await fetch(`${apiBaseUrl}/products?per_page=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (respProducts.ok) {
          const dataProducts = await respProducts.json();
          let products = [];
          if (Array.isArray(dataProducts.products)) {
            products = dataProducts.products;
          } else if (
            dataProducts.success &&
            Array.isArray(dataProducts.products)
          ) {
            products = dataProducts.products;
          }
          activeProducts = products.filter((p) => p.is_active).length;
        }
      } catch (err) {
        console.error("Failed to load products for dashboard:", err);
      }

      setStats({
        totalCustomers,
        totalOrders,
        paidOrders,
        pendingOrders,
        failedOrders,
        totalRevenue,
        todayRevenue,
        monthRevenue,
        activeProducts,
      });
      setRecentOrders(recentOrdersData);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiBaseUrl]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats(false);
  };

  const handleQuickAction = (path) => {
    if (!path) return;
    navigate(path);
  };

  if (loading) {
    return (
      <div className="container-fluid px-3 py-2 admin-dashboard-container fadeIn">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: "var(--primary-color)" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 pt-0 pb-2 admin-dashboard-container fadeIn">
      {/* Page Header */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 gap-3">
        <div className="text-start w-100">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Admin Dashboard
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            {admin?.username
              ? `Welcome back, ${admin.username.split("@")[0]}! `
              : "Welcome back! "}
            Here's your system overview.
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-lg-auto justify-content-start justify-content-lg-end flex-wrap">
          <button
            className="btn btn-sm d-flex align-items-center"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              transition: "all 0.2s ease-in-out",
              border: "2px solid var(--primary-color)",
              color: "var(--primary-color)",
              backgroundColor: "transparent",
            }}
          >
            {refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Refreshing
              </>
            ) : (
              <>
                <FaSyncAlt className="me-2" />
                Refresh Data
              </>
            )}
          </button>
          <button
            className="btn btn-sm btn-success text-white d-flex align-items-center"
            style={{ transition: "all 0.2s ease-in-out", borderWidth: "2px" }}
          >
            <FaDownload className="me-2" />
            Export Report
          </button>
          <button
            className="btn btn-sm d-flex align-items-center"
            style={{
              transition: "all 0.2s ease-in-out",
              border: "2px solid var(--input-border)",
              color: "var(--text-primary)",
              backgroundColor: "transparent",
            }}
          >
            <FaCog className="me-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Stats Overview */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <div
            className="card bg-primary text-white mb-3"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Total Customers</div>
                  <div className="h4 fw-bold my-1">
                    {formatNumber(stats.totalCustomers)}
                  </div>
                  <div className="small d-flex align-items-center">
                    <FaChartLine className="me-1" />
                    Tracking
                  </div>
                </div>
                <div
                  className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "50px", height: "50px" }}
                >
                  <FaUsers size={20} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div
            className="card bg-warning text-white mb-3"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Pending Orders</div>
                  <div className="h4 fw-bold my-1">
                    {formatNumber(stats.pendingOrders)}
                  </div>
                  <div className="small">
                    {stats.pendingOrders > 0
                      ? "Requires attention"
                      : "Up to date"}
                  </div>
                </div>
                <div
                  className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "50px", height: "50px" }}
                >
                  <FaClock size={20} className="text-warning" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div
            className="card bg-success text-white mb-3"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Monthly Revenue (Paid)</div>
                  <div className="h4 fw-bold my-1">
                    {formatCurrency(stats.monthRevenue)}
                  </div>
                  <div className="small d-flex align-items-center">
                    <FaChartLine className="me-1" />
                    This month
                  </div>
                </div>
                <div
                  className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "50px", height: "50px" }}
                >
                  <FaMoneyCheckAlt size={20} className="text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div
            className="card bg-danger text-white mb-3"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Failed Orders</div>
                  <div className="h4 fw-bold my-1">
                    {formatNumber(stats.failedOrders)}
                  </div>
                  <div className="small">
                    {stats.failedOrders > 0
                      ? "Check payment issues"
                      : "All good"}
                  </div>
                </div>
                <div
                  className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "50px", height: "50px" }}
                >
                  <FaExclamationTriangle size={20} className="text-danger" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="row g-3 mb-4">
        <div className="col-xl-8">
          <div className="row g-3">
            <div className="col-md-3 col-6">
              <div
                className="card border-0 bg-light h-100"
                style={{ borderRadius: "10px" }}
              >
                <div className="card-body text-center p-3">
                  <FaUsers className="text-primary mb-2" size={24} />
                  <div className="fw-bold text-dark h5">
                    {formatNumber(stats.totalOrders)}
                  </div>
                  <div className="text-muted small">Total Orders</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div
                className="card border-0 bg-light h-100"
                style={{ borderRadius: "10px" }}
              >
                <div className="card-body text-center p-3">
                  <FaChartBar className="text-primary mb-2" size={24} />
                  <div className="fw-bold text-dark h5">
                    {formatNumber(stats.activeProducts)}
                  </div>
                  <div className="text-muted small">Active Products</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div
                className="card border-0 bg-light h-100"
                style={{ borderRadius: "10px" }}
              >
                <div className="card-body text-center p-3">
                  <FaUsers className="text-primary mb-2" size={24} />
                  <div className="fw-bold text-dark h5">
                    {formatCurrency(stats.todayRevenue)}
                  </div>
                  <div className="text-muted small">Today Revenue</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div
                className="card border-0 bg-light h-100"
                style={{ borderRadius: "10px" }}
              >
                <div className="card-body text-center p-3">
                  <FaDatabase className="text-primary mb-2" size={24} />
                  <div className="fw-bold text-dark h5">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <div className="text-muted small">All-time Paid Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div
            className="card bg-primary text-white h-100"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="small opacity-85 text-uppercase">
                  System Status
                </div>
                <div className="h5 mb-0">All systems operational</div>
              </div>
              <FaCheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="row g-4">
        {/* Recent Orders */}
        <div className="col-xl-8">
          <div className="card mb-4" style={{ borderRadius: "10px" }}>
            <div className="card-header bg-white border-bottom-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 text-dark d-flex align-items-center">
                  <FaHistory className="me-2 text-primary" />
                  Recent Orders
                </h5>
                <span className="badge bg-primary">
                  {recentOrders.length}
                </span>
              </div>
            </div>
            <div className="card-body p-0">
              {recentOrders.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No recent orders.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="small fw-semibold text-muted">Order</th>
                        <th className="small fw-semibold text-muted">
                          Customer
                        </th>
                        <th className="small fw-semibold text-muted text-end">
                          Total
                        </th>
                        <th className="small fw-semibold text-muted">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <div className="fw-semibold text-dark">
                              {order.order_number || `Order #${order.id}`}
                            </div>
                            <div className="small text-muted">
                              {formatDateTime(order.created_at)}
                            </div>
                          </td>
                          <td>
                            <div className="small text-dark">
                              {order.customer?.name ||
                                order.guest_name ||
                                "Guest Customer"}
                            </div>
                            <div className="small text-muted">
                              {order.customer?.email || order.guest_email || ""}
                            </div>
                          </td>
                          <td className="text-end small fw-semibold">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="col-xl-4">
          {/* Priority Tasks */}
          <div className="card mb-4" style={{ borderRadius: "10px" }}>
            <div className="card-header bg-white border-bottom-0 py-3">
              <h5 className="card-title mb-0 text-dark d-flex align-items-center">
                <FaBell className="me-2 text-warning" />
                Priority Tasks
              </h5>
            </div>
            <div className="card-body">
              <div className="text-muted small">No outstanding tasks.</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ borderRadius: "10px" }}>
            <div className="card-header bg-white border-bottom-0 py-3">
              <h5 className="card-title mb-0 text-dark">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-sm text-start py-2 d-flex align-items-center admin-quick-action-btn"
                  type="button"
                  onClick={() => handleQuickAction("/admin/customers")}
                  style={{
                    borderRadius: "8px",
                    border: "2px solid var(--primary-color)",
                    color: "var(--primary-color)",
                  }}
                >
                  <FaUsers className="me-2" />
                  Manage Customers
                </button>
                <button
                  className="btn btn-sm text-start py-2 d-flex align-items-center admin-quick-action-btn"
                  type="button"
                  onClick={() => handleQuickAction("/admin/orders")}
                  style={{
                    borderRadius: "8px",
                    border: "2px solid var(--primary-color)",
                    color: "var(--primary-color)",
                  }}
                >
                  <FaFileInvoice className="me-2" />
                  View Orders
                </button>
                <button
                  className="btn btn-sm text-start py-2 d-flex align-items-center admin-quick-action-btn"
                  type="button"
                  onClick={() => handleQuickAction("/admin/products/reviews")}
                  style={{
                    borderRadius: "8px",
                    border: "2px solid var(--primary-color)",
                    color: "var(--primary-color)",
                  }}
                >
                  <FaChartBar className="me-2" />
                  Product Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

