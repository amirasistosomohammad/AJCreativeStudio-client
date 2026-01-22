import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqData = [
  {
    id: 1,
    question: 'What products do you sell?',
    answer: 'We offer a wide range of digital spreadsheet templates including habit trackers, budget planners, productivity dashboards, business templates, social media calendars, and more. All templates are designed to help you organize and manage your personal or professional life efficiently.'
  },
  {
    id: 2,
    question: 'Why buy our templates?',
    answer: 'Our templates are professionally designed, fully customizable, and come with detailed video tutorials. They save you hours of work and help you stay organized. Each template is carefully crafted to be user-friendly and includes all the features you need to get started immediately.'
  },
  {
    id: 3,
    question: 'How to access after purchase?',
    answer: 'After completing your purchase, you will receive an email confirmation with a direct link to access your template. Simply click the link, and you can immediately make your own copy in Google Sheets. The link will be available in your email inbox within minutes of purchase.'
  },
  {
    id: 4,
    question: 'Does it work with both Excel and Google Sheets?',
    answer: 'Yes! Our templates are compatible with both Google Sheets and Microsoft Excel. When you purchase a template, you receive a Google Sheets link that you can use directly, or you can download it and open it in Excel. All formulas and formatting are designed to work seamlessly in both platforms.'
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="faq-section"
      style={{
        padding: '4rem clamp(1rem, 8vw, 200px)',
        backgroundColor: '#F3F3F3',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* Title */}
        <motion.h2
          className="faq-title"
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
          Frequently Asked Questions
        </motion.h2>

        {/* FAQ Items */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {faqData.map((faq, index) => (
            <motion.div
              key={faq.id}
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
              {/* Question Bar */}
              <div
                className="faq-question-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  gap: '1rem',
                  position: 'relative',
                }}
              >
                {/* Checkmark Icon */}
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

                {/* Question Text */}
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

                {/* Chevron Icon */}
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

              {/* Answer Content */}
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
                      className="faq-answer"
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

export default FAQ;
