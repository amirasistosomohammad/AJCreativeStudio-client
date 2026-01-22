import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Completely custom, Swiper-free hero slider
// We control everything with simple React state + CSS
const HeroSection = ({ config }) => {
  const slides = Array.isArray(config?.slides) ? config.slides : [];
  const autoplay = config?.autoplay !== false;
  const autoplayDelay = config?.autoplayDelay ?? 5000;
  const showNavigation = config?.showNavigation !== false;
  const showPagination = config?.showPagination !== false;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Simple autoplay using setInterval
  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [autoplay, autoplayDelay, slides.length]);

  // Render nothing if there are no slides (after hooks so hook order is stable across renders)
  if (slides.length === 0) {
    return null;
  }

  // Defensive: if slides shrink, keep rendering using a safe index without triggering extra renders.
  const safeIndex = ((currentIndex % slides.length) + slides.length) % slides.length;

  const goToSlide = (index) => {
    if (index < 0) {
      setCurrentIndex(slides.length - 1);
    } else if (index >= slides.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(index);
    }
  };

  return (
    <>
      <style>{`
        .hero-slider-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          /* No top padding - sits directly below navbar */
          padding-top: 0;
          padding-bottom: 0.5rem;
          box-sizing: border-box;
        }

        .hero-slides-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.6s ease, visibility 0.6s ease;
          z-index: 1;
          box-sizing: border-box;
        }

        .hero-slide.hero-slide-active {
          opacity: 1;
          visibility: visible;
          position: relative;
          z-index: 1;
        }

        .hero-slide-background {
          width: 100%;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border-radius: 12px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .hero-slide-content {
          background-color: rgba(255, 255, 255, 0.9);
          padding: 3rem 2.5rem;
          border-radius: 12px;
          max-width: 600px;
          width: calc(100% - 2rem);
          text-align: center;
          box-sizing: border-box;
          margin: 0 auto;
        }

        .hero-nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.92);
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #111;
          transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, opacity 160ms ease;
          opacity: 0.95;
          z-index: 20;
          pointer-events: auto;
        }

        .hero-nav-button.prev {
          left: 0.75rem;
        }

        .hero-nav-button.next {
          right: 0.75rem;
        }

        .hero-nav-button:hover {
          opacity: 1;
          transform: translateY(-50%) scale(1.03);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.16);
          border-color: rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.96);
        }

        .hero-nav-button:active {
          transform: translateY(-50%) scale(0.98);
        }

        .hero-nav-icon {
          width: 18px;
          height: 18px;
          display: block;
        }

        .hero-dots {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
          margin-top: 0.5rem;
        }

        .hero-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background-color: #d0e4ff;
          border: none;
          cursor: pointer;
        }

        .hero-dot.hero-dot-active {
          background-color: #0066CC;
        }

        .hero-button {
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .hero-button:hover {
          background-color: #6B7280 !important;
          transform: translateY(-1px);
        }

        .hero-button:active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .hero-wrapper {
            overflow-x: hidden;
            overflow-y: visible;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .hero-slider-container {
            padding-top: 0;
            padding-bottom: 0.25rem;
            overflow-x: hidden;
            overflow-y: visible;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .hero-slides-wrapper {
            overflow-x: hidden;
            overflow-y: visible;
            width: 100%;
            box-sizing: border-box;
          }

          .hero-slide {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            overflow-y: visible;
            box-sizing: border-box;
          }

          .hero-slide-background {
            height: 400px;
            width: 100%;
            max-width: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            overflow-x: hidden;
            overflow-y: hidden;
            box-sizing: border-box;
          }

          .hero-slide-content {
            padding: 2rem 1.5rem;
            max-width: calc(100% - 1rem);
            width: calc(100% - 1rem);
            box-sizing: border-box;
            margin: 0 auto;
          }

          .hero-nav-button.prev {
            left: 0.5rem;
          }

          .hero-nav-button.next {
            right: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .hero-slide-background {
            height: 360px;
          }

          .hero-slide-content {
            padding: 1.5rem 1.25rem;
            max-width: calc(100% - 0.5rem);
            width: calc(100% - 0.5rem);
          }
        }
      `}</style>

      <section
        className="hero-wrapper"
        style={{
          backgroundColor: config?.backgroundColor || '#FFFFFF',
          position: 'relative',
          paddingTop: 'calc(var(--navbar-height, 0) - 24px)',
          // Let inner container handle horizontal padding to match Navbar
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: '4rem',
          marginTop: '0px',
          marginBottom: '0px',
          overflowX: 'hidden',
          overflowY: 'visible',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Outer wrapper with the same horizontal padding as Navbar (1rem) */}
        <div
          style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            overflowX: 'hidden',
            overflowY: 'visible',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Inner container with the same max width and centering as Navbar */}
          <div
            className="hero-slider-container"
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
          <div className="hero-slides-wrapper">
            {slides.map((slide, index) => {
              const isActive = index === safeIndex;
              const title = slide.title || '';
              const subtitle = slide.subtitle || '';
              const buttonText = slide.buttonText || '';
              const buttonLink = slide.buttonLink || '';
              const buttonColor = slide.buttonColor || '#000000';
              const textColor = slide.textColor || '#000';
              const image = slide.image || '';

              return (
                <div
                  key={`hero-slide-${index}`}
                  className={`hero-slide ${isActive ? 'hero-slide-active' : ''}`}
                >
                  <div
                    className="hero-slide-background"
                    style={{
                      backgroundImage: image ? `url(${image})` : 'none',
                    }}
                  >
                    <div className="hero-slide-content">
                      {title && (
                        <h1
                          style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                            fontWeight: '700',
                            color: textColor,
                            marginBottom: '1rem',
                            lineHeight: '1.2',
                          }}
                        >
                          {title}
                        </h1>
                      )}

                      {subtitle && (
                        <p
                          style={{
                            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                            color: textColor === '#000' ? '#333' : textColor,
                            marginBottom: '2rem',
                            lineHeight: '1.6',
                          }}
                        >
                          {subtitle}
                        </p>
                      )}

                      {buttonText && (
                        <div>
                          {buttonLink ? (
                            <Link
                              to={buttonLink}
                              className="hero-button"
                              style={{
                                display: 'inline-block',
                                padding: '0.9rem 1.5rem',
                                backgroundColor: buttonColor,
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: 'clamp(0.85rem, 1.5vw, 0.98rem)',
                                fontWeight: 600,
                                textDecoration: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {buttonText}
                            </Link>
                          ) : (
                            <button
                              className="hero-button"
                              style={{
                                padding: '0.9rem 1.5rem',
                                backgroundColor: buttonColor,
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: 'clamp(0.85rem, 1.5vw, 0.98rem)',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {buttonText}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {showNavigation && slides.length > 1 && (
              <>
                <button
                  className="hero-nav-button prev"
                  type="button"
                  onClick={() => goToSlide(safeIndex - 1)}
                >
                  <svg
                    className="hero-nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M15 6L9 12L15 18"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  className="hero-nav-button next"
                  type="button"
                  onClick={() => goToSlide(safeIndex + 1)}
                >
                  <svg
                    className="hero-nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M9 6L15 12L9 18"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>

          {showPagination && slides.length > 1 && (
            <div className="hero-dots">
              {slides.map((_, index) => (
                <button
                  key={`hero-dot-${index}`}
                  type="button"
                  className={`hero-dot ${
                    index === safeIndex ? 'hero-dot-active' : ''
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
