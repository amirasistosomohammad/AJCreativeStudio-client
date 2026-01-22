import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const formatPHP = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const Download = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchDownloadInfo();
  }, [token]);

  const fetchDownloadInfo = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(
        `${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/downloads/${token}/info`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load download information');
      }

      const data = await response.json();
      if (data.success && data.download) {
        setDownloadInfo(data.download);
      } else {
        throw new Error('Invalid download information');
      }
    } catch (err) {
      console.error('Error fetching download info:', err);
      setError(err.message || 'Failed to load download information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadInfo || !downloadInfo.can_download) {
      return;
    }

    try {
      setDownloading(true);
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(
        `${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/downloads/${token}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Download failed');
      }

      // Get filename from Content-Disposition header or use product file name
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = downloadInfo.product.file_name || 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh download info to update download count
      setTimeout(() => {
        fetchDownloadInfo();
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      alert(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading download information...</p>
        </div>
      </div>
    );
  }

  if (error || !downloadInfo) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ marginBottom: '1rem' }}>Download Not Available</h2>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
            {error || 'Invalid download link'}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#000',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  const isExpired = downloadInfo.is_expired;
  const canDownload = downloadInfo.can_download;
  const remainingDownloads = downloadInfo.remaining_downloads;

  return (
    <div style={{
      minHeight: '80vh',
      padding: '2rem 1rem',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Download Your Product</h1>
          <p style={{ color: '#6b7280' }}>Order: {downloadInfo.order.order_number}</p>
        </div>

        {/* Product Info Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ marginBottom: '1rem' }}>{downloadInfo.product.title}</h2>
          
          {downloadInfo.product.description && (
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {downloadInfo.product.description}
            </p>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
          }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>File Name</p>
              <p style={{ fontWeight: 600 }}>{downloadInfo.product.file_name || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>File Size</p>
              <p style={{ fontWeight: 600 }}>{formatFileSize(downloadInfo.product.file_size)}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Downloads Used</p>
              <p style={{ fontWeight: 600 }}>
                {downloadInfo.download_count} / {downloadInfo.max_downloads}
              </p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Expires</p>
              <p style={{ fontWeight: 600 }}>No expiration</p>
            </div>
          </div>

          {/* Download Status */}
          {/* No expiration or limit warnings in current flow */}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: canDownload ? '#000' : '#9ca3af',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: canDownload ? 'pointer' : 'not-allowed',
              fontSize: '1.125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {downloading ? (
              <>
                <div className="spinner-border spinner-border-sm text-white" role="status">
                  <span className="visually-hidden">Downloading...</span>
                </div>
                Downloading...
              </>
            ) : (
              <>
                <span>⬇️</span>
                {canDownload ? 'Download Now' : 'Download Not Available'}
              </>
            )}
          </button>

          {canDownload && remainingDownloads > 0 && (
            <p style={{
              textAlign: 'center',
              marginTop: '1rem',
              color: '#6b7280',
              fontSize: '0.875rem',
            }}>
              {remainingDownloads} download{remainingDownloads !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fff',
              color: '#000',
              border: '1px solid #000',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Continue Shopping
          </button>
          {downloadInfo.order.order_number && (
            <button
              onClick={() => navigate(`/order/${downloadInfo.order.order_number}`)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#000',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              View Order
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Download;

