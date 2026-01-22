import React, { useState, useEffect } from "react";
import Portal from "../../components/Portal";
import { FaBox, FaLayerGroup, FaCheckCircle, FaTimesCircle, FaCalendarAlt } from "react-icons/fa";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const CollectionDetailsModal = ({ 
  collection, 
  onClose,
  token,
  prefetchedCollection = null,
  prefetchedProducts = [],
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [collectionData, setCollectionData] = useState(prefetchedCollection);
  const [products, setProducts] = useState(prefetchedProducts || []);
  const [loading, setLoading] = useState(!prefetchedCollection);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Reset state when collection changes
    if (!collection || !collection.id) {
      setCollectionData(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    // If we already have prefetched data, use it and skip network
    if (prefetchedCollection && prefetchedCollection.id === collection.id) {
      setCollectionData(prefetchedCollection);
      setProducts(prefetchedProducts || []);
      setLoading(false);
      return;
    }

    // Fetch details
    const fetchCollectionDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching collection details for ID: ${collection.id}`);
        const response = await fetch(`${apiBaseUrl}/product-collections/${collection.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Collection details response:', data);
          if (data.success && data.collection) {
            setCollectionData(data.collection);
            const products = data.collection.products || [];
            setProducts(products);
            console.log(`Loaded ${products.length} products for collection ${collection.id}`, products);
          } else {
            console.error('Invalid response structure:', data);
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch collection details:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching collection details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionDetails();
  }, [collection?.id, apiBaseUrl, token]);

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget) {
      await closeModal();
    }
  };

  const handleEscapeKey = async (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      await closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    document.body.classList.add("modal-open");
    
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.classList.remove("modal-open");
    };
  }, []);

  const closeModal = async () => {
    setIsClosing(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    onClose();
  };

  if (!collection) return null;

  return (
    <Portal>
      <style>{`
        @media (max-width: 767px) {
          .product-item-detail-mobile {
            gap: 0.5rem !important;
            padding: 0.75rem !important;
            flex-wrap: nowrap !important;
          }
          .product-item-detail-mobile .product-index-mobile {
            min-width: 25px !important;
            font-size: 0.75rem !important;
            flex-shrink: 0 !important;
          }
          .product-item-detail-mobile .product-info-mobile {
            min-width: 0 !important;
            overflow: hidden !important;
            flex: 1 1 auto !important;
          }
          .product-item-detail-mobile .product-title-mobile {
            font-size: 0.8rem !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .product-item-detail-mobile .product-badge-mobile {
            font-size: 0.65rem !important;
            flex-shrink: 0 !important;
          }
          .product-item-detail-mobile .product-status-mobile {
            flex-shrink: 0 !important;
          }
          .product-item-detail-mobile .product-status-mobile .badge {
            font-size: 0.7rem !important;
          }
          .products-container-mobile {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .modal-dialog {
            max-width: 95% !important;
            margin: 0.5rem auto !important;
          }
          .modal-content {
            width: 100% !important;
            max-width: 100% !important;
          }
          .modal-body {
            overflow-x: hidden !important;
            padding: 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .card-body {
            padding: 0.75rem !important;
            overflow-x: hidden !important;
          }
          .card {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
        }
      `}</style>
      <div 
        className={`modal fade show d-block modal-backdrop-animation ${isClosing ? 'exit' : ''}`} 
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }} 
        onClick={handleBackdropClick} 
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg mx-3 mx-sm-auto">
          <div 
            className={`modal-content border-0 modal-content-animation ${isClosing ? 'exit' : ''}`} 
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div 
              className="modal-header border-0 text-white modal-smooth" 
              style={{ background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)" }}
            >
              <h5 className="modal-title fw-bold">
                <i className="fas fa-layer-group me-2"></i>Collection Details
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white btn-smooth" 
                onClick={closeModal} 
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body bg-light modal-smooth" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {loading ? (
                <LoadingSpinner text="Loading collection details..." />
              ) : (
                <>
                  {/* Collection Header Card */}
                  <div className="card border-0 bg-white mb-4">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                            style={{ 
                              width: "80px", 
                              height: "80px", 
                              background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)", 
                              fontSize: "2rem" 
                            }}
                          >
                            <FaLayerGroup />
                          </div>
                        </div>
                        <div className="col">
                          <h4 className="mb-1 text-dark">{collectionData?.name || collection.name}</h4>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            <span className={`badge ${collectionData?.is_active ? 'bg-success' : 'bg-secondary'} fs-6`}>
                              <i className={`fas ${collectionData?.is_active ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                              {collectionData?.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {collectionData?.display_order !== null && collectionData?.display_order !== undefined && (
                              <span className="badge bg-info fs-6">
                                <i className="fas fa-sort-numeric-down me-1"></i>
                                Order: {collectionData.display_order}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collection Information */}
                  <div className="card border-0 bg-white mb-4">
                    <div className="card-header bg-transparent border-bottom">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-info-circle me-2 text-primary"></i>Collection Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Collection Name</label>
                          <p className="mb-0 fw-semibold text-dark">{collectionData?.name || collection.name}</p>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Status</label>
                          <p className="mb-0">
                            <span className={`badge ${collectionData?.is_active ? 'bg-success' : 'bg-secondary'}`}>
                              {collectionData?.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                        </div>
                        {collectionData?.display_order !== null && collectionData?.display_order !== undefined && (
                          <div className="col-md-6 mb-3">
                            <label className="form-label small fw-semibold text-muted mb-1">Display Order</label>
                            <p className="mb-0 text-dark">{collectionData.display_order}</p>
                          </div>
                        )}
                        {collectionData?.created_at && (
                          <div className="col-md-6 mb-3">
                            <label className="form-label small fw-semibold text-muted mb-1">
                              <FaCalendarAlt className="me-1" />Created At
                            </label>
                            <p className="mb-0 text-dark">
                              {new Date(collectionData.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        {collectionData?.description && (
                          <div className="col-md-12 mt-3">
                            <label className="form-label small fw-semibold text-muted mb-1">Description</label>
                            <p className="mb-0 text-dark">{collectionData.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Products in Collection */}
                  <div className="card border-0 bg-white" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
                    <div className="card-header bg-transparent border-bottom">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-box me-2 text-primary"></i>Products in Collection ({products.length})
                      </h6>
                    </div>
                    <div className="card-body" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
                      {products.length === 0 ? (
                        <div className="text-center py-4">
                          <FaBox className="text-muted mb-2" size={48} />
                          <p className="text-muted mb-0">No products in this collection yet.</p>
                        </div>
                      ) : (
                        <div className="products-container-mobile">
                          {products.map((product, index) => (
                            <div
                              key={product.id}
                              className="d-flex align-items-center gap-3 p-3 mb-2 border rounded bg-white product-item-detail-mobile"
                              style={{ minWidth: 0, width: '100%' }}
                            >
                              <div className="text-muted small product-index-mobile" style={{ minWidth: '40px' }}>
                                #{index + 1}
                              </div>
                              <div className="flex-grow-1 product-info-mobile">
                                <div className="fw-semibold product-title-mobile" title={product.title}>
                                  {product.title}
                                </div>
                                <small className="text-muted d-block mt-1">
                                  {product.category && (
                                    <span className="badge bg-secondary me-2 product-badge-mobile">{product.category}</span>
                                  )}
                                  {product.sku && (
                                    <span className="d-inline-block" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      SKU: {product.sku}
                                    </span>
                                  )}
                                </small>
                              </div>
                              <div className="product-status-mobile">
                                <span className={`badge ${product.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                  {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-footer border-top bg-white modal-smooth">
              <button type="button" className="btn btn-outline-secondary btn-smooth" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default CollectionDetailsModal;
