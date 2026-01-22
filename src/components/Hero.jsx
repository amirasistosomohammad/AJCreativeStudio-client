import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Hero = ({ onSlideChange, swiperRef }) => {
  const [scrollDirection, setScrollDirection] = useState("down");
  const [isVisible, setIsVisible] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const lastScrollY = useRef(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Get navbar height from CSS variable and update on resize
    const updateNavbarHeight = () => {
      const height = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height');
      if (height) {
        setNavbarHeight(parseInt(height, 10) || 0);
      }
    };

    updateNavbarHeight();
    const interval = setInterval(updateNavbarHeight, 100);
    window.addEventListener('resize', updateNavbarHeight);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  useEffect(() => {
    // Track scroll direction
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? "down" : "up";
      setScrollDirection(direction);
      lastScrollY.current = currentScrollY;
    };

    // Observe section visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const slides = [
    {
      title: 'Need a Christmas Planner?',
      subtitle: 'Gift Tracker, Budget Planner, To-Do List & More!',
      buttonText: 'Shop all Spreadsheets',
      image: '/laptop-spreadsheet.jpg' // You can replace this with actual image
    },
    {
      title: 'Need a Christmas Planner?',
      subtitle: 'Gift Tracker, Budget Planner, To-Do List & More!',
      buttonText: 'Shop all Spreadsheets',
      image: '/laptop-spreadsheet.jpg'
    },
    {
      title: 'Need a Christmas Planner?',
      subtitle: 'Gift Tracker, Budget Planner, To-Do List & More!',
      buttonText: 'Shop all Spreadsheets',
      image: '/laptop-spreadsheet.jpg'
    },
    {
      title: 'Need a Christmas Planner?',
      subtitle: 'Gift Tracker, Budget Planner, To-Do List & More!',
      buttonText: 'Shop all Spreadsheets',
      image: '/laptop-spreadsheet.jpg'
    },
    {
      title: 'Need a Christmas Planner?',
      subtitle: 'Gift Tracker, Budget Planner, To-Do List & More!',
      buttonText: 'Shop all Spreadsheets',
      image: '/laptop-spreadsheet.jpg'
    }
  ];

  return (
    <section ref={sectionRef} className="hero-wrapper" style={{ 
      backgroundColor: '#FFFFFF',
      position: 'relative',
      // Match horizontal padding pattern of ShopByCategory (3rem top, 1rem sides, 4rem bottom)
      // Responsive: uses CSS variable that updates on resize for consistent spacing across all screen sizes
      // Same spacing on mobile and desktop - uses navbar height directly
      paddingTop: 'var(--navbar-height, 0)',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      paddingBottom: '4rem',
      marginTop: '0px',
    }}>
      {/* Background pattern covering the entire hero-wrapper area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.1 : 0 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }}
      />
      {/* Slider area wrapper */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative' }}
      >

        <Swiper
          className="hero-swiper"
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={true}
          pagination={{ 
            clickable: true,
            renderBullet: (index, className) => {
              return `<span class="${className}" style="background-color: #0066CC; width: 12px; height: 12px; margin: 0 4px;"></span>`;
            }
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={true}
          onSwiper={(swiper) => {
            if (swiperRef) {
              swiperRef.current = swiper;
            }
            // Initialize with first slide
            if (onSlideChange) {
              onSlideChange(1);
            }
          }}
          onSlideChange={(swiper) => {
            if (onSlideChange) {
              const realIndex = swiper.realIndex + 1;
              onSlideChange(realIndex);
            }
          }}
          style={{ 
            paddingTop: '0',
            paddingBottom: '2.25rem',
          }}
        >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            {/* Match horizontal container behavior of ShopByCategory */}
            <div
              style={{
                maxWidth: '1100px',
                margin: '0 auto',
                height: '100%',
              }}
            >
              <div className="row h-100 align-items-center">
                <div className="col-lg-6 col-md-6">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ 
                      opacity: isVisible ? 1 : 0,
                      x: isVisible ? 0 : -50
                    }}
                    transition={{ duration: 1.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'relative', zIndex: 2, pointerEvents: isVisible ? 'auto' : 'none' }}
                  >
                    {/* Laptop mockup */}
                    <div style={{
                      position: 'relative',
                      transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                      transformStyle: 'preserve-3d'
                    }}>
                      {/* Laptop base */}
                      <div style={{
                        width: '100%',
                        maxWidth: '600px',
                        margin: '0 auto',
                        backgroundColor: '#E5E5E5',
                        borderRadius: '12px',
                        padding: '8px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                      }}>
                        {/* Screen */}
                        <div style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '2px solid #D0D0D0'
                        }}>
                          {/* Spreadsheet mockup */}
                          <div style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid #E0E0E0'
                          }}>
                            {/* Header row */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(7, 1fr)',
                              backgroundColor: '#F8F8F8',
                              borderBottom: '2px solid #E0E0E0'
                            }}>
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                <div key={i} style={{
                                  padding: '8px',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  fontSize: '0.75rem',
                                  color: '#333',
                                  borderRight: i < 6 ? '1px solid #E0E0E0' : 'none'
                                }}>
                                  {day}
                                </div>
                              ))}
                            </div>
                            {/* Data rows */}
                            {[
                              ['#E8F5E9', '#E8F5E9', '#FFF9C4', '', '#FFEBEE', '#E3F2FD', '#E8F5E9'],
                              ['#FFF9C4', '', '#E8F5E9', '#E3F2FD', '#FFF9C4', '', '#FFEBEE'],
                              ['', '#FFEBEE', '#E3F2FD', '#E8F5E9', '', '#FFF9C4', '#E3F2FD'],
                              ['#E3F2FD', '#FFF9C4', '', '#FFEBEE', '#E8F5E9', '#E3F2FD', ''],
                              ['#FFEBEE', '#E8F5E9', '#FFF9C4', '#E3F2FD', '#FFEBEE', '', '#E8F5E9'],
                              ['', '#E3F2FD', '#FFEBEE', '#FFF9C4', '#E8F5E9', '#FFEBEE', '#FFF9C4'],
                              ['#E8F5E9', '', '#E3F2FD', '#E8F5E9', '#FFF9C4', '#E3F2FD', '#FFEBEE'],
                              ['#FFF9C4', '#FFEBEE', '#E8F5E9', '', '#E3F2FD', '#E8F5E9', '#FFF9C4']
                            ].map((row, rowIdx) => (
                              <div key={rowIdx} style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                borderBottom: '1px solid #E0E0E0'
                              }}>
                                {row.map((bgColor, colIdx) => (
                                  <div key={colIdx} style={{
                                    padding: '6px 4px',
                                    fontSize: '0.65rem',
                                    textAlign: 'center',
                                    backgroundColor: bgColor || '#FFFFFF',
                                    borderRight: colIdx < 6 ? '1px solid #E0E0E0' : 'none',
                                    minHeight: '24px'
                                  }}>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="col-lg-6 col-md-6">
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ 
                      opacity: isVisible ? 1 : 0,
                      x: isVisible ? 0 : 50
                    }}
                    transition={{ duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ 
                      position: 'relative', 
                      zIndex: 2,
                      marginTop: '2rem',
                      marginBottom: '2rem',
                      pointerEvents: isVisible ? 'auto' : 'none'
                    }}
                  >
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '3rem 2.5rem',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      maxWidth: '500px',
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}>
                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: isVisible ? 1 : 0,
                          y: isVisible ? 0 : 20
                        }}
                        transition={{ duration: 1.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: '700',
                          color: '#000',
                          marginBottom: '1rem',
                          lineHeight: '1.2',
                          textAlign: 'center',
                        }}
                      >
                        {slide.title}
                      </motion.h1>
                      
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: isVisible ? 1 : 0,
                          y: isVisible ? 0 : 20
                        }}
                        transition={{ duration: 1.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          fontSize: '1.1rem',
                          color: '#333',
                          marginBottom: '2rem',
                          lineHeight: '1.6',
                          textAlign: 'center',
                        }}
                      >
                        {slide.subtitle}
                      </motion.p>

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <motion.button
                          className="hero-cta-btn"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ 
                            opacity: isVisible ? 1 : 0,
                            scale: isVisible ? 1 : 0.9
                          }}
                          transition={{ duration: 1.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          whileHover={{ y: -2, backgroundColor: '#222222' }}
                          whileTap={{ y: 0 }}
                          style={{
                            padding: '0.9rem 1.5rem',
                            backgroundColor: '#000000',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.98rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {slide.buttonText}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        </Swiper>
      </motion.div>
    </section>
  );
};

export default Hero;

