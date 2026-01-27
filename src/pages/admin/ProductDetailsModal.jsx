import React, { useState, useEffect } from "react";
import Portal from "../../components/Portal";
import { FaBox, FaChevronLeft, FaChevronRight, FaDownload } from "react-icons/fa";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { getFileExtension, getFileIconInfo } from "../../utils/fileIconUtils";

const ProductDetailsModal = ({ 
  product, 
  onClose,
  // Helper functions
  buildGallery,
  getFeatureIndex,
  cycleFeature,
  openImageModal,
  formatCurrency,
  formatDateTime,
  normalizeFeatureImages,
  getPrimaryImage,
  getThumbnailOnly,
  // State management
  featureIndexMap,
  setFeatureIndexMap,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Download product file
  const handleDownloadFile = async () => {
    if (!product?.file_path) return;

    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/products/${product.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      const ext = getFileExtension(product.file_name) || getFileExtension(product.file_path);
      a.download = product.file_name || `product-${product.id}${ext ? `.${ext}` : ''}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

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

  if (!product) return null;

  const gallery = buildGallery(product);
  const featureIdx = getFeatureIndex(product.id, gallery.length);
  const heroImage = gallery.length > 0 ? gallery[featureIdx] : getThumbnailOnly(product) || getPrimaryImage(product);
  const featureImages = normalizeFeatureImages(product);
  const fileIcon = getFileIconInfo({ fileName: product.file_name, filePath: product.file_path });
  const FileIcon = fileIcon.Icon;

  return (
    <Portal>
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
                <i className="fas fa-box me-2"></i>Product Details
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white btn-smooth" 
                onClick={closeModal} 
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body bg-light modal-smooth" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Product Header Card */}
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
                        <FaBox />
                      </div>
                    </div>
                    <div className="col">
                      <h4 className="mb-1 text-dark">{product.title || 'Untitled Product'}</h4>
                      {product.category && (
                        <p className="text-muted mb-2">{product.category}</p>
                      )}
                      <div className="d-flex flex-wrap gap-2">
                        <span className={`badge ${product.is_active ? 'bg-success' : 'bg-secondary'} fs-6`}>
                          <i className={`fas ${product.is_active ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {product.on_sale && (
                          <span className="badge bg-danger fs-6">
                            <i className="fas fa-tag me-1"></i>On Sale
                          </span>
                        )}
                        {product.category && (
                          <span className="badge bg-info fs-6">
                            <i className="fas fa-folder me-1"></i>{product.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Image Section */}
              <div className="card border-0 bg-white mb-4">
                <div className="card-header bg-transparent border-bottom-0">
                  <h6 className="mb-0 fw-semibold text-dark">
                    <i className="fas fa-image me-2 text-primary"></i>Product Images
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="detail-hero position-relative rounded" style={{ overflow: 'auto', maxHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-light)' }}>
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt={product.title}
                        style={{ 
                          width: 'auto', 
                          height: 'auto', 
                          maxWidth: '100%', 
                          maxHeight: '600px',
                          objectFit: 'contain', 
                          cursor: 'pointer',
                          display: 'block'
                        }}
                        onClick={(e) => openImageModal(heroImage, e, gallery, featureIdx)}
                      />
                    ) : (
                      <div
                        className="w-100 d-flex align-items-center justify-content-center"
                        style={{ height: '300px', backgroundColor: 'var(--background-light)' }}
                      >
                        <FaBox className="text-muted" size={48} />
                      </div>
                    )}
                    {gallery.length > 1 && (
                      <div
                        className="position-absolute top-50 start-0 end-0 px-2 d-flex justify-content-between align-items-center"
                        style={{ transform: 'translateY(-50%)' }}
                      >
                        <button
                          type="button"
                          className="hero-nav-btn"
                          onClick={() => cycleFeature(product.id, gallery.length, -1)}
                        >
                          <FaChevronLeft />
                        </button>
                        <div className="hero-nav-indicator">
                          {featureIdx + 1}/{gallery.length}
                        </div>
                        <button
                          type="button"
                          className="hero-nav-btn"
                          onClick={() => cycleFeature(product.id, gallery.length, 1)}
                        >
                          <FaChevronRight />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Feature Images Strip */}
                  {featureImages.length > 0 && (
                    <div
                      className="d-flex justify-content-center gap-2 flex-wrap mt-3 p-3 rounded"
                      style={{ background: 'var(--background-light)', border: '1px solid var(--input-border)' }}
                    >
                      {featureImages.slice(0, 6).map((img, idx) => {
                        const galleryIndex = gallery.findIndex(g => g === img);
                        const isActive = galleryIndex >= 0 && galleryIndex === featureIdx;
                        return (
                          <div
                            key={idx}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: isActive ? '3px solid var(--primary-color)' : '1px solid var(--input-border)',
                              backgroundColor: isActive ? '#fff' : '#fff',
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
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary-color)',
                                  border: '2px solid #fff',
                                  zIndex: 10,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}
                              />
                            )}
                            <img
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
              </div>

              <div className="row g-3">
                {/* Basic Information */}
                <div className="col-12 col-md-6">
                  <div className="card border-0 bg-white h-100">
                    <div className="card-header bg-transparent border-bottom-0">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-info-circle me-2 text-primary"></i>Basic Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted mb-1">Product Title</label>
                        <p className="mb-0 fw-semibold text-dark">{product.title || 'N/A'}</p>
                      </div>
                      {product.sku && (
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">SKU</label>
                          <p className="mb-0 fw-semibold text-dark">{product.sku}</p>
                        </div>
                      )}
                      {product.category && (
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Category</label>
                          <p className="mb-0 fw-semibold text-dark">{product.category}</p>
                        </div>
                      )}
                      <div>
                        <label className="form-label small fw-semibold text-muted mb-1">Status</label>
                        <p className="mb-0 fw-semibold text-dark">
                          <span className={`badge ${product.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="col-12 col-md-6">
                  <div className="card border-0 bg-white h-100">
                    <div className="card-header bg-transparent border-bottom-0">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-dollar-sign me-2 text-success"></i>Pricing & Inventory
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted mb-1">Price</label>
                        <p className="mb-0 fw-semibold text-dark" style={{ color: 'var(--primary-color)', fontSize: '1.25rem' }}>
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      {product.old_price && (
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Old Price</label>
                          <p className="mb-0 fw-semibold text-dark text-decoration-line-through text-muted">
                            {formatCurrency(product.old_price)}
                          </p>
                        </div>
                      )}
                      {(product.stock ?? product.quantity) !== undefined && (
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Stock</label>
                          <p className="mb-0 fw-semibold text-dark">{product.stock ?? product.quantity}</p>
                        </div>
                      )}
                      <div>
                        <label className="form-label small fw-semibold text-muted mb-1">On Sale</label>
                        <p className="mb-0 fw-semibold text-dark">
                          <span className={`badge ${product.on_sale ? 'bg-danger' : 'bg-secondary'}`}>
                            {product.on_sale ? 'Yes' : 'No'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                {product.subtitle && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header bg-transparent border-bottom-0">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className="fas fa-heading me-2 text-info"></i>Subtitle
                        </h6>
                      </div>
                      <div className="card-body">
                        <div
                          className="small"
                          style={{ color: 'var(--text-secondary)' }}
                          dangerouslySetInnerHTML={{ __html: product.subtitle }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header bg-transparent border-bottom-0">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className="fas fa-align-left me-2 text-warning"></i>Description
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="border rounded p-3" style={{ backgroundColor: 'var(--background-light)' }}>
                          <MarkdownRenderer content={product.description} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product File */}
                {product.file_path && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header bg-transparent border-bottom-0">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className={`fas ${fileIcon.faIcon} me-2 ${fileIcon.colorClass}`}></i>Product File
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <FileIcon className={fileIcon.colorClass} size={24} />
                              <div>
                                <label className="form-label small fw-semibold text-muted mb-0">File Name</label>
                                <p className="mb-0 fw-semibold text-dark">{product.file_name || 'N/A'}</p>
                              </div>
                            </div>
                            {product.file_size && (
                              <div className="mb-2">
                                <label className="form-label small fw-semibold text-muted mb-0">File Size</label>
                                <p className="mb-0 text-muted">{formatFileSize(product.file_size)}</p>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-success btn-smooth"
                            onClick={handleDownloadFile}
                            disabled={downloading}
                            style={{ minWidth: '140px' }}
                          >
                            {downloading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <FaDownload className="me-2" />
                                Download File
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="col-12">
                  <div className="card border-0 bg-white">
                    <div className="card-header bg-transparent border-bottom-0">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-history me-2 text-info"></i>Timeline
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-12 col-md-6 mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Created Date</label>
                          <p className="mb-0 fw-semibold text-dark">{formatDateTime(product.created_at)}</p>
                        </div>
                        <div className="col-12 col-md-6 mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Last Updated</label>
                          <p className="mb-0 fw-semibold text-dark">{formatDateTime(product.updated_at)}</p>
                        </div>
                        <div className="col-12 col-md-6 mb-3">
                          <label className="form-label small fw-semibold text-muted mb-1">Added By</label>
                          <p className="mb-0 fw-semibold text-dark">
                            {product.added_by_name || 
                             (product.added_by && (product.added_by.name || product.added_by.username)) ||
                             product.added_by || 
                             product.created_by || 
                             'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

export default ProductDetailsModal;

