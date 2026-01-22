import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQSection = ({ config, section }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Filter FAQs to only show active ones
  const allFaqs = config.faqs || [];
  const faqs = allFaqs.filter(faq => faq.is_active !== false);
  const title = config.title || section?.title || 'Frequently Asked Questions';
  const layout = config.layout || 'accordion';
  const allowMultipleOpen = config.allowMultipleOpen || false;
  const backgroundColor = config.backgroundColor || '#F3F3F3';

  const toggleFAQ = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (allowMultipleOpen) {
      setOpenIndex(openIndex === index ? null : index);
    } else {
      setOpenIndex(openIndex === index ? null : index);
    }
  };

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section
      className="faq-section"
      style={{
        padding: '4rem clamp(1rem, 8vw, 200px)',
        backgroundColor: backgroundColor,
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: '#000',
            textAlign: 'center',
            marginBottom: '3rem',
            marginTop: 0,
          }}
        >
          {title}
        </motion.h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-50px' }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
                delay: index * 0.1,
              }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
              onClick={(e) => toggleFAQ(index, e)}
              whileHover={{ backgroundColor: '#FAFAFA', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  gap: '1rem',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #D0D0D0',
                    borderRadius: '4px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#719D76"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                    fontWeight: 400,
                    color: '#000',
                    paddingRight: '0.5rem',
                  }}
                >
                  {faq.question}
                </div>

                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    width: '24px',
                    height: '24px',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#999"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </motion.div>
              </div>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ 
                      overflow: 'hidden',
                      willChange: 'height',
                    }}
                  >
                    <div
                      style={{
                        padding: '0 1.5rem 1.25rem 4.75rem',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        color: '#666',
                        lineHeight: '1.6',
                      }}
                    >
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

