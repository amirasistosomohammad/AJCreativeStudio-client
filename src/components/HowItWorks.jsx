import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    number: 1,
    title: 'Pick a template',
    description: 'Browse our collection and choose the perfect template for your needs'
  },
  {
    number: 2,
    title: 'Checkout securely',
    description: 'Complete your purchase and receive instant access via email'
  },
  {
    number: 3,
    title: 'Make Your Own Copy',
    description: 'Open the link and create your personal copy in Google Sheets'
  }
];

const HowItWorks = () => {
  const [scrollDirection, setScrollDirection] = useState('down');
  const [visibleItems, setVisibleItems] = useState({});
  const lastScrollY = useRef(0);
  const sectionRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    // Track scroll direction
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track individual item visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = entry.target.dataset.itemId;
          if (itemId) {
            setVisibleItems((prev) => ({
              ...prev,
              [itemId]: entry.isIntersecting,
            }));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    // Observe all items
    Object.values(itemRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      Object.values(itemRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="how-it-works"
      style={{
        padding: '4rem clamp(1rem, 8vw, 200px)',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div
        className="how-it-works-container"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Main Title */}
        <motion.h2
          className="how-it-works-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: '#000',
            textAlign: 'center',
            marginBottom: '1.5rem',
            marginTop: 0,
          }}
        >
          How It Works?
        </motion.h2>

        {/* Steps Container */}
        <motion.div
          className="how-it-works-steps"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '2rem',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <AnimatePresence>
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                id={`step-item-${index}`}
                ref={(el) => {
                  if (el) {
                    el.dataset.itemId = `item-${index}`;
                    itemRefs.current[`item-${index}`] = el;
                  }
                }}
                initial={{ opacity: 0, y: 25 }}
                animate={{
                  opacity: visibleItems[`item-${index}`] ? 1 : 0,
                  y: visibleItems[`item-${index}`]
                    ? 0
                    : scrollDirection === 'down'
                    ? -25
                    : 25,
                }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  delay: index * 0.15,
                  duration: 1.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="how-it-works-step"
                style={{
                  flex: '1',
                  minWidth: '250px',
                  maxWidth: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Numbered Circle */}
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: '4px solid #719D76',
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '2.75rem',
                      fontWeight: 900,
                      color: '#719D76',
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Step Title */}
                <h3
                  style={{
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)',
                    fontWeight: 600,
                    color: '#333333',
                    marginBottom: '0.75rem',
                    marginTop: 0,
                  }}
                >
                  {step.title}
                </h3>

                {/* Step Description */}
                <p
                  style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                    fontWeight: 400,
                    color: '#333',
                    lineHeight: '1.6',
                    margin: 0,
                    maxWidth: '100%',
                  }}
                >
                  {step.description}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
