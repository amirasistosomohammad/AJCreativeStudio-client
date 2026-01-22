import React, { useCallback, useEffect, useMemo, useState } from "react";
import Portal from "../../components/Portal";
import { useAuth } from "../../contexts/AuthContext";
import { showAlert } from "../../services/notificationService";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const ProductReviews = () => {
  const { token } = useAuth();
  const [allReviews, setAllReviews] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
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
    active: 0,
    inactive: 0,
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailClosing, setDetailClosing] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClosing, setEditClosing] = useState(false);
  const [editForm, setEditForm] = useState({
    rating: 5,
    title: "",
    content: "",
    name: "",
    email: "",
    is_active: false,
  });

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const fetchAllReviews = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/product-reviews?per_page=1000`, {
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

      if (data.success && data.reviews) {
        setAllReviews(data.reviews);
      } else {
        setAllReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      showAlert.error(
        "Reviews Error",
        error.message || "Unable to load reviews"
      );
      setAllReviews([]);
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, apiBaseUrl]);

  const filterAndPaginateReviews = useCallback(() => {
    let filtered = [...allReviews];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((review) => {
        const productTitle = review.product?.title || "";
        return (
          (review.title || "").toLowerCase().includes(search) ||
          (review.content || "").toLowerCase().includes(search) ||
          (review.name || "").toLowerCase().includes(search) ||
          (review.email || "").toLowerCase().includes(search) ||
          productTitle.toLowerCase().includes(search)
        );
      });
    }

    if (activeFilter === "active") {
      filtered = filtered.filter((review) => review.is_active === true);
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter((review) => review.is_active === false);
    }

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    setReviews(paginated);
    setPaginationMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });
  }, [allReviews, searchTerm, activeFilter, currentPage, itemsPerPage]);

  const updateStats = useCallback(() => {
    const total = allReviews.length;
    const active = allReviews.filter((r) => r.is_active === true).length;
    const inactive = allReviews.filter((r) => r.is_active === false).length;
    setStats({
      total,
      active,
      inactive,
    });
  }, [allReviews]);

  useEffect(() => {
    fetchAllReviews();
  }, [fetchAllReviews]);

  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateReviews();
      updateStats();
    }
  }, [filterAndPaginateReviews, initialLoading, updateStats]);

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  const isActionDisabled = (id = null) =>
    actionLock || (actionLoading && actionLoading !== id);

  const updateReview = async (review, payload, successMessage) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes");
      return;
    }

    setActionLock(true);
    setActionLoading(review.id);
    showAlert.processing("Updating Review", "Please wait...");

    try {
      const response = await fetch(`${apiBaseUrl}/product-reviews/${review.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update review");
      }

      showAlert.close();
      toast.success(successMessage);

      setAllReviews((prev) =>
        prev.map((item) => (item.id === review.id ? data.review : item))
      );
    } catch (error) {
      console.error("Review update error:", error);
      showAlert.close();
      toast.error(error.message || "Unable to update review");
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setDetailClosing(false);
    setShowDetailModal(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating || 5,
      title: review.title || "",
      content: review.content || "",
      name: review.name || "",
      email: review.email || "",
      is_active: review.is_active === true,
    });
    setEditClosing(false);
    setShowEditModal(true);
  };

  const closeDetailModal = () => {
    setDetailClosing(true);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedReview(null);
      setDetailClosing(false);
    }, 180);
  };

  const closeEditModal = () => {
    setEditClosing(true);
    setTimeout(() => {
      setShowEditModal(false);
      setEditingReview(null);
      setEditClosing(false);
    }, 180);
  };

  const handleDeleteReview = async (review) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes");
      return;
    }

    const confirmation = await showAlert.confirm(
      "Delete Review",
      "Remove this review permanently?",
      "Delete",
      "Cancel"
    );

    if (!confirmation.isConfirmed) {
      return;
    }

    setActionLock(true);
    setActionLoading(review.id);
    showAlert.processing("Deleting Review", "Please wait...");

    try {
      const response = await fetch(`${apiBaseUrl}/product-reviews/${review.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete review");
      }

      showAlert.close();
      toast.success("Review deleted");
      setAllReviews((prev) => prev.filter((item) => item.id !== review.id));
    } catch (error) {
      console.error("Review delete error:", error);
      showAlert.close();
      toast.error(error.message || "Unable to delete review");
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingReview) {
      return;
    }

    const payload = {
      rating: Number(editForm.rating || 0),
      title: editForm.title,
      content: editForm.content,
      name: editForm.name,
      email: editForm.email,
      is_active: editForm.is_active,
    };

    await updateReview(editingReview, payload, "Review updated");
    setShowEditModal(false);
    setEditingReview(null);
  };

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 inventory-categories-container ${!loading ? "fadeIn" : ""}`}>
      {loading ? (
        <LoadingSpinner text="Loading Product Reviews..." />
      ) : (
        <>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <div className="flex-grow-1 mb-2 mb-md-0">
              <h1 className="h4 mb-1 fw-bold" style={{ color: "var(--text-primary)" }}>
                <i className="fas fa-star me-2"></i>
                Product Reviews
              </h1>
              <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
                Review and moderate customer feedback.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-sm"
                onClick={fetchAllReviews}
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
                        Total Reviews
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
                        {initialLoading ? "..." : stats.total}
                      </div>
                    </div>
                    <div className="col-auto">
                      <FaEye className="fa-2x" style={{ color: "var(--primary-light)", opacity: 0.7 }} />
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
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--success-color)" }}>
                        Active
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--success-color)" }}>
                        {initialLoading ? "..." : stats.active}
                      </div>
                    </div>
                    <div className="col-auto">
                      <FaEye className="fa-2x" style={{ color: "var(--success-light)", opacity: 0.7 }} />
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
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--danger-color)" }}>
                        Inactive
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--danger-color)" }}>
                        {initialLoading ? "..." : stats.inactive}
                      </div>
                    </div>
                    <div className="col-auto">
                      <FaEye className="fa-2x" style={{ color: "var(--danger-light)", opacity: 0.7 }} />
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
                    Search Reviews
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
                      placeholder="Search by review, product, or email..."
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
                <div className="col-md-3">
                  <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    Active
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={activeFilter}
                    onChange={(e) => {
                      setActiveFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                  <i className="fas fa-star me-2"></i>
                  Reviews Catalog
                  {!loading && (
                    <small className="opacity-75 ms-2 text-white">({paginationMeta.total} total)</small>
                  )}
                </h5>
              </div>
            </div>
            <div className="card-body p-0">
              {reviews.length === 0 ? (
                <div className="p-3 text-muted small">No reviews found.</div>
              ) : (
                <div className="table-responsive" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table className="table table-striped table-hover mb-0" style={{ minWidth: "1100px", tableLayout: "fixed", width: "100%" }}>
                    <thead style={{ backgroundColor: "var(--background-light)" }}>
                      <tr>
                        <th className="text-center small fw-semibold" style={{ width: "4%" }}>
                          #
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: "180px", minWidth: "180px" }}>
                          Actions
                        </th>
                        <th className="small fw-semibold" style={{ width: "220px", minWidth: "220px" }}>
                          Product
                        </th>
                        <th className="small fw-semibold" style={{ width: "200px", minWidth: "200px" }}>
                          Reviewer
                        </th>
                        <th className="small fw-semibold" style={{ width: "280px", minWidth: "280px" }}>
                          Review
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: "80px", minWidth: "80px" }}>
                          Rating
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: "90px", minWidth: "90px" }}>
                          Active
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((review, index) => (
                        <tr key={review.id} className="align-middle" style={{ height: "48px", whiteSpace: "nowrap" }}>
                          <td className="text-center fw-bold" style={{ color: "var(--text-primary)", width: "40px", minWidth: "40px" }}>
                            {startIndex + index + 1}
                          </td>
                          <td className="text-center" style={{ width: "180px", minWidth: "180px", padding: "0.5rem" }}>
                            <div className="d-flex justify-content-center gap-1" style={{ gap: "0.25rem" }}>
                              <button
                                className="btn btn-info btn-sm text-white"
                                onClick={() => handleViewReview(review)}
                                disabled={isActionDisabled(review.id)}
                                title="View Review"
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
                                className="btn btn-success btn-sm text-white"
                                onClick={() => handleEditReview(review)}
                                disabled={isActionDisabled(review.id)}
                                title="Edit Review"
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
                                <FaEdit style={{ fontSize: "0.875rem" }} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm text-white"
                                onClick={() => handleDeleteReview(review)}
                                disabled={isActionDisabled(review.id)}
                                title="Delete Review"
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
                                <FaTrash style={{ fontSize: "0.875rem" }} />
                              </button>
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="fw-semibold text-truncate" title={review.product?.title || review.product_id}>
                              {review.product?.title || `Product #${review.product_id}`}
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="fw-semibold text-truncate" title={review.name}>
                              {review.name}
                            </div>
                            <div className="small text-muted text-truncate" title={review.email}>
                              {review.email}
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="fw-semibold text-truncate" title={review.title}>
                              {review.title || "No title"}
                            </div>
                            <div className="small text-muted text-truncate" title={review.content}>
                              {review.content}
                            </div>
                          </td>
                          <td className="text-center fw-bold" style={{ color: "var(--text-primary)" }}>
                            {review.rating}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${review.is_active ? "bg-success" : "bg-secondary"}`}
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}
                            >
                              {review.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!loading && reviews.length > 0 && (
              <div className="card-footer bg-white border-top px-3 py-2">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                  <div className="text-center text-md-start">
                    <small style={{ color: "var(--text-muted)" }}>
                      Showing{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.from || startIndex + 1}-{paginationMeta.to || Math.min(startIndex + reviews.length, paginationMeta.total)}
                      </span>{" "}
                      of{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.total}
                      </span>{" "}
                      reviews
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
          {showDetailModal && selectedReview && (
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
                        <i className="fas fa-eye me-2"></i>
                        Review Details
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
                      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
                        {selectedReview.product?.thumbnail_url && (
                          <div
                            style={{
                              width: "140px",
                              height: "140px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid #E0E0E0",
                              backgroundColor: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={selectedReview.product.thumbnail_url}
                              alt={selectedReview.product?.title || "Product"}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        )}
                        <div className="flex-grow-1">
                          <div className="fw-semibold">Product</div>
                          <div className="text-muted mb-2">
                            {selectedReview.product?.title || `Product #${selectedReview.product_id}`}
                          </div>
                          <div className="row g-2">
                            <div className="col-6 col-md-4">
                              <div className="fw-semibold">Rating</div>
                              <div className="text-muted">{selectedReview.rating}</div>
                            </div>
                            <div className="col-6 col-md-4">
                              <div className="fw-semibold">Active</div>
                              <div className="text-muted">{selectedReview.is_active ? "Yes" : "No"}</div>
                            </div>
                            <div className="col-12 col-md-4">
                              <div className="fw-semibold">Submitted</div>
                              <div className="text-muted">
                                {selectedReview.created_at ? new Date(selectedReview.created_at).toLocaleString() : "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <div className="fw-semibold">Reviewer</div>
                          <div className="text-muted">{selectedReview.name}</div>
                          <div className="text-muted">{selectedReview.email}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="fw-semibold">Review Title</div>
                          <div className="text-muted">{selectedReview.title || "No title"}</div>
                        </div>
                      </div>
                      <div>
                        <div className="fw-semibold">Content</div>
                        <div className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                          {selectedReview.content}
                        </div>
                      </div>
                      {selectedReview.image_urls && selectedReview.image_urls.length > 0 && (
                        <div className="mt-4">
                          <div className="fw-semibold mb-2">Attached Images</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {selectedReview.image_urls.map((url, imgIndex) => (
                              <div
                                key={imgIndex}
                                style={{
                                  width: "110px",
                                  height: "90px",
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  border: "1px solid #E0E0E0",
                                  backgroundColor: "#fff",
                                }}
                              >
                                <img
                                  src={url}
                                  alt={`Review attachment ${imgIndex + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
          {showEditModal && editingReview && (
            <Portal>
              <div
                className={`modal fade show d-block modal-backdrop-animation ${editClosing ? "exit" : ""}`}
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
                  closeEditModal();
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
                    className={`modal-content border-0 modal-content-animation ${editClosing ? "exit" : ""}`}
                    style={{
                      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      zIndex: 10000,
                    }}
                  >
                    <div className="modal-header border-0 text-white modal-smooth" style={{ backgroundColor: "var(--primary-color)" }}>
                      <h5 className="modal-title fw-bold">
                        <i className="fas fa-edit me-2"></i>
                        Edit Review
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white btn-smooth"
                        onClick={() => {
                          closeEditModal();
                        }}
                        aria-label="Close"
                      />
                    </div>
                    <div className="modal-body modal-smooth" style={{ backgroundColor: "#f8f9fa" }}>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Rating
                          </label>
                          <select
                            className="form-select"
                            value={editForm.rating}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                          >
                            {[1, 2, 3, 4, 5].map((val) => (
                              <option key={val} value={val}>{val}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-8 d-flex align-items-end">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={editForm.is_active}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                              id="reviewActiveToggle"
                            />
                            <label className="form-check-label" htmlFor="reviewActiveToggle">
                              Active (visible on product)
                            </label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Reviewer Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={editForm.email}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.title}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Content
                          </label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={editForm.content}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer border-top bg-white modal-smooth">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-smooth"
                        onClick={() => {
                          closeEditModal();
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-smooth"
                        onClick={handleSaveEdit}
                      >
                        Save Changes
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

export default ProductReviews;

