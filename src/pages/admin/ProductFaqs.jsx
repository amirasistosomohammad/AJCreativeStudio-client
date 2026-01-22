import React, { useCallback, useEffect, useMemo, useState } from "react";
import Portal from "../../components/Portal";
import { useAuth } from "../../contexts/AuthContext";
import { showAlert } from "../../services/notificationService";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const ProductFaqs = () => {
  const { token } = useAuth();
  const [allFaqs, setAllFaqs] = useState([]);
  const [faqs, setFaqs] = useState([]);
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
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailClosing, setDetailClosing] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formClosing, setFormClosing] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    display_order: 1,
    is_active: true,
  });
  const [formTouched, setFormTouched] = useState(false);

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const fetchAllFaqs = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/product-faqs?per_page=1000`, {
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

      if (data.success && data.faqs) {
        setAllFaqs(data.faqs);
      } else {
        setAllFaqs([]);
      }
    } catch (error) {
      console.error("Error fetching product FAQs:", error);
      showAlert.error(
        "Product FAQs Error",
        error.message || "Unable to load product FAQs"
      );
      setAllFaqs([]);
      setStats({ total: 0, active: 0, inactive: 0 });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, apiBaseUrl]);

  const filterAndPaginateFaqs = useCallback(() => {
    let filtered = [...allFaqs];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((faq) => {
        return (
          (faq.question || "").toLowerCase().includes(search) ||
          (faq.answer || "").toLowerCase().includes(search)
        );
      });
    }

    if (activeFilter === "active") {
      filtered = filtered.filter((faq) => faq.is_active === true);
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter((faq) => faq.is_active === false);
    }

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    setFaqs(paginated);
    setPaginationMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });
  }, [allFaqs, searchTerm, activeFilter, currentPage, itemsPerPage]);

  const updateStats = useCallback(() => {
    const total = allFaqs.length;
    const active = allFaqs.filter((r) => r.is_active === true).length;
    const inactive = allFaqs.filter((r) => r.is_active === false).length;
    setStats({ total, active, inactive });
  }, [allFaqs]);

  useEffect(() => {
    fetchAllFaqs();
  }, [fetchAllFaqs]);

  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateFaqs();
      updateStats();
    }
  }, [filterAndPaginateFaqs, initialLoading, updateStats]);

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  const isActionDisabled = (id = null) =>
    actionLock || (actionLoading && actionLoading !== id);

  const handleViewFaq = (faq) => {
    setSelectedFaq(faq);
    setDetailClosing(false);
    setShowDetailModal(true);
  };

  const handleAddFaq = () => {
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      display_order: 1,
      is_active: true,
    });
    setFormTouched(false);
    setFormClosing(false);
    setShowFormModal(true);
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || "",
      answer: faq.answer || "",
      display_order: faq.display_order || 1,
      is_active: faq.is_active === true,
    });
    setFormTouched(false);
    setFormClosing(false);
    setShowFormModal(true);
  };

  const closeFormModal = async () => {
    if (formTouched) {
      const confirmation = await showAlert.confirm(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to close?",
        "Discard",
        "Cancel"
      );
      if (!confirmation.isConfirmed) {
        return;
      }
    }
    setFormClosing(true);
    setTimeout(() => {
      setShowFormModal(false);
      setEditingFaq(null);
      setFormClosing(false);
      setFormTouched(false);
    }, 180);
  };

  const closeDetailModal = () => {
    setDetailClosing(true);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedFaq(null);
      setDetailClosing(false);
    }, 180);
  };

  const isDuplicateOrder = (displayOrder, currentId = null) => {
    return allFaqs.some((faq) => {
      if (currentId && faq.id === currentId) return false;
      return (
        Number(faq.display_order) === Number(displayOrder)
      );
    });
  };

  const handleSaveFaq = async () => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes");
      return;
    }

    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }

    if (isDuplicateOrder(formData.display_order, editingFaq?.id)) {
      toast.error("Display order must be unique.");
      return;
    }

    setActionLock(true);
    setActionLoading(editingFaq ? editingFaq.id : "new");
    showAlert.processing(editingFaq ? "Updating FAQ" : "Creating FAQ", "Please wait...");

    try {
      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        display_order: Number(formData.display_order || 1),
        is_active: formData.is_active,
      };

      const response = await fetch(
        `${apiBaseUrl}/product-faqs${editingFaq ? `/${editingFaq.id}` : ""}`,
        {
          method: editingFaq ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save FAQ");
      }

      showAlert.close();
      toast.success(data.message || "FAQ saved");

      if (editingFaq) {
        setAllFaqs((prev) =>
          prev.map((item) => (item.id === editingFaq.id ? data.faq : item))
        );
      } else {
        setAllFaqs((prev) => [data.faq, ...prev]);
      }

      setShowFormModal(false);
      setEditingFaq(null);
      setFormTouched(false);
    } catch (error) {
      console.error("FAQ save error:", error);
      showAlert.close();
      toast.error(error.message || "Unable to save FAQ");
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  const handleDeleteFaq = async (faq) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes");
      return;
    }

    const confirmation = await showAlert.confirm(
      "Delete FAQ",
      "Remove this FAQ permanently?",
      "Delete",
      "Cancel"
    );

    if (!confirmation.isConfirmed) {
      return;
    }

    setActionLock(true);
    setActionLoading(faq.id);
    showAlert.processing("Deleting FAQ", "Please wait...");

    try {
      const response = await fetch(`${apiBaseUrl}/product-faqs/${faq.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete FAQ");
      }

      showAlert.close();
      toast.success("FAQ deleted");
      setAllFaqs((prev) => prev.filter((item) => item.id !== faq.id));
    } catch (error) {
      console.error("FAQ delete error:", error);
      showAlert.close();
      toast.error(error.message || "Unable to delete FAQ");
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 inventory-categories-container ${!loading ? "fadeIn" : ""}`}>
      {loading ? (
        <LoadingSpinner text="Loading Product FAQs..." />
      ) : (
        <>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <div className="flex-grow-1 mb-2 mb-md-0">
              <h1 className="h4 mb-1 fw-bold" style={{ color: "var(--text-primary)" }}>
                <i className="fas fa-question-circle me-2"></i>
                Product FAQs
              </h1>
              <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
                Manage FAQ items per product.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-sm"
                onClick={handleAddFaq}
                style={{
                  transition: "all 0.2s ease-in-out",
                  border: "2px solid var(--primary-color)",
                  color: "white",
                  backgroundColor: "var(--primary-color)",
                }}
              >
                <FaPlus className="me-1" />
                Add FAQ
              </button>
              <button
                className="btn btn-sm"
                onClick={fetchAllFaqs}
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
                        Total FAQs
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
                        {initialLoading ? "..." : stats.total}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-question-circle fa-2x" style={{ color: "var(--primary-light)", opacity: 0.7 }}></i>
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
                    Search FAQs
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
                      placeholder="Search by question, answer, or product..."
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
                  <i className="fas fa-question-circle me-2"></i>
                  Product FAQs
                  {!loading && (
                    <small className="opacity-75 ms-2 text-white">({paginationMeta.total} total)</small>
                  )}
                </h5>
              </div>
            </div>
            <div className="card-body p-0">
              {faqs.length === 0 ? (
                <div className="p-3 text-muted small">No FAQs found.</div>
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
                        <th className="small fw-semibold" style={{ width: "260px", minWidth: "260px" }}>
                          Question
                        </th>
                        <th className="small fw-semibold" style={{ width: "280px", minWidth: "280px" }}>
                          Answer
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: "90px", minWidth: "90px" }}>
                          Order
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: "90px", minWidth: "90px" }}>
                          Active
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.map((faq, index) => (
                        <tr key={faq.id} className="align-middle" style={{ height: "48px", whiteSpace: "nowrap" }}>
                          <td className="text-center fw-bold" style={{ color: "var(--text-primary)", width: "40px", minWidth: "40px" }}>
                            {startIndex + index + 1}
                          </td>
                          <td className="text-center" style={{ width: "120px", minWidth: "120px", padding: "0.5rem" }}>
                            <div className="d-flex justify-content-center gap-1" style={{ gap: "0.25rem" }}>
                              <button
                                className="btn btn-info btn-sm text-white"
                                onClick={() => handleViewFaq(faq)}
                                disabled={isActionDisabled(faq.id)}
                                title="View FAQ"
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
                                onClick={() => handleEditFaq(faq)}
                                disabled={isActionDisabled(faq.id)}
                                title="Edit FAQ"
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
                                onClick={() => handleDeleteFaq(faq)}
                                disabled={isActionDisabled(faq.id)}
                                title="Delete FAQ"
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
                            <div className="text-muted text-truncate" title={faq.question}>
                              {faq.question}
                            </div>
                          </td>
                          <td style={{ overflow: "hidden" }}>
                            <div className="text-muted small text-truncate" title={faq.answer}>
                              {faq.answer}
                            </div>
                          </td>
                          <td className="text-center">{faq.display_order}</td>
                          <td className="text-center">
                            <span
                              className={`badge ${faq.is_active ? "bg-success" : "bg-secondary"}`}
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}
                            >
                              {faq.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!loading && faqs.length > 0 && (
              <div className="card-footer bg-white border-top px-3 py-2">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                  <div className="text-center text-md-start">
                    <small style={{ color: "var(--text-muted)" }}>
                      Showing{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.from || startIndex + 1}-{paginationMeta.to || Math.min(startIndex + faqs.length, paginationMeta.total)}
                      </span>{" "}
                      of{" "}
                      <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                        {paginationMeta.total}
                      </span>{" "}
                      FAQs
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

          {showDetailModal && selectedFaq && (
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
                onClick={() => closeDetailModal()}
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
                        <i className="fas fa-question-circle me-2"></i>
                        FAQ Details
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white btn-smooth"
                        onClick={() => closeDetailModal()}
                        aria-label="Close"
                      />
                    </div>
                    <div className="modal-body modal-smooth" style={{ backgroundColor: "#f8f9fa" }}>
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <div className="fw-semibold">Order</div>
                          <div className="text-muted">{selectedFaq.display_order}</div>
                        </div>
                        <div className="col-md-4">
                          <div className="fw-semibold">Active</div>
                          <div className="text-muted">{selectedFaq.is_active ? "Yes" : "No"}</div>
                        </div>
                        <div className="col-md-4">
                          <div className="fw-semibold">Created</div>
                          <div className="text-muted">
                            {selectedFaq.created_at ? new Date(selectedFaq.created_at).toLocaleString() : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="fw-semibold">Question</div>
                        <div className="text-muted">{selectedFaq.question}</div>
                      </div>
                      <div>
                        <div className="fw-semibold">Answer</div>
                        <div className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                          {selectedFaq.answer}
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer border-top bg-white modal-smooth">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-smooth"
                        onClick={() => closeDetailModal()}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Portal>
          )}

          {showFormModal && (
            <Portal>
              <div
                className={`modal fade show d-block modal-backdrop-animation ${formClosing ? "exit" : ""}`}
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
                onClick={() => closeFormModal()}
                aria-modal="true"
                role="dialog"
              >
                <div
                  className="modal-dialog modal-dialog-centered modal-lg"
                  style={{ zIndex: 10000 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`modal-content border-0 modal-content-animation ${formClosing ? "exit" : ""}`}
                    style={{
                      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      zIndex: 10000,
                    }}
                  >
                    <div className="modal-header border-0 text-white modal-smooth" style={{ backgroundColor: "var(--primary-color)" }}>
                      <h5 className="modal-title fw-bold">
                        <i className="fas fa-question-circle me-2"></i>
                        {editingFaq ? "Edit FAQ" : "Add FAQ"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white btn-smooth"
                        onClick={() => closeFormModal()}
                        aria-label="Close"
                      />
                    </div>
                    <div className="modal-body modal-smooth" style={{ backgroundColor: "#f8f9fa" }}>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Order
                          </label>
                          <input
                            type="number"
                            min="1"
                            className="form-control"
                            value={formData.display_order}
                            onChange={(e) => {
                              setFormTouched(true);
                              setFormData((prev) => ({ ...prev, display_order: e.target.value }));
                            }}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.question}
                            onChange={(e) => {
                              setFormTouched(true);
                              setFormData((prev) => ({ ...prev, question: e.target.value }));
                            }}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Answer
                          </label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={formData.answer}
                            onChange={(e) => {
                              setFormTouched(true);
                              setFormData((prev) => ({ ...prev, answer: e.target.value }));
                            }}
                          />
                        </div>
                        <div className="col-md-12">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={formData.is_active}
                              onChange={(e) => {
                                setFormTouched(true);
                                setFormData((prev) => ({ ...prev, is_active: e.target.checked }));
                              }}
                              id="faqActiveToggle"
                            />
                            <label className="form-check-label" htmlFor="faqActiveToggle">
                              Active (visible on product page)
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer border-top bg-white modal-smooth">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-smooth"
                        onClick={() => closeFormModal()}
                        disabled={isActionDisabled(editingFaq?.id)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-smooth"
                        onClick={handleSaveFaq}
                        disabled={isActionDisabled(editingFaq?.id)}
                      >
                        {editingFaq ? "Save Changes" : "Create FAQ"}
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

export default ProductFaqs;


