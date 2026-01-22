import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection = ({ config, section }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const steps = config.steps || [];
  const title = config.title || section?.title || 'How It Works';
  const layout = config.layout || 'horizontal';
  const backgroundColor = config.backgroundColor || '#FFFFFF';

  if (steps.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="how-it-works"
      style={{
        padding: '4rem clamp(1rem, 8vw, 200px)',
        backgroundColor: backgroundColor,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.8 }}
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: '#000',
            textAlign: 'center',
            marginBottom: '3rem',
          }}
        >
          {title}
        </motion.h2>

        <div style={{
          display: layout === 'vertical' ? 'flex' : 'grid',
          flexDirection: layout === 'vertical' ? 'column' : 'row',
          gridTemplateColumns: layout === 'horizontal' ? `repeat(${steps.length}, 1fr)` : '1fr',
          gap: '2rem',
          alignItems: 'stretch',
        }}>
          {steps.map((step, index) => (
            <motion.div
              key={step.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: index * 0.2 }}
              style={{
                backgroundColor: '#FFFFFF',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                flex: 1,
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: '0 auto 1.5rem',
              }}>
                {step.number || index + 1}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#000',
                marginBottom: '1rem',
              }}>
                {step.title}
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

