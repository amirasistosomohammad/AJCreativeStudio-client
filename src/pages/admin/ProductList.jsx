import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaBox, FaCheckCircle, FaExclamationTriangle, FaSyncAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductFormModal from './ProductFormModal';
import ProductDetailsModal from './ProductDetailsModal';
import { showAlert } from '../../services/notificationService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import ImageLightbox from '../../components/ImageLightbox';
import LoadingSpinner from '../../components/admin/LoadingSpinner';
import { buildAssetUrl as buildApiAssetUrl } from '../../utils/productImageUtils';

const ProductList = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'inactive', or '' for all
  const [categories, setCategories] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'list' | 'grid'
  const [featureIndexMap, setFeatureIndexMap] = useState({});
  const [imageLoadingMap, setImageLoadingMap] = useState({}); // Track image loading state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState(null);
  const [imageModalIndex, setImageModalIndex] = useState(null);
  const [imageModalGallery, setImageModalGallery] = useState([]);
  const [imageCacheBuster, setImageCacheBuster] = useState(Date.now()); // Cache buster for image URLs

  // Modal states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Use the same image URL builder as the storefront (uses /api/files/... so it works on App Platform).
  const buildAssetUrl = (rawPath) => {
    const url = buildApiAssetUrl(rawPath);
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${imageCacheBuster}`;
  };

  const normalizeFeatureImages = (product) => {
    if (!product) return [];

    const collectRaw = () => {
      const candidates = [
        product.feature_images,
        product.featureImages,
        product.feature_images_json,
        product.feature_image,
        product.gallery,
        product.images,
      ].filter(Boolean);
      return candidates.length ? candidates : [];
    };

    const asArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      return [val];
    };

    const rawImages = collectRaw().flatMap(asArray);

    return rawImages
      .map((img) => {
        if (!img) return null;
        if (typeof img === 'object') {
          if (img.url) return buildAssetUrl(img.url);
          if (img.path) return buildAssetUrl(img.path);
          if (img.full_url) return buildAssetUrl(img.full_url);
        }
        return buildAssetUrl(img);
      })
      .filter(Boolean);
  };

  const getPrimaryImage = (product) => {
    const featureImages = normalizeFeatureImages(product);
    const candidate =
      product.thumbnail_image ||
      product.thumbnail ||
      product.image ||
      featureImages[0] ||
      null;
    return buildAssetUrl(candidate);
  };

  const getThumbnailOnly = (product) => {
    const candidate =
      (product && product.thumbnail_image) ||
      (product && product.thumbnail) ||
      (product && product.image) ||
      null;
    return buildAssetUrl(candidate);
  };

  const buildGallery = (product) => {
    const gallery = [
      getThumbnailOnly(product),
      ...normalizeFeatureImages(product),
    ].filter(Boolean);
    const seen = new Set();
    const unique = [];
    for (const img of gallery) {
      const key = img;
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(img);
      }
    }
    return unique;
  };

  const getFeatureIndex = (productId, length) => {
    if (!length) return 0;
    const idx = featureIndexMap[productId] ?? 0;
    return Math.min(idx, length - 1);
  };

  const cycleFeature = (productId, length, direction = 1) => {
    if (!length || length < 2) return;
    setFeatureIndexMap((prev) => {
      const current = prev[productId] ?? 0;
      const next = (current + direction + length) % length;
      return { ...prev, [productId]: next };
    });
  };

  const openImageModal = (url, event = null, gallery = null, index = 0) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!url) return;
    setImageModalUrl(url);
    setImageModalGallery(gallery || [url]);
    setImageModalIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setImageModalUrl(null);
    setImageModalGallery([]);
    setImageModalIndex(null);
  };

  const showNextImage = () => {
    if (imageModalGallery.length === 0) return;
    const nextIndex = ((imageModalIndex ?? 0) + 1) % imageModalGallery.length;
    setImageModalIndex(nextIndex);
    setImageModalUrl(imageModalGallery[nextIndex]);
  };

  const showPrevImage = () => {
    if (imageModalGallery.length === 0) return;
    const prevIndex = (imageModalIndex ?? 0) - 1;
    const finalIndex = prevIndex < 0 ? imageModalGallery.length - 1 : prevIndex;
    setImageModalIndex(finalIndex);
    setImageModalUrl(imageModalGallery[finalIndex]);
  };


  useEffect(() => {
    if (!token) return;
    fetchProducts();
    fetchCategories();
  }, [token]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, statusFilter, sortField, sortDirection]);

  // Initialize image loading states when products change
  useEffect(() => {
    if (products.length > 0) {
      const initialLoadingMap = {};
      products.forEach((product) => {
        const thumbnailUrl = getThumbnailOnly(product) || getPrimaryImage(product);
        if (thumbnailUrl) {
          initialLoadingMap[thumbnailUrl] = true;
        }
        // Also initialize feature images
        const featureImages = normalizeFeatureImages(product);
        featureImages.forEach((img) => {
          if (img) {
            initialLoadingMap[img] = true;
          }
        });
      });
      // Always merge initial loading states (set to true for all new images)
      setImageLoadingMap(prev => {
        const merged = { ...prev };
        Object.keys(initialLoadingMap).forEach(url => {
          // Only set to true if not already false (loaded)
          if (merged[url] !== false) {
            merged[url] = true;
          }
        });
        return merged;
      });
    }
  }, [products, imageCacheBuster]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Clear image loading cache when fetching products to ensure fresh images load
      setImageLoadingMap({});
      // Update cache buster to force browser to reload all images
      const newCacheBuster = Date.now();
      setImageCacheBuster(newCacheBuster);
      const response = await fetch(`${apiBaseUrl}/products?per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        // Add cache control to prevent browser from caching the API response
        cache: 'no-cache',
      });

      if (response.status === 401) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Handle paginated response - API returns { products: [...], pagination: {...} }
        let productsData = [];
        if (data.products && Array.isArray(data.products)) {
          productsData = data.products;
        } else if (data.success && data.products && Array.isArray(data.products)) {
          productsData = data.products;
        }
        
        // Debug: Log first product to check structure
        if (productsData.length > 0) {
          console.log('Fetched products, sample product:', productsData[0]);
          console.log('Sample product thumbnail:', productsData[0].thumbnail_image);
          console.log('Sample product feature_images:', productsData[0].feature_images);
          console.log('Image cache buster:', imageCacheBuster);
        }
        
        // Initialize image loading states immediately when products are fetched
        // Use the same URL builder as the storefront so it works in production.
        const buildAssetUrlWithCache = (rawPath) => {
          const url = buildApiAssetUrl(rawPath);
          if (!url) return null;
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}_t=${newCacheBuster}`;
        };
        
        const initialLoadingMap = {};
        productsData.forEach((product) => {
          const thumbnailUrl = buildAssetUrlWithCache(
            product.thumbnail_image || product.thumbnail || product.image
          );
          if (thumbnailUrl) {
            initialLoadingMap[thumbnailUrl] = true;
          }
          
          // Initialize feature images - normalize them and add cache buster
          const featureImagesRaw = [
            product.feature_images,
            product.featureImages,
            product.feature_images_json,
            product.feature_image,
            product.gallery,
            product.images,
          ].filter(Boolean);
          
          featureImagesRaw.forEach((imgRaw) => {
            if (Array.isArray(imgRaw)) {
              imgRaw.forEach(img => {
                const url = buildAssetUrlWithCache(img);
                if (url) initialLoadingMap[url] = true;
              });
            } else if (typeof imgRaw === 'string') {
              try {
                const parsed = JSON.parse(imgRaw);
                if (Array.isArray(parsed)) {
                  parsed.forEach(img => {
                    const url = buildAssetUrlWithCache(img);
                    if (url) initialLoadingMap[url] = true;
                  });
                } else {
                  const url = buildAssetUrlWithCache(imgRaw);
                  if (url) initialLoadingMap[url] = true;
                }
              } catch (e) {
                imgRaw.split(',').forEach(img => {
                  const url = buildAssetUrlWithCache(img.trim());
                  if (url) initialLoadingMap[url] = true;
                });
              }
            } else if (imgRaw && typeof imgRaw === 'object') {
              const url = buildAssetUrlWithCache(imgRaw.url || imgRaw.path || imgRaw.full_url);
              if (url) initialLoadingMap[url] = true;
            }
          });
        });
        
        setImageLoadingMap(initialLoadingMap);
        setProducts(productsData);
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Use the same endpoint as ProductCategories component
      const response = await fetch(`${apiBaseUrl}/product-categories?per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 401) {
        toast.error('Session expired. Please sign in again.');
        setCategories([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Extract category names from the categories array (same structure as ProductCategories)
        if (data.success && data.categories && Array.isArray(data.categories)) {
          const categoryNames = data.categories.map(cat => cat.name || null).filter(Boolean);
          setCategories(categoryNames);
        } else if (data.categories && Array.isArray(data.categories)) {
          // Fallback: if categories is directly an array
          const categoryNames = data.categories.map(cat => 
            typeof cat === 'string' ? cat : (cat.name || null)
          ).filter(Boolean);
          setCategories(categoryNames);
        } else {
          setCategories([]);
        }
      } else {
        console.error('Failed to fetch categories:', response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm.trim()) {
      const loweredSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((product) => {
        const fieldsToSearch = [
          product.title,
          product.subtitle,
          product.category,
          product.description,
        ].filter(Boolean);
        return fieldsToSearch.some(
          (field) =>
            typeof field === 'string' &&
            field.toLowerCase().includes(loweredSearch)
        );
      });
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    // Status filter (Active/Inactive)
    if (statusFilter) {
      if (statusFilter === 'active') {
        filtered = filtered.filter((product) => product.is_active === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((product) => product.is_active === false);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      if (!sortField) return 0;

      if (sortField === 'created_at' || sortField === 'updated_at') {
        const aDate = a[sortField] ? new Date(a[sortField]) : new Date(0);
        const bDate = b[sortField] ? new Date(b[sortField]) : new Date(0);

        if (aDate < bDate) return sortDirection === 'asc' ? -1 : 1;
        if (aDate > bDate) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortField === 'price') {
        const aValue = parseFloat(a.price || 0);
        const bValue = parseFloat(b.price || 0);
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      // Sort by on_sale (boolean)
      if (sortField === 'on_sale') {
        const aValue = a.on_sale ? 1 : 0;
        const bValue = b.on_sale ? 1 : 0;
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      const aValue = String(a[sortField] || '').toLowerCase();
      const bValue = String(b[sortField] || '').toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (actionLock) return;
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterAndSortProducts();
  };

  const handleDelete = async (id) => {
    if (actionLock) {
      toast.warning('Please wait until the current action completes');
      return;
    }

    const product = products.find(p => p.id === id);
    const result = await showAlert.confirm(
      'Delete Product',
      `Are you sure you want to delete "${product?.title || 'this product'}"? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    setActionLock(true);
    setActionLoading(id);
    showAlert.processing('Deleting Product', 'Please wait while we remove this product...');

    try {
      const response = await fetch(`${apiBaseUrl}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      showAlert.close();

      if (response.ok) {
        toast.success('Product deleted successfully');
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        const data = await response.json();
        showAlert.error('Delete Failed', data.message || 'Failed to delete product');
      }
    } catch (error) {
      showAlert.close();
      console.error('Error deleting product:', error);
      showAlert.error('Error', 'Failed to delete product');
    } finally {
      setActionLoading(null);
      setActionLock(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortField('created_at');
    setSortDirection('desc');
  };

  const hasActiveFilters = searchTerm || categoryFilter || statusFilter || sortField !== 'created_at' || sortDirection !== 'desc';

  const refreshAllData = async () => {
    if (actionLock) {
      toast.warning('Please wait until current action completes');
      return;
    }
    await fetchProducts();
    toast.info('Data refreshed successfully');
  };

  const formatCurrency = (value) => {
    return `₱${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPlainText = (value) => {
    if (!value) return '';
    return String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  };

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

  const getSortIcon = (field) => {
    if (sortField !== field) return 'fas fa-sort text-muted';
    return sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  };

  const isActionDisabled = (productId = null) => {
    return actionLock || (actionLoading && actionLoading !== productId);
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Statistics
  const statistics = {
    total: products.length,
    active: products.filter((p) => p.is_active).length,
    inactive: products.filter((p) => !p.is_active).length,
  };


  return (
    <div className={`container-fluid px-3 pt-0 pb-2 admin-dashboard-container ${!loading ? 'fadeIn' : ''}`}>
      {loading ? (
        <LoadingSpinner text="Loading products..." />
      ) : (
        <>
          {/* Page Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
        <div className="flex-grow-1 mb-2 mb-md-0">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            <FaBox className="me-2" />
            Product Management
          </h1>
          <p className="mb-0 small" style={{ color: 'var(--text-muted)' }}>
            Manage your ecommerce products
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div
            className="badge px-3 py-2 text-white"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            <i className="fas fa-box me-2"></i>
            Total Products: {loading ? '...' : products.length}
          </div>
          <button
            className="btn btn-sm btn-primary text-white"
            onClick={() => {
              setEditingProduct(null);
              setShowProductForm(true);
            }}
            disabled={isActionDisabled()}
            style={{
              transition: 'all 0.2s ease-in-out',
              borderWidth: '2px',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <i className="fas fa-plus me-1"></i>
            Add Product
          </button>
          <button
            className="btn btn-sm"
            onClick={refreshAllData}
            disabled={loading || isActionDisabled()}
            style={{
              transition: 'all 0.2s ease-in-out',
              border: '2px solid var(--primary-color)',
              color: 'var(--primary-color)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                e.target.style.backgroundColor = 'var(--primary-color)';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--primary-color)';
            }}
          >
            <i className="fas fa-sync-alt me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
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
                    style={{ color: 'var(--primary-color)' }}
                  >
                    Total Products
                  </div>
                  <div
                    className="h4 mb-0 fw-bold"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    {loading ? '...' : statistics.total}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="fas fa-box fa-2x"
                    style={{ color: 'var(--primary-light)', opacity: 0.7 }}
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
              border: '1px solid rgba(0, 0, 0, 0.125)',
              borderRadius: '0.375rem'
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div
                    className="text-xs fw-semibold text-uppercase mb-1"
                    style={{ color: 'var(--success-color)' }}
                  >
                    Active
                  </div>
                  <div
                    className="h4 mb-0 fw-bold"
                    style={{ color: 'var(--success-color)' }}
                  >
                    {loading ? '...' : statistics.active}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="fas fa-check-circle fa-2x"
                    style={{ color: '#28a745', opacity: 0.7 }}
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
              border: '1px solid rgba(0, 0, 0, 0.125)',
              borderRadius: '0.375rem'
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div
                    className="text-xs fw-semibold text-uppercase mb-1"
                    style={{ color: 'var(--danger-color)' }}
                  >
                    Inactive
                  </div>
                  <div
                    className="h4 mb-0 fw-bold"
                    style={{ color: 'var(--danger-color)' }}
                  >
                    {loading ? '...' : statistics.inactive}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="fas fa-exclamation-triangle fa-2x"
                    style={{ color: '#ffc107', opacity: 0.7 }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Out of Stock panel removed (not used) */}
      </div>

      {/* Search and Filter Controls */}
      <div
        className="card border-0 shadow-sm mb-3"
        style={{ backgroundColor: 'var(--background-white)' }}
      >
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Search Products
              </label>
              <div className="input-group input-group-sm">
                <span
                  className="input-group-text"
                  style={{
                    backgroundColor: 'var(--background-light)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title, subtitle, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading || isActionDisabled()}
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--input-text)',
                  }}
                />
                {searchTerm && (
                  <button
                    className="btn btn-sm clear-search-btn"
                    type="button"
                    onClick={() => setSearchTerm('')}
                    disabled={loading || isActionDisabled()}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Category
              </label>
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={loading || isActionDisabled()}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)',
                }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Status
              </label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={loading || isActionDisabled()}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)',
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
                style={{ color: 'var(--text-muted)' }}
              >
                Items per page
              </label>
              <select
                className="form-select form-select-sm"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                disabled={loading || isActionDisabled()}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)',
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
        style={{ backgroundColor: 'var(--background-white)' }}
      >
        <div
          className="card-header border-bottom-0 py-2"
          style={{
            background: 'var(--topbar-bg)',
            color: 'var(--topbar-text)',
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0 fw-semibold">
              <i className="fas fa-box me-2"></i>
              Products
              {!loading && (
                <small className="opacity-75 ms-2">
                  ({filteredProducts.length} found
                  {searchTerm || categoryFilter
                    ? ' after filtering'
                    : ''}
                  )
                </small>
              )}
            </h5>
          </div>
        </div>

        <div className="card-body p-0">
          {currentProducts.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i
                  className="fas fa-box fa-3x"
                  style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                ></i>
              </div>
              <h5 className="mb-2" style={{ color: 'var(--text-muted)' }}>
                {products.length === 0
                  ? 'No Products Found'
                  : 'No Matching Results'}
              </h5>
              <p className="mb-3 small" style={{ color: 'var(--text-muted)' }}>
                {products.length === 0
                  ? 'No products have been added yet.'
                  : 'Try adjusting your search criteria.'}
              </p>
              {searchTerm && (
                <button
                  className="btn btn-sm clear-search-main-btn"
                  onClick={() => setSearchTerm('')}
                  disabled={loading || isActionDisabled()}
                >
                  <i className="fas fa-times me-1"></i>
                  Clear Search
                </button>
              )}
              {products.length === 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductForm(true);
                  }}
                >
                  <FaPlus className="me-2" />
                  Add Your First Product
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Sort Controls + View Toggle */}
              <div className="px-3 py-2 border-bottom d-flex flex-wrap align-items-center gap-2 justify-content-between" style={{ backgroundColor: 'var(--background-light)' }}>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <small className="text-muted fw-semibold">Sort by:</small>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleSort('title')}
                    disabled={isActionDisabled()}
                    style={{ fontSize: '0.875rem' }}
                  >
                    Title <i className={`ms-1 ${getSortIcon('title')}`}></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleSort('category')}
                    disabled={isActionDisabled()}
                    style={{ fontSize: '0.875rem' }}
                  >
                    Category <i className={`ms-1 ${getSortIcon('category')}`}></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleSort('price')}
                    disabled={isActionDisabled()}
                    style={{ fontSize: '0.875rem' }}
                  >
                    Price <i className={`ms-1 ${getSortIcon('price')}`}></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleSort('on_sale')}
                    disabled={isActionDisabled()}
                    style={{ fontSize: '0.875rem' }}
                  >
                    On Sale <i className={`ms-1 ${getSortIcon('on_sale')}`}></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleSort('created_at')}
                    disabled={isActionDisabled()}
                    style={{ fontSize: '0.875rem' }}
                  >
                    Date <i className={`ms-1 ${getSortIcon('created_at')}`}></i>
                  </button>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <small className="text-muted fw-semibold me-1">View:</small>
                  <button
                    className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('list')}
                    disabled={isActionDisabled()}
                  >
                    List
                  </button>
                  <button
                    className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('grid')}
                    disabled={isActionDisabled()}
                  >
                    Grid
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              <div className="p-3">
                <div className="row g-3">
                  {currentProducts.map((product) => {
                    const featureImages = normalizeFeatureImages(product);
                    const featureIdx = getFeatureIndex(product.id, featureImages.length);
                    const thumbnailUrl = getThumbnailOnly(product) || getPrimaryImage(product);
                    const displayImage = thumbnailUrl;
                    
                    return viewMode === 'grid' ? (
                      <div key={product.id} className="col-6 col-md-4 col-lg-3 col-xl-2-4">
                        <div
                          className="card h-100 product-card shadow-sm border"
                          style={{
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            overflow: 'hidden',
                          }}
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDetailModal(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                            const actions = e.currentTarget.querySelector('.product-card-actions');
                            if (actions) actions.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            const actions = e.currentTarget.querySelector('.product-card-actions');
                            if (actions) actions.style.opacity = '0';
                          }}
                        >
                          {/* Product Image */}
                          <div
                            className="position-relative"
                            style={{
                              width: '100%',
                              height: '200px',
                              minHeight: '200px',
                              backgroundColor: 'var(--background-light)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {displayImage ? (
                              <img
                                  key={`${product.id}-${imageCacheBuster}-${displayImage}`}
                                  src={displayImage}
                                  alt={product.title}
                                  style={{
                                    width: 'auto',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    minHeight: '200px',
                                    objectFit: 'contain',
                                    objectPosition: 'center',
                                    transition: 'opacity 0.3s ease',
                                    opacity: imageLoadingMap[displayImage] === false ? 1 : 0,
                                    position: 'relative',
                                    zIndex: 2,
                                    display: 'block',
                                  }}
                                  onLoadStart={() => {
                                    setImageLoadingMap(prev => ({
                                      ...prev,
                                      [displayImage]: true
                                    }));
                                  }}
                                  onLoad={() => {
                                    setImageLoadingMap(prev => ({
                                      ...prev,
                                      [displayImage]: false
                                    }));
                                  }}
                                  onError={(e) => {
                                    console.error('Failed to load product image:', displayImage);
                                    setImageLoadingMap(prev => ({ ...prev, [displayImage]: false }));
                                    e.target.style.display = 'none';
                                    const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                                    if (placeholder) {
                                      placeholder.style.display = 'flex';
                                    }
                                  }}
                                />
                            ) : null}
                            <div
                              className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center image-placeholder"
                              style={{
                                display: displayImage ? 'none' : 'flex',
                                backgroundColor: 'var(--background-light)',
                                top: 0,
                                left: 0,
                                zIndex: 0,
                              }}
                            >
                              <i
                                className="fas fa-image fa-3x"
                                style={{ color: 'var(--text-muted)', opacity: 0.3 }}
                              ></i>
                            </div>

                            
                            {/* Status Badge Overlay */}
                            <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}>
                              <span
                                className={`badge ${
                                  product.is_active ? 'bg-success' : 'bg-secondary'
                                }`}
                                style={{ fontSize: '0.75rem' }}
                              >
                                {product.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            {/* Sale Badge */}
                            {product.on_sale && (
                              <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 10 }}>
                                <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>
                                  Sale
                                </span>
                              </div>
                            )}

                            {/* Action Buttons Overlay */}
                            <div
                              className="position-absolute bottom-0 end-0 m-2 d-flex gap-1 product-card-actions"
                              style={{ opacity: 0, transition: 'opacity 0.3s ease', zIndex: 10 }}
                            >
                              <button
                                className="btn btn-warning btn-sm text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduct(product);
                                  setShowProductForm(true);
                                }}
                                disabled={isActionDisabled(product.id)}
                                title="Edit Product"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {actionLoading === product.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <i className="fas fa-edit" style={{ fontSize: '0.75rem' }}></i>
                                )}
                              </button>
                              <button
                                className="btn btn-danger btn-sm text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(product.id);
                                }}
                                disabled={isActionDisabled(product.id)}
                                title="Delete Product"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {actionLoading === product.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <i className="fas fa-trash" style={{ fontSize: '0.75rem' }}></i>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="card-body p-3">
                            <h6
                              className="card-title fw-semibold mb-2"
                              style={{
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem',
                                lineHeight: '1.3em',
                                minHeight: '2.6em',
                                maxHeight: '2.6em',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-word',
                              }}
                              title={product.title}
                            >
                              {product.title}
                            </h6>

                            {/* Category */}
                            {product.category && (
                              <div className="mb-2">
                                <span className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>
                                  {product.category}
                                </span>
                              </div>
                            )}

                            {/* Price */}
                            <div className="mb-2">
                              {product.on_sale && product.old_price && (
                                <div
                                  className="text-decoration-line-through text-muted"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {formatCurrency(product.old_price)}
                                </div>
                              )}
                              <div
                                className="fw-bold"
                                style={{
                                  color: 'var(--primary-color)',
                                  fontSize: '1.1rem',
                                }}
                              >
                                {formatCurrency(product.price)}
                              </div>
                            </div>

                            {/* Subtitle Preview (render HTML from subtitle) */}
                            {product.subtitle && (
                              <div
                                className="small text-muted"
                                style={{
                                  fontSize: '0.75rem',
                                  minHeight: '2.25em',
                                  maxHeight: '2.25em',
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  textOverflow: 'ellipsis',
                                  lineHeight: '1.125em',
                                  wordBreak: 'break-word',
                                }}
                                title={product.subtitle.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}
                                dangerouslySetInnerHTML={{ __html: product.subtitle }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={product.id} className="col-12">
                        <div className="card product-card shadow-sm border h-100 p-3" style={{ transition: 'all 0.3s ease' }}>
                          <div className="d-flex flex-column flex-md-row gap-3 align-items-start">
                            {/* Image Container */}
                            <div className="flex-shrink-0" style={{ width: '200px', maxWidth: '100%' }}>
                              {/* Thumbnail Image */}
                              <div
                                className="position-relative mb-2"
                                style={{ width: '100%', height: '160px', backgroundColor: 'var(--background-light)', overflow: 'hidden', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const gallery = buildGallery(product);
                                  const featureIdx = getFeatureIndex(product.id, gallery.length);
                                  const heroImage = gallery.length > 0 ? gallery[featureIdx] : thumbnailUrl;
                                  openImageModal(heroImage, e, gallery, featureIdx);
                                }}
                              >
                                {(() => {
                                  const gallery = buildGallery(product);
                                  const featureIdx = getFeatureIndex(product.id, gallery.length);
                                  const heroImage = gallery.length > 0 ? gallery[featureIdx] : thumbnailUrl;
                                  return heroImage ? (
                                    <img
                                        key={`${product.id}-list-${imageCacheBuster}-${heroImage}`}
                                        src={heroImage}
                                        alt={product.title}
                                        className="w-100 h-100"
                                        style={{
                                          objectFit: 'cover',
                                          transition: 'opacity 0.3s ease',
                                          opacity: imageLoadingMap[heroImage] === false ? 1 : 0,
                                          position: 'relative',
                                          zIndex: 2,
                                        }}
                                        onLoadStart={() => {
                                          setImageLoadingMap(prev => ({
                                            ...prev,
                                            [heroImage]: true
                                          }));
                                        }}
                                        onLoad={() => {
                                          setImageLoadingMap(prev => ({
                                            ...prev,
                                            [heroImage]: false
                                          }));
                                        }}
                                        onError={(e) => {
                                          setImageLoadingMap(prev => ({ ...prev, [heroImage]: false }));
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                  ) : (
                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                      <FaBox className="text-muted" size={32} />
                                    </div>
                                  );
                                })()}
                                <div className="position-absolute top-0 end-0 m-2 d-flex gap-1" style={{ zIndex: 10 }}>
                                  <span className={`badge ${product.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                                    {product.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                  {product.on_sale && (
                                    <span className="badge bg-danger" style={{ fontSize: '0.7rem' }}>
                                      Sale
                                    </span>
                                  )}
                                </div>
                                {(() => {
                                  const gallery = buildGallery(product);
                                  if (gallery.length < 2) return null;
                                  const featureIdx = getFeatureIndex(product.id, gallery.length);
                                  return (
                                    <div
                                      className="position-absolute top-50 start-0 end-0 px-2 d-flex justify-content-between align-items-center"
                                      style={{ transform: 'translateY(-50%)', zIndex: 10 }}
                                    >
                                      <button
                                        type="button"
                                        className="hero-nav-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cycleFeature(product.id, gallery.length, -1);
                                        }}
                                      >
                                        <FaChevronLeft />
                                      </button>
                                      <div className="hero-nav-indicator">
                                        {featureIdx + 1}/{gallery.length}
                                      </div>
                                      <button
                                        type="button"
                                        className="hero-nav-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cycleFeature(product.id, gallery.length, 1);
                                        }}
                                      >
                                        <FaChevronRight />
                                      </button>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Feature Images Strip Below Thumbnail */}
                              {featureImages.length > 0 && (
                                <div
                                  className="d-flex justify-content-center gap-2 flex-wrap p-2 rounded"
                                  style={{ background: 'var(--background-light)', border: '1px solid var(--input-border)' }}
                                >
                                  {featureImages.slice(0, 6).map((img, idx) => {
                                    const gallery = buildGallery(product);
                                    const galleryIndex = gallery.findIndex(g => g === img);
                                    const featureIdx = getFeatureIndex(product.id, gallery.length);
                                    const isActive = galleryIndex >= 0 && galleryIndex === featureIdx;
                                    return (
                                      <div
                                        key={`${product.id}-list-feature-${idx}-${imageCacheBuster}`}
                                        style={{
                                          width: '48px',
                                          height: '48px',
                                          borderRadius: '6px',
                                          overflow: 'hidden',
                                          border: isActive ? '3px solid var(--primary-color)' : '1px solid var(--input-border)',
                                          backgroundColor: '#fff',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          boxShadow: isActive ? '0 0 0 3px rgba(0, 123, 255, 0.25)' : 'none',
                                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                          position: 'relative',
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Update the feature index to show this image
                                          if (galleryIndex >= 0) {
                                            cycleFeature(product.id, gallery.length, galleryIndex - featureIdx);
                                          } else {
                                            openImageModal(img, e, gallery, idx + 1);
                                          }
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isActive) {
                                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                                            e.currentTarget.style.opacity = '0.8';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isActive) {
                                            e.currentTarget.style.borderColor = 'var(--input-border)';
                                            e.currentTarget.style.opacity = '1';
                                          }
                                        }}
                                      >
                                        {isActive && (
                                          <div
                                            style={{
                                              position: 'absolute',
                                              top: '2px',
                                              right: '2px',
                                              width: '10px',
                                              height: '10px',
                                              borderRadius: '50%',
                                              backgroundColor: 'var(--primary-color)',
                                              border: '2px solid #fff',
                                              zIndex: 10,
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            }}
                                          />
                                        )}
                                        <img
                                          key={`${product.id}-list-feature-img-${idx}-${imageCacheBuster}-${img}`}
                                          src={img}
                                          alt={`feature-${idx}`}
                                          className="w-100 h-100"
                                          style={{ objectFit: 'cover' }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-grow-1 w-100">
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
                                <div>
                                  <h6 className="mb-1 fw-semibold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                                    {product.title || 'Untitled product'}
                                  </h6>
                                  <div className="d-flex flex-wrap gap-2">
                                    {product.category && (
                                      <span className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>
                                        {product.category}
                                      </span>
                                    )}
                                    {product.sku && (
                                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.75rem' }}>
                                        SKU: {product.sku}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-warning btn-sm text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingProduct(product);
                                      setShowProductForm(true);
                                    }}
                                    disabled={isActionDisabled(product.id)}
                                    title="Edit Product"
                                  >
                                    {actionLoading === product.id ? (
                                      <span className="spinner-border spinner-border-sm" role="status"></span>
                                    ) : (
                                      <FaEdit />
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(product.id);
                                    }}
                                    disabled={isActionDisabled(product.id)}
                                    title="Delete Product"
                                  >
                                    {actionLoading === product.id ? (
                                      <span className="spinner-border spinner-border-sm" role="status"></span>
                                    ) : (
                                      <FaTrash />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
                                <div>
                                  <div className="text-muted small">Price</div>
                                  <div className="fw-bold" style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                                    {formatCurrency(product.price)}
                                  </div>
                                </div>
                                {product.old_price && (
                                  <div>
                                    <div className="text-muted small">Old price</div>
                                    <div className="text-decoration-line-through text-muted">
                                      {formatCurrency(product.old_price)}
                                    </div>
                                  </div>
                                )}
                                {(product.stock ?? product.quantity) !== undefined && (
                                  <div>
                                    <div className="text-muted small">Stock</div>
                                    <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
                                      {product.stock ?? product.quantity}
                                    </div>
                                  </div>
                                )}
                                {product.created_at && (
                                  <div>
                                    <div className="text-muted small">Created</div>
                                    <div className="small text-muted">{formatDateTime(product.created_at)}</div>
                                  </div>
                                )}
                              </div>

                              {product.subtitle && (
                                <div className="mb-2">
                                  <div className="text-muted small mb-1">Subtitle</div>
                                  <div
                                    className="small text-muted"
                                    dangerouslySetInnerHTML={{ __html: product.subtitle }}
                                  />
                                </div>
                              )}

                              <div>
                                <div className="text-muted small mb-1">Description</div>
                                {product.description ? (
                                  <div className="small" style={{ color: 'var(--text-secondary)' }}>
                                    {getPlainText(product.description).slice(0, 260)}
                                    {getPlainText(product.description).length > 260 ? '…' : ''}
                                  </div>
                                ) : (
                                  <div className="text-muted small">No description provided.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="card-footer bg-white border-top px-3 py-2">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                    <div className="text-center text-md-start">
                      <small style={{ color: 'var(--text-muted)' }}>
                        Showing{' '}
                        <span
                          className="fw-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {startIndex + 1}-
                          {Math.min(endIndex, filteredProducts.length)}
                        </span>{' '}
                        of{' '}
                        <span
                          className="fw-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {filteredProducts.length}
                        </span>{' '}
                        products
                      </small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1 || isActionDisabled()}
                        style={{
                          transition: 'all 0.2s ease-in-out',
                          border: '2px solid var(--primary-color)',
                          color: 'var(--primary-color)',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow =
                              '0 2px 4px rgba(0,0,0,0.1)';
                            e.target.style.backgroundColor = 'var(--primary-color)';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--primary-color)';
                        }}
                      >
                        <i className="fas fa-chevron-left me-1"></i>
                        Previous
                      </button>

                      <div className="d-none d-md-flex gap-1">
                        {(() => {
                          let pages = [];
                          const maxVisiblePages = 5;

                          if (totalPages <= maxVisiblePages) {
                            pages = Array.from(
                              { length: totalPages },
                              (_, i) => i + 1
                            );
                          } else {
                            pages.push(1);
                            let start = Math.max(2, currentPage - 1);
                            let end = Math.min(
                              totalPages - 1,
                              currentPage + 1
                            );

                            if (currentPage <= 2) {
                              end = 4;
                            } else if (currentPage >= totalPages - 1) {
                              start = totalPages - 3;
                            }

                            if (start > 2) {
                              pages.push('...');
                            }

                            for (let i = start; i <= end; i++) {
                              pages.push(i);
                            }

                            if (end < totalPages - 1) {
                              pages.push('...');
                            }

                            if (totalPages > 1) {
                              pages.push(totalPages);
                            }
                          }

                          return pages.map((page, index) => (
                            <button
                              key={index}
                              className="btn btn-sm"
                              onClick={() =>
                                page !== '...' && setCurrentPage(page)
                              }
                              disabled={page === '...' || isActionDisabled()}
                              style={{
                                transition: 'all 0.2s ease-in-out',
                                border: `2px solid ${
                                  currentPage === page
                                    ? 'var(--primary-color)'
                                    : 'var(--input-border)'
                                }`,
                                color:
                                  currentPage === page
                                    ? 'white'
                                    : 'var(--text-primary)',
                                backgroundColor:
                                  currentPage === page
                                    ? 'var(--primary-color)'
                                    : 'transparent',
                                minWidth: '40px',
                              }}
                              onMouseEnter={(e) => {
                                if (
                                  !e.target.disabled &&
                                  currentPage !== page
                                ) {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow =
                                    '0 2px 4px rgba(0,0,0,0.1)';
                                  e.target.style.backgroundColor =
                                    'var(--primary-light)';
                                  e.target.style.color = 'var(--text-primary)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (
                                  !e.target.disabled &&
                                  currentPage !== page
                                ) {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = 'none';
                                  e.target.style.backgroundColor =
                                    'transparent';
                                  e.target.style.color = 'var(--text-primary)';
                                }
                              }}
                            >
                              {page}
                            </button>
                          ));
                        })()}
                      </div>

                      <div className="d-md-none">
                        <small style={{ color: 'var(--text-muted)' }}>
                          Page {currentPage} of {totalPages}
                        </small>
                      </div>

                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={
                          currentPage === totalPages || isActionDisabled()
                        }
                        style={{
                          transition: 'all 0.2s ease-in-out',
                          border: '2px solid var(--primary-color)',
                          color: 'var(--primary-color)',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow =
                              '0 2px 4px rgba(0,0,0,0.1)';
                            e.target.style.backgroundColor =
                              'var(--primary-color)';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--primary-color)';
                        }}
                      >
                        Next
                        <i className="fas fa-chevron-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && showDetailModal && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailModal(false);
            setTimeout(() => setSelectedProduct(null), 250);
          }}
          buildGallery={buildGallery}
          getFeatureIndex={getFeatureIndex}
          cycleFeature={cycleFeature}
          openImageModal={openImageModal}
          formatCurrency={formatCurrency}
          formatDateTime={formatDateTime}
          normalizeFeatureImages={normalizeFeatureImages}
          getPrimaryImage={getPrimaryImage}
          getThumbnailOnly={getThumbnailOnly}
          featureIndexMap={featureIndexMap}
          setFeatureIndexMap={setFeatureIndexMap}
        />
      )}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSave={async (savedProduct) => {
            // Always refetch to ensure UI matches DB (rich text, images, etc.)
            // Clear image loading cache and update cache buster to force reload of updated images
            setImageLoadingMap({});
            const newCacheBuster = Date.now();
            setImageCacheBuster(newCacheBuster);
            
            // Immediately update the product in state if we have the saved product data
            if (savedProduct && savedProduct.id) {
              setProducts(prevProducts => {
                const updated = prevProducts.map(p => 
                  p.id === savedProduct.id ? { ...savedProduct } : p
                );
                // If product not found, add it (for new products)
                if (!updated.find(p => p.id === savedProduct.id)) {
                  return [...updated, savedProduct];
                }
                return updated;
              });
            }
            
            // Close modal first
            setShowProductForm(false);
            setEditingProduct(null);
            // Then fetch products with a small delay to ensure backend has processed the update
            await new Promise(resolve => setTimeout(resolve, 300));
            await fetchProducts();
          }}
          token={token}
        />
      )}

      {/* Toast Container */}
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

      {/* Image Lightbox Component */}
      <ImageLightbox
        isOpen={showImageModal}
        imageUrl={imageModalUrl}
        imageGallery={imageModalGallery}
        currentIndex={imageModalIndex ?? 0}
        onClose={closeImageModal}
        onNext={showNextImage}
        onPrev={showPrevImage}
      />
        </>
      )}
    </div>
  );
};

export default ProductList;
