import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TestimonialsSection = ({ config, section }) => {
  const sectionRef = useRef(null);

  const allTestimonials = config.testimonials || [];
  const testimonials = allTestimonials
    .filter((testimonial) => testimonial?.is_active !== false)
    .sort((a, b) => (a?.order || 0) - (b?.order || 0));
  const title = config.title || section?.title || 'What Our Customers Say';
  const displayStyle = config.displayStyle || 'slider';
  const autoRotate = config.autoRotate !== false;
  const backgroundColor = config.backgroundColor || '#FFFFFF';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 1;
    }
    return 4;
  });

  if (testimonials.length === 0) {
    return null;
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#FFC107' : '#E0E0E0' }}>
        ★
      </span>
    ));
  };

  // Slider responsive behavior (match ProductGridSection)
  useEffect(() => {
    if (displayStyle !== 'slider') return;
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSlidesToShow(1);
      } else {
        setSlidesToShow(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayStyle]);

  // Reset slider when data changes
  useEffect(() => {
    if (displayStyle === 'slider') {
      setCurrentSlide(0);
    }
  }, [displayStyle, testimonials.length, slidesToShow]);

  // Auto-rotate slider
  useEffect(() => {
    if (displayStyle !== 'slider' || !autoRotate) return;
    if (testimonials.length <= slidesToShow) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= testimonials.length - slidesToShow) {
          return 0;
        }
        return prev + 1;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [displayStyle, autoRotate, testimonials.length, slidesToShow]);

  const renderTestimonialCard = (testimonial, index, isSlider = false) => {
    const isCompact = slidesToShow === 1;
    const cardStyle = isSlider ? {
      maxWidth: '520px',
      width: '100%',
      margin: '0 auto',
    } : {};

    return (
      <motion.div
        key={testimonial.id || index}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ delay: index * 0.1 }}
        style={{
          backgroundColor: '#FFFFFF',
          padding: isCompact ? '1.25rem' : '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: '100%',
          ...cardStyle,
        }}
      >
        <div style={{ marginBottom: isCompact ? '0.75rem' : '1rem', fontSize: isCompact ? '0.85rem' : '1rem' }}>
          {renderStars(testimonial.rating || 5)}
        </div>
        <p style={{ marginBottom: isCompact ? '0.75rem' : '1rem', color: '#666', lineHeight: '1.5', fontSize: isCompact ? '0.9rem' : '1rem' }}>
          {testimonial.content || testimonial.text}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '0.75rem' : '1rem' }}>
          {testimonial.image && (
            <img
              src={testimonial.image}
              alt={testimonial.name}
              style={{
                width: isCompact ? '40px' : '50px',
                height: isCompact ? '40px' : '50px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#000', fontSize: isCompact ? '0.9rem' : '1rem' }}>
              {testimonial.name}
            </div>
            {testimonial.role && (
              <div style={{ fontSize: isCompact ? '0.8rem' : '0.9rem', color: '#666' }}>
                {testimonial.role}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (displayStyle === 'grid') {
    return (
      <section
        ref={sectionRef}
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {testimonials.map((testimonial, index) => renderTestimonialCard(testimonial, index))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{
        padding: slidesToShow === 1 ? '2.5rem 1rem 3rem' : '4rem clamp(1rem, 8vw, 200px)',
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
            fontSize: slidesToShow === 1 ? 'clamp(1.4rem, 6vw, 2rem)' : 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: '#000',
            textAlign: 'center',
            marginBottom: slidesToShow === 1 ? '2rem' : '3rem',
          }}
        >
          {title}
        </motion.h2>

        <div className="testimonials-slider-wrapper" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <div
            className="testimonials-slider-container"
            style={{
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              className="testimonials-slider-track"
              style={{
                display: 'flex',
                transform: slidesToShow === 4
                  ? `translateX(calc(-${currentSlide} * (25% + 0.75rem)))`
                  : slidesToShow === 1
                    ? `translateX(calc(-${currentSlide} * (100% + 1rem)))`
                    : `translateX(calc(-${currentSlide} * (50% + 0.75rem)))`,
                transition: 'transform 0.5s ease-in-out',
                gap: slidesToShow === 1 ? '1rem' : slidesToShow === 2 ? '0.75rem' : '2rem',
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id || index}
                  className="testimonial-slider-item"
                  style={{
                    flex: slidesToShow === 4
                      ? '0 0 calc(25% - 1.5rem)'
                      : slidesToShow === 1
                        ? '0 0 calc(100% - 1rem)'
                        : '0 0 calc(50% - 0.75rem)',
                    minWidth: 0,
                  }}
                >
                  {renderTestimonialCard(testimonial, index, false)}
                </div>
              ))}
            </div>

            {testimonials.length > slidesToShow && (
              <>
                <button
                  className="testimonial-slider-nav-btn testimonial-slider-nav-prev"
                  onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  style={{
                    position: 'absolute',
                    left: slidesToShow === 2 ? '0.5rem' : '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: slidesToShow === 2 ? '36px' : '44px',
                    height: slidesToShow === 2 ? '36px' : '44px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    borderRadius: '999px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 20,
                    pointerEvents: 'auto',
                    transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, opacity 160ms ease',
                    opacity: currentSlide === 0 ? 0.5 : 0.95,
                  }}
                  onMouseEnter={(e) => {
                    if (currentSlide > 0) {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 14px 36px rgba(0, 0, 0, 0.16)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = currentSlide === 0 ? 0.5 : 0.95;
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.12)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 6L9 12L15 18" />
                  </svg>
                </button>
                <button
                  className="testimonial-slider-nav-btn testimonial-slider-nav-next"
                  onClick={() => setCurrentSlide((prev) => Math.min(testimonials.length - slidesToShow, prev + 1))}
                  disabled={currentSlide >= testimonials.length - slidesToShow}
                  style={{
                    position: 'absolute',
                    right: slidesToShow === 2 ? '0.5rem' : '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: slidesToShow === 2 ? '36px' : '44px',
                    height: slidesToShow === 2 ? '36px' : '44px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    borderRadius: '999px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    cursor: currentSlide >= testimonials.length - slidesToShow ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 20,
                    pointerEvents: 'auto',
                    transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, opacity 160ms ease',
                    opacity: currentSlide >= testimonials.length - slidesToShow ? 0.5 : 0.95,
                  }}
                  onMouseEnter={(e) => {
                    if (currentSlide < testimonials.length - slidesToShow) {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 14px 36px rgba(0, 0, 0, 0.16)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = currentSlide >= testimonials.length - slidesToShow ? 0.5 : 0.95;
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.12)';
                  }}
                >
                  <svg width={slidesToShow === 2 ? "14" : "18"} height={slidesToShow === 2 ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6L15 12L9 18" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {testimonials.length > slidesToShow && (
            <div
              className="testimonial-slider-dots"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.4rem',
                marginTop: '0.75rem',
              }}
            >
              {Array.from({ length: Math.max(1, testimonials.length - slidesToShow + 1) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`testimonial-slider-dot ${currentSlide === index ? 'testimonial-slider-dot-active' : ''}`}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '999px',
                    backgroundColor: currentSlide === index ? '#0066CC' : '#d0e4ff',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

