import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Portal from "../../components/Portal";
import { useAuth } from "../../contexts/AuthContext";
import { showAlert } from "../../services/notificationService";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { FaTags } from 'react-icons/fa';
import LoadingSpinner from '../../components/admin/LoadingSpinner';

const DEFAULT_CATEGORY_FORM = {
  name: "",
  description: "",
};

const ProductCategories = () => {
  const { token } = useAuth();
  const [allCategories, setAllCategories] = useState([]); // Store all categories
  const [categories, setCategories] = useState([]); // Displayed categories (filtered + paginated)
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
    totalCategories: 0,
    totalItems: 0,
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Fetch all categories once on initial load
  const fetchAllCategories = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    try {
      // Fetch all categories with a large per_page to get everything
      const response = await fetch(`${apiBaseUrl}/product-categories?per_page=1000`, {
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

      if (data.success && data.categories) {
        setAllCategories(data.categories);
        
        // Calculate stats from all categories
        const totalItems = data.categories.reduce((sum, cat) => sum + (cat.items_count || 0), 0);
        setStats({
          totalCategories: data.pagination?.total || data.categories.length || 0,
          totalItems: totalItems,
        });
      } else {
        setAllCategories([]);
        setStats({
          totalCategories: 0,
          totalItems: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showAlert.error(
        "Categories Error",
        error.message || "Unable to load product categories"
      );
      setAllCategories([]);
      setStats({
        totalCategories: 0,
        totalItems: 0,
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, apiBaseUrl]);

  // Filter and paginate categories client-side
  const filterAndPaginateCategories = useCallback(() => {
    let filtered = [...allCategories];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((category) => {
        const nameMatch = category.name?.toLowerCase().includes(search);
        const descMatch = category.description?.toLowerCase().includes(search);
        return nameMatch || descMatch;
      });
    }

    // Calculate pagination
    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    // Update displayed categories
    setCategories(paginated);
    
    // Update pagination meta
    setPaginationMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });
  }, [allCategories, searchTerm, currentPage, itemsPerPage]);

  // Fetch all categories on mount
  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  // Filter and paginate when search term, page, or items per page changes
  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateCategories();
    }
  }, [filterAndPaginateCategories, initialLoading]);

  // Ensure toast container has highest z-index above modals - AGGRESSIVE
  useEffect(() => {
    const setToastZIndex = () => {
      // Find all toast containers (react-toastify creates them dynamically)
      const toastContainers = document.querySelectorAll('.Toastify__toast-container');
      toastContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.style.setProperty('z-index', '100002', 'important');
          container.style.setProperty('position', 'fixed', 'important');
          // Also set for any child elements
          const childElements = container.querySelectorAll('*');
          childElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.setProperty('z-index', '100002', 'important');
            }
          });
        }
      });
      
      // Also set for individual toasts - ESPECIALLY ERROR TOASTS
      const toasts = document.querySelectorAll('.Toastify__toast');
      toasts.forEach(toast => {
        if (toast instanceof HTMLElement) {
          toast.style.setProperty('z-index', '100002', 'important');
          // Extra emphasis on error toasts
          if (toast.classList.contains('Toastify__toast--error')) {
            toast.style.setProperty('z-index', '100002', 'important');
            toast.style.setProperty('position', 'relative', 'important');
          }
        }
      });
    };

    // Set immediately
    setToastZIndex();
    
    // Set multiple times to catch dynamically created elements
    const timeouts = [
      setTimeout(setToastZIndex, 10),
      setTimeout(setToastZIndex, 50),
      setTimeout(setToastZIndex, 100),
      setTimeout(setToastZIndex, 200),
      setTimeout(setToastZIndex, 500),
    ];
    
    // Watch for changes - more aggressive
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
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowFormModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowFormModal(true);
  };

  const handleDeleteCategory = async (category) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes", {
        style: { zIndex: 100002 }
      });
      return;
    }

    const confirmation = await showAlert.confirm(
      "Delete Category",
      `Deleting "${category.name}" will remove it from the combobox. Continue?`,
      "Delete",
      "Cancel"
    );

    if (!confirmation.isConfirmed) return;

    setActionLock(true);
    setActionLoading(category.id);
    showAlert.processing("Deleting Category", "Removing category...");

    try {
      const response = await fetch(`${apiBaseUrl}/product-categories/${category.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete category");
      }

      showAlert.close();
      toast.success("Category deleted successfully!", {
        style: { zIndex: 100002 }
      });
      // Remove from allCategories and update stats
      setAllCategories(prev => {
        const updatedCategories = prev.filter(cat => cat.id !== category.id);
        
        // Recalculate stats from updated categories
        const totalItems = updatedCategories.reduce((sum, cat) => sum + (cat.items_count || 0), 0);
        setStats({
          totalCategories: updatedCategories.length,
          totalItems: totalItems,
        });
        
        return updatedCategories;
      });
    } catch (error) {
      console.error("Delete category error:", error);
      showAlert.close();
      // Force z-index before showing error toast
      requestAnimationFrame(() => {
        const containers = document.querySelectorAll('.Toastify__toast-container');
        containers.forEach(container => {
          if (container instanceof HTMLElement) {
            const existingStyle = container.getAttribute('style') || '';
            container.style.cssText = existingStyle + 'z-index: 100002 !important; position: fixed !important;';
          }
        });
        
        toast.error(error.message || "Unable to delete category", {
          style: { zIndex: 100002 }
        });
        
        // Force again after toast is created
        requestAnimationFrame(() => {
          const containers = document.querySelectorAll('.Toastify__toast-container');
          containers.forEach(container => {
            if (container instanceof HTMLElement) {
              const existingStyle = container.getAttribute('style') || '';
              container.style.cssText = existingStyle + 'z-index: 100002 !important; position: fixed !important;';
            }
          });
          const toasts = document.querySelectorAll('.Toastify__toast--error');
          toasts.forEach(toastEl => {
            if (toastEl instanceof HTMLElement) {
              const toastStyle = toastEl.getAttribute('style') || '';
              toastEl.style.cssText = toastStyle + 'z-index: 100002 !important; position: relative !important;';
            }
          });
        });
      });
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  const isActionDisabled = (id = null) =>
    actionLock || (actionLoading && actionLoading !== id);

  const handleSaveCategory = () => {
    setShowFormModal(false);
    setEditingCategory(null);
    // Refresh all categories after save
    fetchAllCategories();
  };

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 inventory-categories-container ${!loading ? 'fadeIn' : ''}`}>
      {loading ? (
        <LoadingSpinner text="Loading categories data..." />
      ) : (
        <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
        <div className="flex-grow-1 mb-2 mb-md-0">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: "var(--text-primary)" }}
          >
            <FaTags className="me-2" />
            Product Categories
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            Organize and manage your product categories for better inventory control.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-primary text-white"
            onClick={handleAddCategory}
            disabled={isActionDisabled()}
            style={{
              transition: "all 0.2s ease-in-out",
              borderWidth: "2px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            <i className="fas fa-plus me-1" />
            Add Category
          </button>
          <button
            className="btn btn-sm"
            onClick={fetchAllCategories}
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
        {[stats.totalCategories, stats.totalItems].map((value, idx) => (
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
                      style={{
                        color:
                          idx === 0
                            ? "var(--primary-color)"
                            : "var(--accent-color)",
                      }}
                    >
                      {idx === 0 ? "Total Categories" : "Items Tagged"}
                    </div>
                    <div
                      className="h4 mb-0 fw-bold"
                      style={{
                        color:
                          idx === 0
                            ? "var(--primary-color)"
                            : "var(--accent-color)",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i
                      className={`fas ${
                        idx === 0 ? "fa-layer-group" : "fa-boxes-stacked"
                      } fa-2x`}
                      style={{
                        color:
                          idx === 0
                            ? "var(--primary-light)"
                            : "var(--accent-light)",
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

      <div
        className="card border-0 shadow-sm mb-3"
        style={{ backgroundColor: "var(--background-white)" }}
      >
        <div className="card-body p-3">
          <div className="row g-2 align-items-start">
            <div className="col-md-6">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Search Categories
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
                  placeholder="Search by name or description..."
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
            <div className="col-md-6">
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
              <i className="fas fa-tags me-2"></i>
              Category Catalog
              {!loading && (
                <small className="opacity-75 ms-2 text-white">
                  ({paginationMeta.total} total)
                </small>
              )}
            </h5>
          </div>
        </div>
        <div className="card-body p-0">
          {categories.length === 0 ? (
            <EmptyState
              onAddCategory={handleAddCategory}
              isActionDisabled={isActionDisabled}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead style={{ backgroundColor: "var(--background-light)" }}>
                  <tr>
                    <th
                      className="text-center small fw-semibold"
                      style={{ width: "4%" }}
                    >
                      #
                    </th>
                    <th
                      className="text-center small fw-semibold"
                      style={{ width: "10%" }}
                    >
                      Actions
                    </th>
                    <th className="small fw-semibold" style={{ width: "30%" }}>
                      Category
                    </th>
                    <th className="small fw-semibold">Description</th>
                    <th
                      className="small fw-semibold text-center"
                      style={{ width: "14%" }}
                    >
                      Items Tagged
                    </th>
                    <th
                      className="small fw-semibold text-center"
                      style={{ width: "14%" }}
                    >
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={category.id} className="align-middle">
                      <td
                        className="text-center fw-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-success btn-sm text-white"
                            onClick={() => handleEditCategory(category)}
                            disabled={isActionDisabled(category.id)}
                            title="Edit category"
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
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "none";
                            }}
                          >
                            {actionLoading === category.id ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                            ) : (
                              <i
                                className="fas fa-edit"
                                style={{ fontSize: "0.875rem" }}
                              ></i>
                            )}
                          </button>
                          <button
                            className="btn btn-danger btn-sm text-white"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={isActionDisabled(category.id)}
                            title="Delete category"
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
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "none";
                            }}
                          >
                            {actionLoading === category.id ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                            ) : (
                              <i
                                className="fas fa-trash"
                                style={{ fontSize: "0.875rem" }}
                              ></i>
                            )}
                          </button>
                        </div>
                      </td>
                      <td style={{ maxWidth: "250px", overflow: "hidden" }}>
                        <div
                          className="fw-medium"
                          style={{
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={category.name}
                        >
                          {category.name}
                        </div>
                      </td>
                      <td style={{ maxWidth: "300px", overflow: "hidden" }}>
                        <div
                          className="small"
                          style={{
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={
                            category.description || "No description provided"
                          }
                        >
                          {category.description || "No description provided"}
                        </div>
                      </td>
                      <td
                        className="text-center fw-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {category.items_count ?? 0}
                      </td>
                      <td className="text-center text-muted small">
                        {category.created_at ? (
                          <div className="d-flex flex-row align-items-center justify-content-center gap-1" style={{ whiteSpace: "nowrap" }}>
                            <span className="text-nowrap">
                              {new Date(category.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            <span 
                              className="text-nowrap"
                              style={{ fontSize: "0.75rem", opacity: 0.8 }}
                            >
                              {new Date(category.created_at).toLocaleTimeString(
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
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!loading && categories.length > 0 && (
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
                        startIndex + categories.length,
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
                  categories
                </small>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={
                    paginationMeta.current_page === 1 || isActionDisabled()
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
                              "var(--primary-color)";
                            e.target.style.color = "white";
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

      {showFormModal && (
        <CategoryFormModal
          token={token}
          category={editingCategory}
          onClose={() => {
            setShowFormModal(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          saving={savingCategory}
          setSaving={setSavingCategory}
        />
      )}

      {/* Toast Container - Render via Portal to ensure it's outside modal stacking context */}
      <Portal>
        <div style={{ zIndex: 100002, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Portal>
        </>
      )}
    </div>
  );
};

const EmptyState = ({ onAddCategory, isActionDisabled }) => (
  <div className="text-center py-5">
    <div className="mb-3">
      <i
        className="fas fa-layer-group fa-3x"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      ></i>
    </div>
    <h5 className="mb-2" style={{ color: "var(--text-muted)" }}>
      No Categories Found
    </h5>
    <p className="mb-3 small" style={{ color: "var(--text-muted)" }}>
      Start by adding your first product category to organize your assets.
    </p>
    {onAddCategory && (
      <button
        className="btn btn-sm btn-primary text-white"
        onClick={onAddCategory}
        disabled={isActionDisabled?.()}
        style={{ transition: "all 0.2s ease-in-out", borderWidth: "2px", borderRadius: "4px" }}
        onMouseEnter={(e) => {
          if (!e.target.disabled) {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "none";
        }}
      >
        <i className="fas fa-plus me-1"></i>
        Add Category
      </button>
    )}
  </div>
);

const CategoryFormModal = ({
  category,
  onClose,
  onSave,
  token,
  saving,
  setSaving,
}) => {
  const isEdit = !!category;
  const [formData, setFormData] = useState(DEFAULT_CATEGORY_FORM);
  const [errors, setErrors] = useState({});
  const [isClosing, setIsClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [swalShown, setSwalShown] = useState(false);
  const initialFormState = useRef({});
  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (category) {
      const categoryFormState = {
        name: category.name || "",
        description: category.description || "",
      };
      setFormData(categoryFormState);
      initialFormState.current = { ...categoryFormState };
    } else {
      setFormData(DEFAULT_CATEGORY_FORM);
      initialFormState.current = { ...DEFAULT_CATEGORY_FORM };
    }
    setErrors({});
    setHasUnsavedChanges(false);
  }, [category]);

  // Check if form has unsaved changes
  const checkFormChanges = (currentForm) => {
    return JSON.stringify(currentForm) !== JSON.stringify(initialFormState.current);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = {
      ...formData,
      [name]: value,
    };
    setFormData(newForm);
    setHasUnsavedChanges(checkFormChanges(newForm));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCloseAttempt = async () => {
    if (hasUnsavedChanges) {
      setSwalShown(true);
      const result = await showAlert.confirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close without saving?',
        'Yes, Close',
        'Continue Editing'
      );
      setSwalShown(false);

      if (result.isConfirmed) {
        await closeModal();
      }
    } else {
      await closeModal();
    }
  };

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget && !saving) {
      await handleCloseAttempt();
    }
  };

  const handleEscapeKey = async (e) => {
    if (e.key === 'Escape' && !saving) {
      e.preventDefault();
      await handleCloseAttempt();
    }
  };

  const handleCloseButtonClick = async () => {
    await handleCloseAttempt();
  };

  const closeModal = async () => {
    setIsClosing(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [saving, hasUnsavedChanges]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!validateForm()) return;

    // NUCLEAR FIX: Create abort controller for timeout protection
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 30000); // 30 second timeout

    // NUCLEAR FIX: Flag to track if we've already closed the alert
    let alertClosed = false;
    const closeAlertSafely = () => {
      if (!alertClosed) {
        try {
          showAlert.close();
          alertClosed = true;
        } catch (e) {
          console.error("Error closing alert:", e);
          // Force close using Swal directly as fallback
          try {
            if (Swal && Swal.isVisible && Swal.isVisible()) {
              Swal.close();
              alertClosed = true;
            }
          } catch (swalError) {
            console.error("Error force-closing Swal:", swalError);
            // Last resort: try to remove Swal overlay from DOM
            try {
              const swalOverlay = document.querySelector('.swal2-container');
              if (swalOverlay) {
                swalOverlay.remove();
                alertClosed = true;
              }
            } catch (domError) {
              console.error("Error removing Swal from DOM:", domError);
            }
          }
        }
      }
    };

    setSaving(true);
    
    // Show processing alert
    try {
      showAlert.processing(
        isEdit ? "Updating Category" : "Creating Category",
        isEdit ? "Saving category updates..." : "Registering new category..."
      );
    } catch (alertError) {
      console.error("Error showing processing alert:", alertError);
    }

    try {
      const url = isEdit
        ? `${apiBaseUrl}/product-categories/${category.id}`
        : `${apiBaseUrl}/product-categories`;

      const method = isEdit ? "PUT" : "POST";

      // NUCLEAR FIX: Fetch with timeout and abort signal
      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
        }),
        signal: abortController.signal, // Add abort signal for timeout
      });

      // Clear timeout since we got a response
      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON, get text instead
        const text = await response.text();
        throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // Handle validation errors (including duplicate category errors)
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => {
              const messageText = Array.isArray(messages) ? messages[0] : messages;
              return `${field}: ${messageText}`;
            })
            .join("\n");
          
          // Create a more specific error for duplicate categories
          const duplicateError = Object.entries(data.errors).find(([field, messages]) => {
            const messageText = Array.isArray(messages) ? messages[0] : messages;
            const msg = String(messageText).toLowerCase();
            return msg.includes('duplicate') || 
                   msg.includes('already exists') || 
                   msg.includes('taken') ||
                   msg.includes('unique');
          });
          
          if (duplicateError) {
            const duplicateMsg = Array.isArray(duplicateError[1]) 
              ? duplicateError[1][0] 
              : duplicateError[1];
            throw new Error(duplicateMsg || "A category with this name already exists.");
          }
          
          throw new Error(errorMessages);
        }
        
        // Check if the message itself indicates a duplicate
        const errorMsg = data.message || "Failed to save category";
        if (errorMsg.toLowerCase().includes('duplicate') || 
            errorMsg.toLowerCase().includes('already exists') ||
            errorMsg.toLowerCase().includes('taken') ||
            errorMsg.toLowerCase().includes('unique')) {
          throw new Error(errorMsg);
        }
        
        throw new Error(errorMsg);
      }

      // SUCCESS PATH: Close alert and show success
      closeAlertSafely();
      toast.success(
        isEdit
          ? "Category updated successfully!"
          : "Category created successfully!",
        {
          style: { zIndex: 100002 }
        }
      );
      setHasUnsavedChanges(false);
      onSave();
      closeModal();
      
    } catch (error) {
      // NUCLEAR FIX: Clear timeout in error case too
      clearTimeout(timeoutId);
      
      console.error("Save category error:", error);
      
      // NUCLEAR FIX: ALWAYS close alert, no matter what
      closeAlertSafely();
      
      // Determine error message
      let errorMessage = "Failed to save category";
      let errorTitle = "Error";
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        errorMessage = "Request timed out. Please check your connection and try again.";
        errorTitle = "Request Timeout";
      } else if (error.message) {
        errorMessage = error.message;
        // Check if it's a duplicate/validation error
        if (error.message.toLowerCase().includes('duplicate') || 
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('name') && error.message.toLowerCase().includes('taken')) {
          errorTitle = "Category Already Exists";
        } else if (error.message.toLowerCase().includes('validation') || 
                   error.message.toLowerCase().includes('required')) {
          errorTitle = "Validation Error";
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // CRITICAL FIX: Reset saving state IMMEDIATELY to prevent stuck loading state
      setSaving(false);
      
      // Show error using SweetAlert modal (more visible and prominent)
      try {
        await showAlert.error(
          errorTitle,
          errorMessage,
          {
            zIndex: 100001, // Above modal but below toast container
            confirmButtonText: 'OK',
            allowOutsideClick: true,
            allowEscapeKey: true,
          }
        );
      } catch (swalError) {
        console.error("Error showing SweetAlert:", swalError);
        // Fallback to toast if SweetAlert fails
        toast.error(errorMessage, {
          style: { zIndex: 100002 }
        });
      }
    } finally {
      // NUCLEAR FIX: ALWAYS ensure cleanup happens
      clearTimeout(timeoutId);
      closeAlertSafely();
      
      // CRITICAL FIX: Reset saving state IMMEDIATELY (not in setTimeout)
      // This ensures the form is never stuck in loading state
      try {
        setSaving(false);
      } catch (e) {
        console.error("Error resetting saving state:", e);
      }
      
      // NUCLEAR FIX: Double-check alert is closed after a short delay
      setTimeout(() => {
        try {
          if (Swal && Swal.isVisible && Swal.isVisible()) {
            console.warn("Alert still visible after submit, force closing...");
            Swal.close();
          }
          // Also check DOM for any lingering Swal overlays
          const swalOverlay = document.querySelector('.swal2-container');
          if (swalOverlay && !swalOverlay.querySelector('.swal2-popup')) {
            // Only remove if it's not showing an error modal
            console.warn("Swal overlay still in DOM, removing...");
            swalOverlay.remove();
          }
        } catch (e) {
          // Ignore errors in cleanup check
        }
      }, 200);
    }
  };

  return (
    <Portal>
      <div
        className={`modal fade show d-block modal-backdrop-animation ${
          isClosing ? "exit" : ""
        }`}
        style={{ 
          backgroundColor: swalShown ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
          transition: 'background-color 0.2s ease',
          zIndex: 9999, // Very high - above topbar (1039) but below SweetAlert (100000) and Toastify (100002)
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
        onClick={handleBackdropClick}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-md mx-3 mx-sm-auto" style={{ zIndex: 10000 }}>
          <div
            className={`modal-content border-0 modal-content-animation ${
              isClosing ? "exit" : ""
            }`}
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 10000,
            }}
          >
            <div
              className="modal-header border-0 text-white modal-smooth"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <h5 className="modal-title fw-bold">
                <i className={`fas ${isEdit ? "fa-edit" : "fa-plus"} me-2`}></i>
                {isEdit ? "Edit Category" : "New Category"}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white btn-smooth"
                onClick={handleCloseButtonClick}
                disabled={saving}
                style={{
                  transition: 'all 0.2s ease',
                }}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                className="modal-body modal-smooth"
                style={{
                  backgroundColor: '#f8f9fa',
                }}
              >
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Category Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control modal-smooth ${
                      errors.name ? "is-invalid" : ""
                    }`}
                    value={formData.name}
                    onChange={handleChange}
                    name="name"
                    placeholder="e.g., Spreadsheet Templates"
                    disabled={saving}
                    style={{ backgroundColor: '#ffffff' }}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Description
                  </label>
                  <textarea
                    className={`form-control modal-smooth ${
                      errors.description ? "is-invalid" : ""
                    }`}
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    name="description"
                    placeholder="Optional short description"
                    disabled={saving}
                    style={{ backgroundColor: '#ffffff' }}
                  ></textarea>
                  {errors.description && (
                    <div className="invalid-feedback">{errors.description}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top bg-white modal-smooth">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-smooth"
                  onClick={handleCloseButtonClick}
                  disabled={saving}
                  style={{
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn fw-semibold position-relative btn-smooth"
                  style={{
                    backgroundColor: saving ? '#6c757d' : 'var(--primary-color)',
                    borderColor: saving ? '#6c757d' : 'var(--primary-color)',
                    color: 'white',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: '140px',
                  }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-1"></i>
                      {isEdit ? "Save Changes" : "Save Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProductCategories;