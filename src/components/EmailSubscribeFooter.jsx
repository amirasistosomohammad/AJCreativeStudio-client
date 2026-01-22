import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import gcashLogo from '../assets/images/gcash-logo.jpg';
import mayaLogo from '../assets/images/maya-logo.png';
import grabPayLogo from '../assets/images/grabpay-logo.png';
import shopeePayLogo from '../assets/images/shopeepay-logo.jpg';
import sevenElevenLogo from '../assets/images/7eleven-logo.png';

const EmailSubscribeFooter = () => {
  const location = useLocation();
  const footerLinks = [
    'Browse Templates',
    'Terms & Policies',
    'Privacy Notice',
    'Contact',
  ];

  const paymentLogos = [
    { name: 'GCash', src: gcashLogo },
    { name: 'Maya', src: mayaLogo },
    { name: 'GrabPay', src: grabPayLogo },
    { name: 'ShopeePay', src: shopeePayLogo },
    { name: '7-Eleven', src: sevenElevenLogo },
  ];

  return (
    <section
      style={{
        // Grey background for the whole footer area
        padding: '0 0 4rem',
        backgroundColor: '#F3F3F3',
      }}
    >
      {/* Full-width yellow subscribe band */}
      <div
        style={{
          backgroundColor: '#FDD238',
          padding: '3rem clamp(1rem, 8vw, 200px)',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          {/* Subscribe heading */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 600,
              color: '#111111',
              margin: 0,
              marginBottom: '0.75rem',
            }}
          >
            Subscribe to our emails
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(0.95rem, 2.2vw, 1.05rem)',
              color: '#333333',
              marginTop: 0,
              marginBottom: '2.5rem',
            }}
          >
            Get early access to new spreadsheet drops, tutorials, and exclusive promos.
          </motion.p>

          {/* Email input row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'inline-flex',
              alignItems: 'stretch',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1,
                padding: '0.7rem 0.85rem',
                border: '1px solid #CCCCCC',
                borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#000000';
                e.target.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#CCCCCC';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              style={{
                padding: '0.7rem 1rem',
                borderRadius: '0 4px 4px 0',
                border: '1px solid #CCCCCC',
                borderLeft: 'none',
                backgroundColor: '#000',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
                boxShadow: 'none',
                transform: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
                e.currentTarget.style.borderColor = '#111111';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
                e.currentTarget.style.borderColor = '#CCCCCC';
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: 'translateX(1px)',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                }}
              >
                ➜
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Rest of footer content (grey background) */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '0 clamp(1rem, 8vw, 200px)',
        }}
      >
        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid #E0E0E0',
            marginTop: '3.5rem',
            marginBottom: '2.5rem',
          }}
        />

        {/* Footer navigation links */}
        <motion.div
          className="email-footer-links"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            fontSize: '0.95rem',
            color: '#555',
            marginBottom: '2rem',
          }}
        >
          {footerLinks.map((link) => {
            const isContact = link === 'Contact';
            const isActiveContact = isContact && location.pathname === '/contact';

            const baseStyle = {
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              color: isActiveContact ? '#000000' : '#444',
              fontSize: '0.95rem',
              // remove default anchor underline
              textDecoration: 'none',
              // small spacing before the underline
              paddingBottom: '2px',
              // use border-bottom as underline so we can control thickness
              borderBottom: isActiveContact ? '2px solid #000000' : '2px solid transparent',
              transition: 'color 0.18s ease, border-color 0.18s ease',
            };

            const commonHoverHandlers = {
              onMouseEnter: (e) => {
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.borderBottomColor = '#000000';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.color = isActiveContact ? '#000000' : '#444';
                e.currentTarget.style.borderBottomColor = isActiveContact ? '#000000' : 'transparent';
              },
            };

            if (isContact) {
              return (
                <Link
                  key={link}
                  to="/contact"
                  style={baseStyle}
                  {...commonHoverHandlers}
                >
                  {link}
                </Link>
              );
            }

            return (
              <button
                key={link}
                type="button"
                style={baseStyle}
                {...commonHoverHandlers}
              >
                {link}
              </button>
            );
          })}
        </motion.div>

        {/* Second divider under footer links */}
        <div
          style={{
            borderTop: '1px solid #E0E0E0',
            marginTop: '0.5rem',
            marginBottom: '2.5rem',
          }}
        />

        {/* Payment methods */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {paymentLogos.map((method) => (
            <div
              key={method.name}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                minWidth: '80px',
                minHeight: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={method.src}
                alt={`${method.name} logo`}
                style={{
                  maxHeight: '22px',
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            </div>
          ))}
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: '0.8rem',
            color: '#777',
          }}
        >
          © {new Date().getFullYear()}, AJ Creative Studio. All rights reserved.
        </motion.div>
      </div>
    </section>
  );
};

export default EmailSubscribeFooter;

