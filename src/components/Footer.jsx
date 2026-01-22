import React from 'react';
import { motion } from 'framer-motion';

const Footer = ({ currentSlide = 1, totalSlides = 5, onPrevious, onNext }) => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '2px solid #0066CC',
        padding: '2rem 0',
        marginTop: 'auto'
      }}
    >
      <div className="container">
        <div className="row justify-content-center align-items-center mb-2">
          <div className="col-auto">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-link p-0 me-3"
                style={{ color: '#0066CC', textDecoration: 'none' }}
                aria-label="Previous"
                onClick={onPrevious}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
              
              <span style={{ 
                color: '#000', 
                fontSize: '1rem', 
                fontWeight: '500',
                margin: '0 1rem'
              }}>
                {currentSlide}/{totalSlides}
              </span>
              
              <button
                className="btn btn-link p-0 ms-3"
                style={{ color: '#0066CC', textDecoration: 'none' }}
                aria-label="Next"
                onClick={onNext}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-auto">
            <span
              style={{
                fontSize: '0.85rem',
                color: '#666',
              }}
            >
              © 2025, AJ Creative Studio. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;

