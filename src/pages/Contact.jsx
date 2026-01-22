import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EmailSubscribeFooter from '../components/EmailSubscribeFooter';
import { toast } from 'react-toastify';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.email.trim() || !formData.comment.trim()) {
      setStatusType('error');
      setStatusMessage('Email and comment are required.');
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage('');
      const response = await fetch(`${apiBaseUrl}/contact-messages`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim() || null,
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          comment: formData.comment.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to send message.');
      }

      toast.success(data?.message || 'Message sent successfully.');
      setStatusType('success');
      setStatusMessage(data?.message || 'Message sent successfully.');
      setFormData({ name: '', email: '', phone: '', comment: '' });
    } catch (error) {
      console.error('Contact submit error:', error);
      toast.error(error.message || 'Unable to send message.');
      setStatusType('error');
      setStatusMessage(error.message || 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <section
        style={{
          padding: '3rem 1rem 4rem',
          backgroundColor: '#FFFFFF',
          flex: '1 0 auto',
          // Responsive: uses CSS variable that updates on resize for consistent spacing across all screen sizes
          // Same spacing on mobile and desktop - uses navbar height directly
          paddingTop: 'var(--navbar-height, 0)',
          marginTop: '0px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Page title - centered like form but text left-aligned */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: '#000',
              textAlign: 'left',
              marginTop: 0,
              marginBottom: '2rem',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Contact
          </motion.h1>

          {/* Contact form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: '720px', margin: '0 auto' }}
          >
            {/* First row: Name + Email (Bootstrap grid) */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ borderRadius: 0, fontSize: '0.95rem' }}
                />
              </div>
              <div className="col-md-6">
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="Email *"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ borderRadius: 0, fontSize: '0.95rem' }}
                />
              </div>
            </div>

            {/* Phone number */}
            <div className="mb-3">
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                style={{ borderRadius: 0, fontSize: '0.95rem' }}
              />
            </div>

            {/* Comment */}
            <div className="mb-4">
              <textarea
                placeholder="Comment"
                name="comment"
                rows={5}
                className="form-control"
                value={formData.comment}
                onChange={handleChange}
                style={{ borderRadius: 0, fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>

            {/* Send button (match MostPopular primary button style) */}
            <motion.button
              whileHover={{ y: -2, backgroundColor: '#222222' }}
              whileTap={{ y: 0 }}
              type="submit"
              className="most-popular-view-all"
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.98rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send'}
            </motion.button>
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
          </motion.form>
        </div>
      </section>

      {/* Shared email + footer section */}
      <EmailSubscribeFooter />
    </div>
  );
};

export default Contact;
