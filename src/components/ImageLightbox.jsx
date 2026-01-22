import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const ImageLightbox = ({ 
  isOpen, 
  imageUrl, 
  imageGallery = [], 
  currentIndex = 0,
  onClose, 
  onNext, 
  onPrev 
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && imageGallery.length > 1) {
        onNext();
      } else if (e.key === 'ArrowLeft' && imageGallery.length > 1) {
        onPrev();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, imageGallery.length, onClose, onNext, onPrev]);

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && imageUrl && (
        <motion.div
          key="image-lightbox-overlay"
          className="image-lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '2rem',
          }}
        >
          <motion.div
            key="image-lightbox-card"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: isMobile ? '100vw' : 'calc(100vw - 4rem)',
            maxHeight: isMobile ? '98vh' : 'calc(100vh - 4rem)',
            width: isMobile ? '100vw' : '100%',
            height: isMobile ? 'auto' : '100%',
            margin: '0 auto',
            background: '#0c0d10',
            border: isMobile ? 'none' : '1px solid #1f2937',
            borderRadius: '0',
            padding: isMobile ? '0' : '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isMobile ? 'none' : '0 20px 60px rgba(0,0,0,0.55)',
            overflow: 'hidden',
          }}
          className="image-lightbox-container"
        >
          {/* Close Button */}
          <button
            type="button"
            aria-label="Close image"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '0.5rem' : '0.75rem',
              right: isMobile ? '0.5rem' : '0.75rem',
              border: '1px solid #1f2937',
              background: '#111214',
              color: '#e5e7eb',
              padding: isMobile ? '0.5rem 0.75rem' : '0.35rem 0.65rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: isMobile ? '1rem' : 'inherit',
              transition: 'background-color 0.2s ease, transform 0.1s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.8)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#111214';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ✕
          </button>

          {/* Previous Button */}
          {imageGallery.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              style={{
                position: 'absolute',
                left: isMobile ? '0.5rem' : '0.35rem',
                top: '50%',
                transform: 'translateY(-50%)',
                border: '1px solid #1f2937',
                background: '#111214',
                color: '#e5e7eb',
                padding: isMobile ? '0.5rem 0.75rem' : '0.35rem 0.55rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: isMobile ? '1.2rem' : 'inherit',
                transition: 'background-color 0.2s ease, transform 0.1s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.8)';
                e.currentTarget.style.transform = 'translateY(-50%) translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#111214';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              ←
            </button>
          )}

          {/* Next Button */}
          {imageGallery.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              style={{
                position: 'absolute',
                right: isMobile ? '0.5rem' : '0.35rem',
                top: '50%',
                transform: 'translateY(-50%)',
                border: '1px solid #1f2937',
                background: '#111214',
                color: '#e5e7eb',
                padding: isMobile ? '0.5rem 0.75rem' : '0.35rem 0.55rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: isMobile ? '1.2rem' : 'inherit',
                transition: 'background-color 0.2s ease, transform 0.1s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.8)';
                e.currentTarget.style.transform = 'translateY(-50%) translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#111214';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              →
            </button>
          )}

          {/* Image Container */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              width: isMobile ? '100vw !important' : '100%',
              height: isMobile ? 'auto' : '100%',
              maxWidth: isMobile ? '100vw !important' : 'calc(100vw - 6rem)',
              maxHeight: isMobile ? '96vh' : 'calc(100vh - 6rem)',
              minWidth: isMobile ? '100vw' : 'auto',
              minHeight: isMobile ? '400px' : 'auto',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={imageUrl}
                alt="Product image"
                style={{
                  width: isMobile ? '100vw !important' : 'auto',
                  height: isMobile ? 'auto' : 'auto',
                  maxWidth: isMobile ? '100vw !important' : 'calc(100vw - 6rem)',
                  maxHeight: isMobile ? '96vh' : 'calc(100vh - 6rem)',
                  minWidth: isMobile ? '100vw' : 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>
            
            {/* Image Counter Indicator */}
            {imageGallery.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#e5e7eb',
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: 600,
                  zIndex: 5,
                  pointerEvents: 'none',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {currentIndex + 1} / {imageGallery.length}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ImageLightbox;

