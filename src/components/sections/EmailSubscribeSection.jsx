import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import gcashLogo from '../../assets/images/gcash-logo.jpg';
import mayaLogo from '../../assets/images/maya-logo.png';
import grabPayLogo from '../../assets/images/grabpay-logo.png';
import shopeePayLogo from '../../assets/images/shopeepay-logo.jpg';
import sevenElevenLogo from '../../assets/images/7eleven-logo.png';

const EmailSubscribeSection = ({ config, section }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const location = useLocation();
  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  const title = config.title || section?.title || 'Subscribe to our emails';
  const description = config.description || 'Get early access to new spreadsheet drops, tutorials, and exclusive promos.';
  const placeholder = config.placeholder || 'Enter your email';
  const buttonText = config.buttonText || 'Subscribe';
  const showSocialLinks = config.showSocialLinks !== false;
  const socialLinks = config.socialLinks || {};
  const backgroundColor = config.backgroundColor || '#F3F3F3';
  const subscribeBackgroundColor = config.subscribeBackgroundColor || '#FDD238';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    try {
      setSubmitting(true);
      setStatusMessage('');
      const response = await fetch(`${apiBaseUrl}/email-subscribers`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Subscription failed');
      }

      if (data?.already_subscribed) {
        toast.info('You are already subscribed.');
        setStatusType('info');
        setStatusMessage('You are already subscribed.');
      } else {
        toast.success('Thanks for subscribing!');
        setStatusType('success');
        setStatusMessage('Thanks for subscribing!');
      }
      setEmail('');
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error(error.message || 'Unable to subscribe.');
      setStatusType('error');
      setStatusMessage(error.message || 'Unable to subscribe.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        padding: '0 0 4rem',
        backgroundColor: backgroundColor,
      }}
    >
      {/* Full-width yellow subscribe band */}
      <div
        style={{
          backgroundColor: subscribeBackgroundColor,
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
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 1.6 }}
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 600,
              color: '#111111',
              margin: 0,
              marginBottom: '0.75rem',
            }}
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 1.4, delay: 0.1 }}
            style={{
              fontSize: 'clamp(0.95rem, 2.2vw, 1.05rem)',
              color: '#333333',
              marginTop: 0,
              marginBottom: '2.5rem',
            }}
          >
            {description}
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 1.3, delay: 0.15 }}
            onSubmit={handleSubmit}
            style={{
              display: 'inline-flex',
              alignItems: 'stretch',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            <input
              type="email"
              placeholder={placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
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
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.7rem 1rem',
                borderRadius: '0 4px 4px 0',
                border: '1px solid #CCCCCC',
                borderLeft: 'none',
                backgroundColor: '#000',
                color: '#FFFFFF',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
                boxShadow: 'none',
                transform: 'none',
                opacity: submitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#333333';
                  e.currentTarget.style.borderColor = '#111111';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
                e.currentTarget.style.borderColor = '#CCCCCC';
              }}
            >
              {submitting ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.1rem',
                    height: '1.1rem',
                  }}
                >
                  <span
                    style={{
                      width: '1.1rem',
                      height: '1.1rem',
                      borderRadius: '999px',
                      border: '2px solid rgba(255,255,255,0.5)',
                      borderTopColor: '#FFFFFF',
                      animation: 'emailSubscribeSpin 0.8s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    transform: 'translateX(1px)',
                    fontSize: '1.3rem',
                    fontWeight: 600,
                  }}
                >
                  {buttonText}
                </span>
              )}
            </button>
          </motion.form>
          <style>{`
            @keyframes emailSubscribeSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          {statusMessage && (
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '0.9rem',
                color:
                  statusType === 'success'
                    ? '#1f7a1f'
                    : statusType === 'error'
                      ? '#b00020'
                      : '#333333',
              }}
            >
              {statusMessage}
            </div>
          )}

          {showSocialLinks && Object.keys(socialLinks).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
              }}
            >
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                  YouTube
                </a>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer-style area under subscribe band */}
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
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.2 }}
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
            const isBrowseTemplates = link === 'Browse Templates';
            const isActiveContact = isContact && location.pathname === '/contact';
            const isActiveBrowseTemplates = isBrowseTemplates && location.pathname === '/all-products';

            const baseStyle = {
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              color: isActiveContact || isActiveBrowseTemplates ? '#000000' : '#444',
              fontSize: '0.95rem',
              textDecoration: 'none',
              paddingBottom: '2px',
              borderBottom: isActiveContact || isActiveBrowseTemplates ? '2px solid #000000' : '2px solid transparent',
              transition: 'color 0.18s ease, border-color 0.18s ease',
            };

            const commonHoverHandlers = {
              onMouseEnter: (e) => {
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.borderBottomColor = '#000000';
              },
              onMouseLeave: (e) => {
                const isActive = isActiveContact || isActiveBrowseTemplates;
                e.currentTarget.style.color = isActive ? '#000000' : '#444';
                e.currentTarget.style.borderBottomColor = isActive ? '#000000' : 'transparent';
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

            if (isBrowseTemplates) {
              return (
                <Link
                  key={link}
                  to="/all-products"
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
          viewport={{ once: false }}
          transition={{ duration: 1.2 }}
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
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1 }}
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

export default EmailSubscribeSection;

