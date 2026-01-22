import React, { useState, useEffect, useRef } from 'react';
import Portal from '../../components/Portal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { showAlert } from '../../services/notificationService';
import { FaPlus, FaTrash, FaChevronUp, FaChevronDown, FaSearch, FaTimes, FaImage } from 'react-icons/fa';
import { getProductImage } from '../../utils/productImageUtils';

const CollectionFormModal = ({ collection, onClose, onSave, token, existingCollections = [] }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [swalShown, setSwalShown] = useState(false);
  
  // Product management states
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showAddProducts, setShowAddProducts] = useState(false);
  const [collectionProducts, setCollectionProducts] = useState([]);
  const [removingProductIds, setRemovingProductIds] = useState([]);
  
  const isEdit = !!collection;
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const initialFormState = useRef({});
  const searchInputRef = useRef(null);
  const productsContainerRef = useRef(null);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (collection) {
      const collectionFormState = {
        name: collection.name || '',
        description: collection.description || '',
        display_order: collection.display_order || 0,
        is_active: collection.is_active !== undefined ? collection.is_active : true,
      };
      setFormData(collectionFormState);
      initialFormState.current = { ...collectionFormState };
      // Fetch collection products
      if (collection.id) {
        const fetchProducts = async () => {
          try {
            setProductsLoading(true);
            const response = await fetch(`${apiBaseUrl}/product-collections/${collection.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.collection) {
                const products = data.collection.products || [];
                setCollectionProducts(products);
                setSelectedProductIds(products.map(p => p.id));
                console.log(`Loaded ${products.length} products for collection ${collection.id}`, products);
              } else {
                console.error('Invalid response structure:', data);
              }
            } else {
              console.error('Failed to fetch collection products:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Error fetching collection products:', error);
          } finally {
            setProductsLoading(false);
          }
        };
        fetchProducts();
      }
    } else {
      const defaultState = {
        name: '',
        description: '',
        display_order: 0,
        is_active: true,
      };
      setFormData(defaultState);
      initialFormState.current = { ...defaultState };
      setCollectionProducts([]);
      setSelectedProductIds([]);
    }
  }, [collection?.id, apiBaseUrl, token]);

  const fetchAllProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch(`${apiBaseUrl}/products?per_page=1000&is_active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setAllProducts(data.products);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCollectionProducts = async () => {
    if (!collection?.id) {
      console.warn('Cannot fetch collection products: collection.id is missing');
      return;
    }
    try {
      setProductsLoading(true);
      const response = await fetch(`${apiBaseUrl}/product-collections/${collection.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.collection) {
          const products = data.collection.products || [];
          setCollectionProducts(products);
          setSelectedProductIds(products.map(p => p.id));
          console.log(`Loaded ${products.length} products for collection ${collection.id}`);
        } else {
          console.error('Invalid response structure:', data);
        }
      } else {
        console.error('Failed to fetch collection products:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching collection products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Check if form has unsaved changes
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormState.current);
    setHasUnsavedChanges(formChanged);
  }, [formData]);

  // Handle scroll and focus when products section is shown
  useEffect(() => {
    if (showAddProducts && searchInputRef.current) {
      // Wait for animation to complete (0.4s transition)
      const timer = setTimeout(() => {
        if (searchInputRef.current && productsContainerRef.current) {
          // Check if container is visible
          const container = productsContainerRef.current;
          const computedStyle = window.getComputedStyle(container);
          const isVisible = computedStyle.opacity !== '0' && computedStyle.maxHeight !== '0px';
          
          if (isVisible) {
            // Scroll to search input
            searchInputRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            
            // Focus after scroll animation starts
            setTimeout(() => {
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }, 300);
          }
        }
      }, 500); // Wait for animation to complete
      
      return () => clearTimeout(timer);
    }
  }, [showAddProducts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value);
    
    const updatedFormData = {
      ...formData,
      [name]: newValue,
    };
    
    setFormData(updatedFormData);

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Real-time validation for duplicates
    if (name === 'name' || name === 'display_order') {
      const validationErrors = {};
      if (name === 'name' && newValue.trim()) {
        const duplicateName = existingCollections.find(
          c => c.id !== (collection?.id || null) && 
          c.name.toLowerCase().trim() === newValue.toLowerCase().trim()
        );
        if (duplicateName) {
          validationErrors.name = 'A collection with this name already exists';
        }
      }
      if (name === 'display_order' && newValue !== null && newValue !== undefined && newValue !== '') {
        const duplicateOrder = existingCollections.find(
          c => c.id !== (collection?.id || null) && 
          c.display_order !== null && 
          c.display_order !== undefined &&
          c.display_order === newValue
        );
        if (duplicateOrder) {
          validationErrors.display_order = `Display order ${newValue} is already used by "${duplicateOrder.name}"`;
        }
      }
      if (Object.keys(validationErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...validationErrors }));
      } else if (name === 'name' || name === 'display_order') {
        // Clear the error if no duplicate found
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    } else {
      // Check for duplicate name (case-insensitive)
      const duplicateName = existingCollections.find(
        c => c.id !== (collection?.id || null) && 
        c.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
      );
      if (duplicateName) {
        newErrors.name = 'A collection with this name already exists';
      }
    }

    // Check for duplicate display_order (allow null/undefined/empty, but check if value is provided)
    if (formData.display_order !== null && formData.display_order !== undefined && formData.display_order !== '') {
      const duplicateOrder = existingCollections.find(
        c => c.id !== (collection?.id || null) && 
        c.display_order !== null && 
        c.display_order !== undefined &&
        c.display_order === formData.display_order
      );
      if (duplicateOrder) {
        newErrors.display_order = `Display order ${formData.display_order} is already used by "${duplicateOrder.name}"`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Product management handlers
  const handleAddProduct = (productId) => {
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId]);
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        setCollectionProducts([...collectionProducts, product]);
      }
    }
  };

  const handleRemoveProduct = (productId) => {
    // Add to removing list to trigger exit animation
    setRemovingProductIds([...removingProductIds, productId]);
    
    // Wait for animation to complete (400ms) before actually removing
    setTimeout(() => {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
      setCollectionProducts(collectionProducts.filter(p => p.id !== productId));
      setRemovingProductIds(removingProductIds.filter(id => id !== productId));
    }, 400);
  };

  const handleMoveProduct = (productId, direction) => {
    const currentIndex = collectionProducts.findIndex(p => p.id === productId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= collectionProducts.length) return;

    const items = [...collectionProducts];
    [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
    setCollectionProducts(items);
  };

  const handleToggleShowProducts = () => {
    setShowAddProducts(!showAddProducts);
    // Scroll and focus will be handled by useEffect when showAddProducts changes
  };

  const availableProducts = allProducts.filter(product => 
    !selectedProductIds.includes(product.id)
  );

  const filteredAvailableProducts = availableProducts.filter(product =>
    product.title.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    showAlert.loading('Saving collection...');

    try {
      const url = isEdit
        ? `${apiBaseUrl}/product-collections/${collection.id}`
        : `${apiBaseUrl}/product-collections`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const collectionId = data.collection?.id || collection.id;
        
        // Update products if collection was created/updated successfully
        if (collectionId) {
          // Get current products in collection (for edit mode)
          let currentProductIds = [];
          if (isEdit) {
            try {
              const currentResponse = await fetch(`${apiBaseUrl}/product-collections/${collectionId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                },
              });
              if (currentResponse.ok) {
                const currentData = await currentResponse.json();
                if (currentData.success && currentData.collection?.products) {
                  currentProductIds = currentData.collection.products.map(p => p.id);
                }
              }
            } catch (error) {
              console.error('Error fetching current products:', error);
            }
          }

          // Determine products to add and remove
          const productsToAdd = selectedProductIds.filter(id => !currentProductIds.includes(id));
          const productsToRemove = currentProductIds.filter(id => !selectedProductIds.includes(id));

          // Remove products first
          if (productsToRemove.length > 0) {
            await fetch(`${apiBaseUrl}/product-collections/${collectionId}/products`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({ product_ids: productsToRemove }),
            });
          }

          // Add new products
          if (productsToAdd.length > 0) {
            await fetch(`${apiBaseUrl}/product-collections/${collectionId}/products`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({ product_ids: productsToAdd }),
            });
          }

          // Update product order
          if (collectionProducts.length > 0 && selectedProductIds.length > 0) {
            const productOrders = collectionProducts.map((product, index) => ({
              product_id: product.id,
              display_order: index,
            }));
            await fetch(`${apiBaseUrl}/product-collections/${collectionId}/products/order`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({ product_orders: productOrders }),
            });
          }
        }

        showAlert.close();
        toast.success(`Collection ${isEdit ? 'updated' : 'created'} successfully`);
        onSave();
      } else {
        showAlert.close();
        const errorMessage = data.message || data.errors
          ? Object.values(data.errors || {}).flat().join(', ')
          : `Failed to ${isEdit ? 'update' : 'create'} collection`;
        toast.error(errorMessage);
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      showAlert.close();
      console.error('Error saving collection:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} collection`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget && !loading) {
      await handleCloseAttempt();
    }
  };

  const handleEscapeKey = async (e) => {
    if (e.key === 'Escape' && !loading) {
      e.preventDefault();
      await handleCloseAttempt();
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
  }, [loading, hasUnsavedChanges]);

  return (
    <Portal>
      <div
        ref={modalRef}
        className={`modal fade show d-block modal-backdrop-animation ${isClosing ? 'exit' : ''}`}
        style={{ 
          backgroundColor: swalShown ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
          transition: 'background-color 0.2s ease',
          zIndex: 9999,
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
        <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 10000 }}>
          <div
            ref={contentRef}
            className={`modal-content border-0 modal-content-animation ${isClosing ? 'exit' : ''}`}
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 10000,
            }}
          >
            <style>{`
              @keyframes pulse {
                0%, 100% {
                  transform: scale(1);
                  opacity: 1;
                  box-shadow: 0 0 8px rgba(74, 144, 226, 0.6);
                }
                50% {
                  transform: scale(1.3);
                  opacity: 0.7;
                  box-shadow: 0 0 16px rgba(74, 144, 226, 0.9);
                }
              }
              @keyframes bounce {
                0%, 80%, 100% {
                  transform: translateY(0) scale(1);
                  opacity: 0.7;
                }
                40% {
                  transform: translateY(-20px) scale(1.1);
                  opacity: 1;
                }
              }
              @keyframes fadeInOut {
                0%, 100% {
                  opacity: 0.6;
                }
                50% {
                  opacity: 1;
                }
              }
              @keyframes skeletonPulse {
                0%, 100% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.5;
                }
              }
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              @keyframes slideOut {
                0% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                  max-height: 200px;
                  margin-bottom: 0.5rem;
                  padding: 1rem;
                }
                50% {
                  opacity: 0.5;
                  transform: translateY(-10px) scale(0.95);
                }
                100% {
                  opacity: 0;
                  transform: translateY(-20px) scale(0.9);
                  max-height: 0;
                  margin-bottom: 0;
                  padding: 0 1rem;
                  border-width: 0;
                }
              }
              .product-item.removing {
                animation: slideOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                pointer-events: none;
              }
              .move-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background-color: transparent !important;
                border-color: #6c757d !important;
                color: #6c757d !important;
              }
              .move-btn:disabled:hover {
                background-color: transparent !important;
                border-color: #6c757d !important;
                color: #6c757d !important;
              }
              .btn-outline-danger:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background-color: transparent !important;
                border-color: #dc3545 !important;
                color: #dc3545 !important;
              }
              .btn-outline-danger:disabled:hover {
                background-color: transparent !important;
                border-color: #dc3545 !important;
                color: #dc3545 !important;
              }
              .product-image-container {
                width: 50px !important;
                height: 50px !important;
                min-width: 50px !important;
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              .product-image-container img {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              @media (min-width: 768px) {
                .product-image-container {
                  width: 60px !important;
                  height: 60px !important;
                  min-width: 60px !important;
                }
              }
              @media (max-width: 767px) {
                .product-item {
                  flex-wrap: nowrap !important;
                  padding: 0.75rem !important;
                }
                .product-item .product-image-container {
                  width: 50px !important;
                  height: 50px !important;
                  min-width: 50px !important;
                  flex-shrink: 0 !important;
                  display: flex !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                }
                .product-item .product-image-container img {
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  width: 100% !important;
                  height: 100% !important;
                }
                .product-item .flex-grow-1 {
                  min-width: 0;
                  max-width: calc(100% - 150px);
                  flex: 1 1 auto;
                }
                .product-item .move-btn,
                .product-item .btn-outline-danger {
                  padding: 0.25rem !important;
                  min-width: 28px;
                  width: 28px;
                  height: 28px;
                }
                .product-item .d-flex.flex-column {
                  gap: 0.25rem !important;
                }
                /* Add Products list responsive */
                .add-product-item {
                  flex-wrap: nowrap !important;
                }
                .add-product-item .product-image-container {
                  width: 50px !important;
                  height: 50px !important;
                  min-width: 50px !important;
                  flex-shrink: 0 !important;
                  display: flex !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                }
                .add-product-item .product-image-container img {
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  width: 100% !important;
                  height: 100% !important;
                }
                .add-product-item .flex-grow-1 {
                  min-width: 0;
                  max-width: calc(100% - 70px);
                  flex: 1 1 auto;
                }
              }
              @media (min-width: 768px) {
                .add-product-item {
                  padding: 1rem !important;
                }
              }
            `}</style>
            {/* Header */}
            <div
              className="modal-header border-0 text-white modal-smooth"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <h5 className="modal-title fw-bold">
                <i className={`fas ${isEdit ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                {isEdit ? 'Edit Collection' : 'Create New Collection'}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white btn-smooth"
                onClick={handleCloseButtonClick}
                aria-label="Close"
                disabled={loading}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Modal Body */}
              <div
                className="modal-body modal-smooth"
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  backgroundColor: '#f8f9fa',
                  width: '100%',
                  maxWidth: '100%'
                }}
              >
                {/* Basic Information Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-info-circle me-2"></i>Basic Information
                  </h6>
                  <div className="row g-3">
                    {/* Name */}
                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Collection Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control modal-smooth ${errors.name ? 'is-invalid' : ''}`}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="e.g., Featured Products, Summer Sale"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.name && (
                        <div className="invalid-feedback">{errors.name}</div>
                      )}
                      <small className="text-muted">A unique name for this collection.</small>
                    </div>

                    {/* Description */}
                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Description
                      </label>
                      <textarea
                        className={`form-control modal-smooth ${errors.description ? 'is-invalid' : ''}`}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        rows={4}
                        placeholder="Describe this collection (optional)"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.description && (
                        <div className="invalid-feedback">{errors.description}</div>
                      )}
                      <small className="text-muted">Optional description for this collection.</small>
                    </div>
                  </div>
                </div>

                {/* Display Settings Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-cog me-2"></i>Display Settings
                  </h6>
                  <div className="row g-3">
                    {/* Display Order */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        className={`form-control modal-smooth ${errors.display_order ? 'is-invalid' : ''}`}
                        name="display_order"
                        value={formData.display_order}
                        onChange={handleChange}
                        disabled={loading}
                        min="0"
                        placeholder="0"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.display_order && (
                        <div className="invalid-feedback">{errors.display_order}</div>
                      )}
                      <small className="text-muted">Lower numbers appear first. Each collection must have a unique display order.</small>
                    </div>

                    {/* Active Status */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Status
                      </label>
                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_active"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active <small className="text-muted">(Collection will be visible on website)</small>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Management Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-box me-2"></i>Products in Collection
                  </h6>
                  
                  {/* Selected Products List */}
                  {collectionProducts.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark mb-2">
                        Selected Products ({collectionProducts.length})
                      </label>
                      <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {collectionProducts.map((product, index) => {
                          const isRemoving = removingProductIds.includes(product.id);
                          return (
                          <div
                            key={product.id}
                            className={`d-flex align-items-center gap-2 gap-md-3 p-2 p-md-3 mb-2 rounded product-item ${isRemoving ? 'removing' : ''}`}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: '#fff',
                              border: '1px solid #e9ecef',
                              transition: isRemoving ? 'all 0.3s ease-in forwards' : 'all 0.3s ease-in-out',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                              animation: isRemoving ? 'slideOut 0.3s ease-in forwards' : 'slideIn 0.3s ease-out',
                              minWidth: 0,
                              width: '100%'
                            }}
                            onMouseEnter={(e) => {
                              if (!isRemoving) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isRemoving) {
                                e.currentTarget.style.backgroundColor = '#fff';
                                e.currentTarget.style.borderColor = '#e9ecef';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            {/* Product Image */}
                            <div
                              className="d-flex align-items-center justify-content-center rounded overflow-hidden product-image-container"
                              style={{
                                width: '50px',
                                height: '50px',
                                minWidth: '50px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                transition: 'all 0.2s ease-in-out',
                                position: 'relative',
                                flexShrink: 0
                              }}
                            >
                              {getProductImage(product) ? (
                                <img
                                  src={getProductImage(product)}
                                  alt={product.title}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.2s ease-in-out',
                                    display: 'block',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className="d-flex align-items-center justify-content-center"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: getProductImage(product) ? 'none' : 'flex',
                                  color: '#adb5bd',
                                  fontSize: '1.5rem'
                                }}
                              >
                                <FaImage />
                              </div>
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-grow-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                              <div 
                                className="fw-semibold mb-1"
                                style={{
                                  fontSize: '0.875rem',
                                  color: '#212529',
                                  lineHeight: '1.4',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={product.title}
                              >
                                {product.title}
                              </div>
                              {product.category && (
                                <span 
                                  className="badge d-inline-block"
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.2rem 0.4rem',
                                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                    color: 'var(--primary-color)',
                                    fontWeight: '500',
                                    borderRadius: '12px',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={product.category}
                                >
                                  {product.category}
                                </span>
                              )}
                            </div>
                            
                            {/* Move Buttons */}
                            <div className="d-flex flex-column gap-1" style={{ flexShrink: 0 }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary p-1 move-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleMoveProduct(product.id, 'up');
                                }}
                                disabled={loading || index === 0 || isRemoving}
                                title="Move Up"
                                style={{ 
                                  fontSize: '0.7rem', 
                                  lineHeight: 1,
                                  transition: 'all 0.2s ease-in-out',
                                  backgroundColor: 'transparent',
                                  borderColor: '#6c757d',
                                  color: '#6c757d'
                                }}
                                onMouseEnter={(e) => {
                                  const btn = e.currentTarget;
                                  if (!loading && index !== 0 && !isRemoving && !btn.disabled) {
                                    btn.style.backgroundColor = 'var(--primary-color)';
                                    btn.style.borderColor = 'var(--primary-color)';
                                    btn.style.color = '#fff';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  const btn = e.currentTarget;
                                  btn.style.backgroundColor = 'transparent';
                                  btn.style.borderColor = '#6c757d';
                                  btn.style.color = '#6c757d';
                                }}
                              >
                                <FaChevronUp />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary p-1 move-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleMoveProduct(product.id, 'down');
                                }}
                                disabled={loading || index === collectionProducts.length - 1 || isRemoving}
                                title="Move Down"
                                style={{ 
                                  fontSize: '0.7rem', 
                                  lineHeight: 1,
                                  transition: 'all 0.2s ease-in-out',
                                  backgroundColor: 'transparent',
                                  borderColor: '#6c757d',
                                  color: '#6c757d'
                                }}
                                onMouseEnter={(e) => {
                                  const btn = e.currentTarget;
                                  if (!loading && index !== collectionProducts.length - 1 && !isRemoving && !btn.disabled) {
                                    btn.style.backgroundColor = 'var(--primary-color)';
                                    btn.style.borderColor = 'var(--primary-color)';
                                    btn.style.color = '#fff';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  const btn = e.currentTarget;
                                  btn.style.backgroundColor = 'transparent';
                                  btn.style.borderColor = '#6c757d';
                                  btn.style.color = '#6c757d';
                                }}
                              >
                                <FaChevronDown />
                              </button>
                            </div>
                            
                            {/* Remove Button */}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (!isRemoving) {
                                  handleRemoveProduct(product.id);
                                }
                              }}
                              disabled={loading || isRemoving}
                              title="Remove"
                              style={{
                                fontSize: '0.7rem',
                                lineHeight: 1,
                                transition: 'all 0.2s ease-in-out',
                                backgroundColor: 'transparent',
                                borderColor: '#dc3545',
                                color: '#dc3545',
                                opacity: isRemoving ? 0.5 : 1,
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => {
                                const btn = e.currentTarget;
                                if (!loading && !isRemoving && !btn.disabled) {
                                  btn.style.backgroundColor = '#dc3545';
                                  btn.style.borderColor = '#dc3545';
                                  btn.style.color = '#fff';
                                }
                              }}
                              onMouseLeave={(e) => {
                                const btn = e.currentTarget;
                                btn.style.backgroundColor = 'transparent';
                                btn.style.borderColor = '#dc3545';
                                btn.style.color = '#dc3545';
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Products Section */}
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label small fw-semibold text-dark mb-0">
                        Add Products
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleToggleShowProducts}
                        disabled={loading || productsLoading}
                        style={{
                          backgroundColor: 'var(--primary-color)',
                          borderColor: 'var(--primary-color)',
                          color: '#ffffff',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading && !productsLoading) {
                            e.target.style.backgroundColor = 'var(--primary-color)';
                            e.target.style.opacity = '0.9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading && !productsLoading) {
                            e.target.style.backgroundColor = 'var(--primary-color)';
                            e.target.style.opacity = '1';
                          }
                        }}
                      >
                        <FaPlus className="me-1" />
                        {showAddProducts ? 'Hide' : 'Show'} Products
                      </button>
                    </div>

                    <div
                      ref={productsContainerRef}
                      className="border rounded products-container"
                      style={{
                        backgroundColor: '#f8f9fa',
                        maxHeight: showAddProducts ? '1000px' : '0',
                        opacity: showAddProducts ? 1 : 0,
                        overflow: 'hidden',
                        overflowX: 'hidden',
                        transition: 'max-height 0.4s ease-in-out, opacity 0.4s ease-in-out, padding 0.4s ease-in-out, border-color 0.4s ease-in-out',
                        padding: showAddProducts ? '0.75rem' : '0 0.75rem',
                        marginBottom: showAddProducts ? '0' : '0',
                        border: showAddProducts ? '1px solid #dee2e6' : '1px solid transparent',
                        pointerEvents: showAddProducts ? 'auto' : 'none',
                        width: '100%',
                        maxWidth: '100%'
                      }}
                    >
                      {/* Search */}
                      <div className="mb-3">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">
                            <FaSearch />
                          </span>
                          <input
                            ref={searchInputRef}
                            type="text"
                            className="form-control"
                            placeholder="Search products..."
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            disabled={loading || productsLoading}
                          />
                            {productSearchTerm && (
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setProductSearchTerm('')}
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Products List */}
                        {productsLoading ? (
                          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            {[...Array(5)].map((_, index) => (
                              <div
                                key={`skeleton-${index}`}
                                className="d-flex align-items-center gap-2 p-2 border-bottom"
                                style={{ backgroundColor: '#fff' }}
                              >
                                <div
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    backgroundColor: '#e9ecef',
                                    animation: 'skeletonPulse 1.5s ease-in-out infinite',
                                    animationDelay: `${index * 0.1}s`
                                  }}
                                ></div>
                                <div className="flex-grow-1">
                                  <div
                                    style={{
                                      height: '16px',
                                      width: `${60 + Math.random() * 30}%`,
                                      backgroundColor: '#e9ecef',
                                      borderRadius: '4px',
                                      marginBottom: '6px',
                                      animation: 'skeletonPulse 1.5s ease-in-out infinite',
                                      animationDelay: `${index * 0.1}s`
                                    }}
                                  ></div>
                                  <div
                                    style={{
                                      height: '12px',
                                      width: '40px',
                                      backgroundColor: '#e9ecef',
                                      borderRadius: '12px',
                                      animation: 'skeletonPulse 1.5s ease-in-out infinite',
                                      animationDelay: `${index * 0.1 + 0.05}s`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : filteredAvailableProducts.length === 0 ? (
                          <div className="text-center py-3 text-muted">
                            <small>No products available to add.</small>
                          </div>
                        ) : (
                          <div style={{ maxHeight: '250px', overflowY: 'auto', overflowX: 'hidden' }}>
                            {filteredAvailableProducts.map((product, index) => (
                              <div
                                key={product.id}
                                className="d-flex align-items-center gap-2 gap-md-3 p-2 p-md-3 mb-2 rounded add-product-item"
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor: '#fff',
                                  border: '1px solid #e9ecef',
                                  transition: 'all 0.2s ease-in-out',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  minWidth: 0,
                                  width: '100%'
                                }}
                                onClick={() => handleAddProduct(product.id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fff';
                                  e.currentTarget.style.borderColor = '#e9ecef';
                                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <div
                                  className="d-flex align-items-center justify-content-center rounded overflow-hidden product-image-container"
                                  style={{
                                    width: '50px',
                                    height: '50px',
                                    minWidth: '50px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    transition: 'all 0.2s ease-in-out',
                                    position: 'relative',
                                    flexShrink: 0
                                  }}
                                >
                                  {getProductImage(product) ? (
                                    <img
                                      src={getProductImage(product)}
                                      alt={product.title}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.2s ease-in-out',
                                        display: 'block',
                                        flexShrink: 0
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) {
                                          e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      display: getProductImage(product) ? 'none' : 'flex',
                                      color: '#adb5bd',
                                      fontSize: '1.5rem'
                                    }}
                                  >
                                    <FaImage />
                                  </div>
                                </div>
                                <div className="flex-grow-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                                  <div 
                                    className="fw-semibold mb-1"
                                    style={{
                                      fontSize: '0.875rem',
                                      color: '#212529',
                                      lineHeight: '1.4',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={product.title}
                                  >
                                    {product.title}
                                  </div>
                                  {product.category && (
                                    <span 
                                      className="badge d-inline-block"
                                      style={{
                                        fontSize: '0.65rem',
                                        padding: '0.2rem 0.4rem',
                                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                        color: 'var(--primary-color)',
                                        fontWeight: '500',
                                        borderRadius: '12px',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title={product.category}
                                    >
                                      {product.category}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    color: 'var(--primary-color)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease-in-out',
                                    fontSize: '0.875rem'
                                  }}
                                  className="add-indicator"
                                >
                                  <FaPlus />
                                </div>
                              </div>
                            ))}
                            <style>{`
                              div:hover img {
                                transform: scale(1.1) !important;
                              }
                              .add-indicator {
                                opacity: 0 !important;
                              }
                              div:hover .add-indicator {
                                opacity: 1 !important;
                              }
                            `}</style>
                          </div>
                        )}
                      </div>
                  </div>
                  
                  {/* Loading Indicator */}
                  {productsLoading && (
                    <div 
                      className="d-flex align-items-center justify-content-center gap-2 py-3 mt-2"
                      role="status"
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--primary-color)',
                        fontWeight: '500'
                      }}
                    >
                      <span 
                        className="spinner-border spinner-border-sm" 
                        role="status"
                        style={{
                          width: '1rem',
                          height: '1rem',
                          borderWidth: '0.15em'
                        }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </span>
                      <span>Loading products...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-top bg-white modal-smooth">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-smooth"
                  onClick={handleCloseButtonClick}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-smooth"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'} me-2`}></i>
                      {isEdit ? 'Update Collection' : 'Create Collection'}
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

export default CollectionFormModal;

