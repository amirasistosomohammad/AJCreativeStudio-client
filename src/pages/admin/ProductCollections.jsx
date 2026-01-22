import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaLayerGroup, FaCheckCircle, FaExclamationTriangle, FaSyncAlt, FaChevronLeft, FaChevronRight, FaBox } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CollectionFormModal from './CollectionFormModal';
import CollectionDetailsModal from './CollectionDetailsModal';
import { showAlert } from '../../services/notificationService';
import Portal from '../../components/Portal';
import LoadingSpinner from '../../components/admin/LoadingSpinner';

const ProductCollections = () => {
  const { token } = useAuth();
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'inactive', or '' for all
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('display_order');
  const [sortDirection, setSortDirection] = useState('asc');
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalProducts: 0,
  });

  // Modal states
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [collectionDetails, setCollectionDetails] = useState({});

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    filterAndSortCollections();
  }, [collections, searchTerm, statusFilter, sortField, sortDirection]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      const response = await fetch(`${apiBaseUrl}/product-collections?per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch collections (${response.status})`;
        try {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error('API Error Text:', errorText);
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      console.log('Collections API Response:', data);
      
      if (data.success && data.collections) {
        setCollections(data.collections);
        
        // Calculate stats
        const totalProducts = data.collections.reduce((sum, coll) => sum + (coll.products_count || 0), 0);
        setStats({
          totalCollections: data.pagination?.total || data.collections.length || 0,
          totalProducts: totalProducts,
        });
      } else {
        console.error('Invalid response structure:', data);
        toast.error('Invalid response from server');
        setStats({
          totalCollections: 0,
          totalProducts: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error(`Error fetching collections: ${error.message}`);
      setStats({
        totalCollections: 0,
        totalProducts: 0,
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchCollectionDetailsBulk = useCallback(async (list) => {
    if (!Array.isArray(list) || list.length === 0) return;

    const detailsMap = {};

    await Promise.all(
      list.map(async (coll) => {
        try {
          const response = await fetch(`${apiBaseUrl}/product-collections/${coll.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          if (!response.ok) return;
          const data = await response.json();
          if (data.success && data.collection) {
            const products = data.collection.products || [];
            detailsMap[coll.id] = {
              collection: data.collection,
              products,
            };
          }
        } catch (err) {
          console.error('Error fetching collection detail', coll.id, err);
        }
      })
    );

    setCollectionDetails(detailsMap);
  }, [apiBaseUrl, token]);

  useEffect(() => {
    if (collections.length > 0) {
      fetchCollectionDetailsBulk(collections);
    }
  }, [collections, fetchCollectionDetailsBulk]);

  const filterAndSortCollections = () => {
    let filtered = [...collections];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (collection.description && collection.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(collection => collection.is_active === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(collection => collection.is_active === false);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'name') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCollections(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDelete = async (id) => {
    const result = await showAlert.confirm(
      'Delete Collection',
      'Are you sure you want to delete this collection? Products will not be deleted, only removed from this collection.',
      'Yes, Delete',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      setActionLoading(id);
      setActionLock(true);
      
      // Show loading indicator
      showAlert.loading('Deleting collection...');

      const response = await fetch(`${apiBaseUrl}/product-collections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        showAlert.close();
        toast.success('Collection deleted successfully');
        fetchCollections();
      } else {
        showAlert.close();
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      showAlert.close();
      toast.error('Error deleting collection');
    } finally {
      setActionLoading(null);
      setActionLock(false);
    }
  };

  const handleEdit = (collection) => {
    setEditingCollection(collection);
    setShowCollectionForm(true);
  };

  const handleViewDetails = (collection) => {
    setSelectedCollection(collection);
    setShowDetailModal(true);
  };

  const handleCloseForm = () => {
    setShowCollectionForm(false);
    setEditingCollection(null);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedCollection(null);
  };

  const onSave = () => {
    fetchCollections();
    handleCloseForm();
  };

  const onDetailUpdate = () => {
    fetchCollections();
  };

  const isActionDisabled = (id = null) => {
    return actionLock || (actionLoading !== null && (id === null || actionLoading !== id));
  };

  const hasActiveFilters = searchTerm || statusFilter || sortField !== 'display_order' || sortDirection !== 'asc';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSortField('display_order');
    setSortDirection('asc');
  };

  // Pagination
  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);
  const endIndex = startIndex + itemsPerPage;
  const currentCollections = filteredCollections.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage);
  
  const paginationMeta = useMemo(() => {
    return {
      current_page: currentPage,
      last_page: totalPages,
      total: filteredCollections.length,
      from: filteredCollections.length > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, filteredCollections.length),
    };
  }, [currentPage, totalPages, filteredCollections.length, startIndex, endIndex]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 inventory-categories-container ${!loading ? 'fadeIn' : ''}`}>
      {loading ? (
        <LoadingSpinner text="Loading collections data..." />
      ) : (
        <>
          {/* Page Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
        <div className="flex-grow-1 mb-2 mb-md-0">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: "var(--text-primary)" }}
          >
            <FaLayerGroup className="me-2" />
            Product Collections
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            Organize products into collections for landing page sections
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-primary text-white"
            onClick={() => {
              setEditingCollection(null);
              setShowCollectionForm(true);
            }}
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
            New Collection
          </button>
          <button
            className="btn btn-sm"
            onClick={fetchCollections}
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

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        {[stats.totalCollections, stats.totalProducts].map((value, idx) => (
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
                      {idx === 0 ? "Total Collections" : "Products Tagged"}
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
                      {initialLoading ? '...' : value}
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

      {/* Search and Filter Controls */}
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
                Search Collections
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading || isActionDisabled()}
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
                Status
              </label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={loading || isActionDisabled()}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Sort By
              </label>
              <select
                className="form-select form-select-sm"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                disabled={loading || isActionDisabled()}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="display_order">Display Order</option>
                <option value="name">Name</option>
                <option value="created_at">Created Date</option>
                <option value="products_count">Product Count</option>
              </select>
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
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                disabled={loading || isActionDisabled()}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-sm btn-outline-secondary w-100"
                type="button"
                onClick={clearFilters}
                disabled={loading || isActionDisabled() || !hasActiveFilters}
                style={{ fontSize: '0.875rem', marginBottom: '0' }}
              >
                <i className="fas fa-filter me-1"></i>
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
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
              <i className="fas fa-layer-group me-2"></i>
              Collections Catalog
              {!loading && (
                <small className="opacity-75 ms-2 text-white">
                  ({paginationMeta.total} total)
                </small>
              )}
            </h5>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredCollections.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i
                  className="fas fa-layer-group fa-3x"
                  style={{ color: "var(--text-muted)", opacity: 0.5 }}
                ></i>
              </div>
              <h5 className="mb-2" style={{ color: "var(--text-muted)" }}>
                No Collections Found
              </h5>
              <p className="mb-3 small" style={{ color: "var(--text-muted)" }}>
                {searchTerm || statusFilter
                  ? "Try adjusting your filters"
                  : "Start by adding your first product collection to organize your products."}
              </p>
              {!searchTerm && !statusFilter && (
                <button
                  className="btn btn-sm btn-primary text-white"
                  onClick={() => {
                    setEditingCollection(null);
                    setShowCollectionForm(true);
                  }}
                  disabled={isActionDisabled()}
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
                  Add Collection
                </button>
              )}
            </div>
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
                      Collection
                    </th>
                    <th className="small fw-semibold">Description</th>
                    <th
                      className="small fw-semibold text-center"
                      style={{ width: "14%" }}
                    >
                      Products
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
                  {currentCollections.map((collection, index) => (
                    <tr key={collection.id} className="align-middle">
                      <td
                        className="text-center fw-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-info btn-sm text-white"
                            onClick={() => handleViewDetails(collection)}
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
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "none";
                            }}
                          >
                            <FaBox style={{ fontSize: "0.875rem" }} />
                          </button>
                          <button
                            className="btn btn-success btn-sm text-white"
                            onClick={() => handleEdit(collection)}
                            disabled={isActionDisabled()}
                            title="Edit Collection"
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
                            <FaEdit style={{ fontSize: "0.875rem" }} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm text-white"
                            onClick={() => handleDelete(collection.id)}
                            disabled={isActionDisabled(collection.id)}
                            title="Delete Collection"
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
                            {actionLoading === collection.id ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                            ) : (
                              <FaTrash style={{ fontSize: "0.875rem" }} />
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
                          title={collection.name}
                        >
                          {collection.name}
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
                            collection.description || "No description provided"
                          }
                        >
                          {collection.description || "No description provided"}
                        </div>
                      </td>
                      <td
                        className="text-center fw-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <span className="badge bg-info">
                          {collection.products_count ?? 0} products
                        </span>
                      </td>
                      <td className="text-center text-muted small">
                        {collection.created_at ? (
                          <div className="d-flex flex-row align-items-center justify-content-center gap-1" style={{ whiteSpace: "nowrap" }}>
                            <span className="text-nowrap">
                              {new Date(collection.created_at).toLocaleDateString(
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
                              {new Date(collection.created_at).toLocaleTimeString(
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

        {!loading && filteredCollections.length > 0 && (
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
                        startIndex + currentCollections.length,
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
                  collections
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

      {/* Collection Form Modal */}
      {showCollectionForm && (
        <CollectionFormModal
          collection={editingCollection}
          onClose={handleCloseForm}
          onSave={onSave}
          token={token}
          existingCollections={collections}
        />
      )}

      {/* Collection Details Modal */}
      {showDetailModal && selectedCollection && (
        <CollectionDetailsModal
          collection={selectedCollection}
          onClose={handleCloseDetail}
          token={token}
          prefetchedCollection={collectionDetails[selectedCollection.id]?.collection}
          prefetchedProducts={collectionDetails[selectedCollection.id]?.products}
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

export default ProductCollections;

