import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation';

// Generate detailed product thumbnail with multiple device mockups
const getProductThumbnail = (productType, bgColor, accentColor, deviceType) => {
  let svgContent = '';
  
  // For first two reviews, show three devices (desktop, tablet, phone)
  if (deviceType === 'laptop' || deviceType === 'tablet') {
    svgContent = `<svg width="240" height="140" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="140" fill="transparent"/>
      <!-- Desktop/Laptop -->
      <rect x="10" y="20" width="70" height="50" fill="#E5E5E5" rx="2"/>
      <rect x="12" y="22" width="66" height="44" fill="#FFFFFF" rx="1" stroke="#D0D0D0" stroke-width="0.5"/>
      <rect x="12" y="22" width="66" height="8" fill="#4CAF50" rx="1 1 0 0"/>
      <text x="45" y="28" font-family="Arial, sans-serif" font-size="5" font-weight="600" fill="#FFFFFF" text-anchor="middle">INVENTORY</text>
      ${Array.from({length: 3}, (_, i) => {
        const y = 32 + (i * 11);
        return `<rect x="14" y="${y}" width="62" height="9" fill="${i % 2 === 0 ? '#F8F9FA' : '#FFFFFF'}" stroke="#E0E0E0" stroke-width="0.3"/>`;
      }).join('')}
      
      <!-- Tablet -->
      <rect x="90" y="30" width="50" height="38" fill="#2C2C2C" rx="3"/>
      <rect x="92" y="32" width="46" height="34" fill="#FFFFFF" rx="2"/>
      <rect x="92" y="32" width="46" height="6" fill="#4CAF50" rx="2 2 0 0"/>
      <text x="115" y="37" font-family="Arial, sans-serif" font-size="4" font-weight="600" fill="#FFFFFF" text-anchor="middle">TRACKER</text>
      ${Array.from({length: 2}, (_, i) => {
        const y = 40 + (i * 12);
        return `<rect x="94" y="${y}" width="42" height="10" fill="${i % 2 === 0 ? '#F8F9FA' : '#FFFFFF'}" stroke="#E0E0E0" stroke-width="0.3" rx="1"/>`;
      }).join('')}
      
      <!-- Mobile Phone -->
      <rect x="150" y="35" width="28" height="48" fill="#1A1A1A" rx="3"/>
      <rect x="152" y="37" width="24" height="44" fill="#FFFFFF" rx="2"/>
      <rect x="152" y="37" width="24" height="5" fill="#4CAF50" rx="2 2 0 0"/>
      <text x="164" y="41" font-family="Arial, sans-serif" font-size="3" font-weight="600" fill="#FFFFFF" text-anchor="middle">SALES</text>
      ${Array.from({length: 2}, (_, i) => {
        const y = 44 + (i * 17);
        return `<rect x="154" y="${y}" width="20" height="14" fill="${i % 2 === 0 ? '#F8F9FA' : '#FFFFFF'}" stroke="#E0E0E0" stroke-width="0.3" rx="1"/>`;
      }).join('')}
    </svg>`;
  } else {
    // Single laptop for other reviews
    svgContent = `<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="120" fill="transparent"/>
      <!-- Laptop -->
      <rect x="30" y="20" width="140" height="90" fill="#E5E5E5" rx="2"/>
      <rect x="32" y="22" width="136" height="82" fill="#FFFFFF" rx="1" stroke="#D0D0D0" stroke-width="0.5"/>
      <rect x="32" y="22" width="136" height="12" fill="#4CAF50" rx="1 1 0 0"/>
      <text x="100" y="30" font-family="Arial, sans-serif" font-size="7" font-weight="600" fill="#FFFFFF" text-anchor="middle">${productType.split(' ')[0].toUpperCase()}</text>
      ${Array.from({length: 4}, (_, i) => {
        const y = 36 + (i * 15);
        return `<rect x="36" y="${y}" width="128" height="12" fill="${i % 2 === 0 ? '#F8F9FA' : '#FFFFFF'}" stroke="#E0E0E0" stroke-width="0.3"/>`;
      }).join('')}
    </svg>`;
  }
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
};

const testimonials = [
  {
    id: 1,
    rating: 5,
    title: 'Very Reliable',
    text: 'This template has completely transformed how I manage my business operations. The inventory tracking is intuitive and the sales reports are incredibly detailed.',
    name: 'Evita Veron Carig',
    productType: 'Inventory Management & Sales Tracker',
    productColor: '#E8F5E9',
    productAccent: '#4CAF50',
    deviceType: 'laptop'
  },
  {
    id: 2,
    rating: 5,
    title: 'Easy Inventory Tracker',
    text: 'I love how user-friendly this template is. It took me just minutes to set up and start tracking my inventory. The automated calculations save me hours every week.',
    name: 'Ryan P.',
    productType: 'Inventory Management & Sales Tracker',
    productColor: '#E3F2FD',
    productAccent: '#2196F3',
    deviceType: 'tablet'
  },
  {
    id: 3,
    rating: 5,
    title: 'Lifechanging tool for my small business!',
    text: 'As a small business owner, this template has been a game-changer. I can now track everything in one place and make data-driven decisions with confidence.',
    name: 'Mikaela Padilla',
    productType: 'Inventory Management & Sales Tracker',
    productColor: '#FFF9C4',
    productAccent: '#FFC107',
    deviceType: 'mobile'
  },
  {
    id: 4,
    rating: 5,
    title: 'Perfect for tracking everything',
    text: 'The best investment I\'ve made for my business. The template is well-organized, easy to customize, and the video tutorials made setup a breeze.',
    name: 'Sarah Johnson',
    productType: 'Inventory Management & Sales Tracker',
    productColor: '#FCE4EC',
    productAccent: '#E91E63',
    deviceType: 'laptop'
  },
  {
    id: 5,
    rating: 5,
    title: 'Highly recommend!',
    text: 'This template exceeded my expectations. The level of detail and functionality is impressive. It has streamlined my entire workflow.',
    name: 'Michael Chen',
    productType: 'Inventory Management & Sales Tracker',
    productColor: '#E1BEE7',
    productAccent: '#9C27B0',
    deviceType: 'tablet'
  }
];

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
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

  return (
    <section
      ref={sectionRef}
      className="testimonials-section"
      style={{
        padding: '4rem clamp(1rem, 8vw, 200px)',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Title */}
        <motion.h2
          className="testimonials-title"
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
          What Our Users Are Saying
        </motion.h2>

        {/* Swiper Container */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              992: {
                slidesPerView: 3,
              },
            }}
            navigation={{
              nextEl: '.testimonials-button-next',
              prevEl: '.testimonials-button-prev',
            }}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={true}
            style={{
              paddingBottom: '0.5rem',
            }}
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={testimonial.id}>
                <div
                  className="testimonial-card"
                  style={{
                    backgroundColor: 'transparent',
                    padding: '1.5rem',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  {/* Star Rating */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.25rem',
                      marginBottom: '0.75rem',
                      justifyContent: 'center',
                    }}
                  >
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <svg
                        key={i}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="#FFD700"
                        stroke="#FFD700"
                        strokeWidth="1"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>

                  {/* Review Title */}
                  <h3
                    style={{
                      fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                      fontWeight: 600,
                      color: '#000',
                      marginBottom: '0.75rem',
                      marginTop: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {testimonial.title}
                    {index === 0 && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#FFD700"
                        stroke="#FFD700"
                        strokeWidth="1"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                  </h3>

                  {/* Review Text */}
                  <p
                    style={{
                      fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                      color: '#666',
                      lineHeight: '1.6',
                      marginBottom: '1rem',
                      marginTop: 0,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textAlign: 'center',
                    }}
                  >
                    {testimonial.text}
                  </p>

                  {/* Reviewer Name */}
                  <div
                    style={{
                      fontSize: 'clamp(0.85rem, 1.6vw, 0.95rem)',
                      color: '#999',
                      fontWeight: 400,
                      marginBottom: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    {testimonial.name}
                  </div>

                  {/* Product Thumbnail */}
                  <div
                    style={{
                      width: 'auto',
                      maxWidth: '200px',
                      height: 'auto',
                      margin: '0 auto',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={getProductThumbnail(
                        testimonial.productType,
                        testimonial.productColor,
                        testimonial.productAccent,
                        testimonial.deviceType
                      )}
                      alt={testimonial.productType}
                      style={{
                        width: '180px',
                        height: 'auto',
                        maxHeight: '120px',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows */}
          <div
            className="testimonials-navigation-wrapper"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.5rem',
              marginTop: '1rem',
            }}
          >
            <button
              className="testimonials-button-prev"
              style={{
                background: '#F0F0F0',
                border: 'none',
                borderRadius: '50%',
                width: 'clamp(36px, 4vw, 48px)',
                height: 'clamp(36px, 4vw, 48px)',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg
                className="testimonials-button-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: 'clamp(18px, 2vw, 24px)',
                  height: 'clamp(18px, 2vw, 24px)',
                }}
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button
              className="testimonials-button-next"
              style={{
                background: '#F0F0F0',
                border: 'none',
                borderRadius: '50%',
                width: 'clamp(36px, 4vw, 48px)',
                height: 'clamp(36px, 4vw, 48px)',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg
                className="testimonials-button-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: 'clamp(18px, 2vw, 24px)',
                  height: 'clamp(18px, 2vw, 24px)',
                }}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
