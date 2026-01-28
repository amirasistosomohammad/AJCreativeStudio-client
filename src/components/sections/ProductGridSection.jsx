import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../../contexts/CartContext';
import { getProductImage, formatCurrency } from '../../utils/productImageUtils';

const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to match slug style used in Products.jsx
const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const DynamicProductSection = ({ section }) => {
  const navigate = useNavigate();
  const { addToCart, setCartOpen } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [visibleItems, setVisibleItems] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const lastScrollY = useRef(0);
  const sectionRef = useRef(null);
  const itemRefs = useRef({});
  
  // Slider state
  const displayStyle = section.display_style || 'grid';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(4); // Default: 4 products on desktop
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!section?.is_active) return;
    fetchProducts();
  }, [section]);

  useEffect(() => {
    if (products.length === 0) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      setScrollDirection(direction);
      lastScrollY.current = currentScrollY;
    };

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
      },
    );

    const observeItems = () => {
      Object.values(itemRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });
    };

    const timeoutId = setTimeout(observeItems, 100);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      Object.values(itemRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, [products]);

  // Detect screen size for responsive slider
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSlidesToShow(2); // 2 products on mobile/tablet
      } else {
        setSlidesToShow(4); // 4 products on desktop
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset slider position when products change or slidesToShow changes
  useEffect(() => {
    if (displayStyle === 'slider') {
      setCurrentSlide(0);
    }
  }, [products, displayStyle, slidesToShow]);

  // Auto-advance slider - only if we have more products than visible
  useEffect(() => {
    if (displayStyle === 'slider' && products.length > slidesToShow) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev >= products.length - slidesToShow) {
            return 0; // Loop back to start
          }
          return prev + 1;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [displayStyle, products.length, slidesToShow]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      if (!section.source_value) {
        console.warn('ProductGridSection: No source_value provided for section:', section.title);
        setProducts([]);
        return;
      }

      // Fetch products from collection by slug
      const response = await fetch(`${apiBaseUrl}/product-collections/slug/${section.source_value}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`ProductGridSection: Failed to fetch collection "${section.source_value}":`, response.status, response.statusText);
        setProducts([]);
        return;
      }

      const data = await response.json();
      let productsList = [];
      
      if (data.success && data.collection && data.collection.products) {
        productsList = data.collection.products.filter(product => product.is_active !== false);
      } else {
        console.warn(`ProductGridSection: No products found for collection "${section.source_value}"`);
      }

      // Limit to product_count
      const limitedProducts = productsList.slice(0, section.product_count || 4);
      setProducts(limitedProducts);

      // Initialize image loading states - only set to true if image doesn't exist in cache
      const initialLoadingStates = {};
      limitedProducts.forEach((product) => {
        const imageUrl = getProductImage(product);
        if (imageUrl) {
          // Check if image is already cached
          const img = new Image();
          img.src = imageUrl;
          // If image is already loaded (cached), don't show skeleton
          initialLoadingStates[product.id] = !img.complete;
        } else {
          initialLoadingStates[product.id] = false;
        }
      });
      setImageLoading(initialLoadingStates);
    } catch (error) {
      console.error('ProductGridSection: Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Note: early-return conditions must be AFTER hooks to keep hook order stable across renders.
  if (!section?.is_active) return null;
  if (!loading && products.length === 0) return null;

  const backgroundColor = section.name === 'new_arrivals' ? '#F3F3F3' : '#FFFFFF';

  // Render product card component
  const renderProductCard = (product, index, isSlider = false) => {
    const cardStyle = isSlider ? {
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
    } : {
      flex: '0 0 calc(25% - 1.125rem)',
      minWidth: 0,
    };

    return (
      <motion.div
        key={product.id}
        id={`product-item-${index}`}
        ref={(el) => {
          if (el && !isSlider) {
            el.dataset.itemId = `item-${index}`;
            itemRefs.current[`item-${index}`] = el;
          }
        }}
        initial={isSlider ? { opacity: 0 } : { opacity: 0, y: 25 }}
        animate={isSlider ? { opacity: 1 } : {
          opacity: visibleItems[`item-${index}`] ? 1 : 0,
          y: visibleItems[`item-${index}`] ? 0 : (scrollDirection === 'down' ? -25 : 25),
        }}
        exit={{ opacity: 0, y: 10 }}
        transition={isSlider ? { duration: 0.5 } : {
          delay: index * 0.04,
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="product-card"
        style={{
          ...cardStyle,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #E0E0E0',
        }}
        whileHover={!isSlider ? {
          y: -4,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          transition: { duration: 0.25, ease: 'easeOut' },
        } : {}}
      >
        <Link
          to={`/products/${createSlug(product.title)}`}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            flex: 1,
          }}
        >
          {/* Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1/1',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            {product.on_sale && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: '#4CAF50',
                  color: '#FFFFFF',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  zIndex: 2,
                }}
              >
                Sale
              </div>
            )}
            
            {imageLoading[product.id] && (
              <div
                className="skeleton-shimmer"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #E0E0E0 25%, #F5F5F5 50%, #E0E0E0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                  zIndex: 1,
                }}
              />
            )}
            
            <img
              src={getProductImage(product)}
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                opacity: imageLoading[product.id] ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
              onLoad={() => {
                setImageLoading((prev) => {
                  if (prev[product.id]) {
                    return { ...prev, [product.id]: false };
                  }
                  return prev;
                });
              }}
              onError={() => {
                setImageLoading((prev) => ({ ...prev, [product.id]: false }));
              }}
            />
          </div>

          {/* Content: title + price + Add to cart */}
          <div
            style={{
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            <motion.h3
              className="product-title"
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#000',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {product.title}
            </motion.h3>

            {product.category && (
              <div style={{ marginBottom: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                    lineHeight: 1.2,
                  }}
                >
                  {product.category}
                </span>
              </div>
            )}

            <div
              style={{
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {product.on_sale && product.old_price && (
                <span
                  style={{
                    fontSize: '0.9rem',
                    color: '#999',
                    textDecoration: 'line-through',
                  }}
                >
                  {formatCurrency(product.old_price)}
                </span>
              )}
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--primary-color)',
                }}
              >
                {formatCurrency(product.price)}
              </span>
            </div>

            <button
              className="add-to-cart"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#FFFFFF',
                color: '#000',
                border: '1px solid #000',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: 'auto',
              }}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const productToAdd = {
                  id: product.id,
                  title: product.title,
                  price: parseFloat(product.price),
                  image: getProductImage(product),
                };
                
                addToCart(productToAdd);
                setCartOpen(true);
                toast.success(`${product.title} added to cart`);
              }}
            >
              Add to cart
            </button>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .dynamic-product-section {
            padding: 2rem 0.75rem 3rem !important;
            overflow-x: hidden;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .section-container {
            padding: 0 0.5rem !important;
            box-sizing: border-box;
          }

          .products-grid {
            gap: 0.75rem !important;
          }

          .product-card {
            flex: 0 0 calc(50% - 0.375rem) !important;
          }

          .section-title {
            font-size: clamp(1.5rem, 4vw, 2rem) !important;
            margin-bottom: 1.5rem !important;
          }

          .section-description {
            font-size: 0.9rem !important;
            padding: 0 0.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .dynamic-product-section {
            padding: 1.5rem 0.5rem 2rem !important;
          }

          .section-container {
            padding: 0 0.25rem !important;
          }

          .products-grid {
            gap: 0.5rem !important;
          }

          .product-card {
            flex: 0 0 calc(50% - 0.25rem) !important;
          }

          .section-title {
            font-size: clamp(1.25rem, 5vw, 1.75rem) !important;
            margin-bottom: 1.25rem !important;
          }

          .section-description {
            font-size: 0.85rem !important;
            padding: 0 0.25rem !important;
          }

          /* Removed header banner + feature bar from product cards */

          .product-title {
            font-size: 0.85rem !important;
            margin-bottom: 0.4rem !important;
          }

          .add-to-cart {
            padding: 0.6rem 1rem !important;
            font-size: 0.85rem !important;
          }
        }

        .add-to-cart {
          transition: background-color 0.3s ease, transform 0.2s ease, border-color 0.3s ease;
        }

        .add-to-cart:hover {
          background-color: rgba(107, 114, 128, 0.6) !important;
          color: #000000 !important;
          border-color: rgba(107, 114, 128, 0.7) !important;
          transform: translateY(-1px);
        }

        .add-to-cart:active {
          transform: translateY(0);
          background-color: rgba(107, 114, 128, 0.7) !important;
        }

        /* Slider responsive styles */
        @media (max-width: 768px) {
          .products-slider-wrapper {
            overflow-x: hidden !important;
          }

          .products-slider-container {
            overflow-x: hidden !important;
          }

          .products-slider-track {
            gap: 0.5rem !important;
          }

          .product-slider-item {
            flex: 0 0 calc(50% - 0.25rem) !important;
          }

          .product-card {
            font-size: 0.85rem !important;
          }

          .product-title {
            font-size: 0.8rem !important;
            margin-bottom: 0.4rem !important;
          }

          .add-to-cart {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.8rem !important;
          }

          /* Removed header banner + feature bar from product cards */
        }
      `}</style>
      <section
        ref={sectionRef}
        className="dynamic-product-section"
        style={{
          padding: '3rem 1rem 4rem',
          backgroundColor: backgroundColor,
        }}
      >
      <div
        className="section-container"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 0,
            marginBottom: '2rem',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: '#000',
            textAlign: 'center',
          }}
        >
          {section.title}
        </motion.h2>

        {section.description && (
          <motion.p
            className="section-description text-center mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            style={{ color: '#666', maxWidth: '800px', margin: '0 auto 2rem' }}
          >
            {section.description}
          </motion.p>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <p>No products available at the moment.</p>
          </div>
        ) : displayStyle === 'slider' ? (
          // Slider Layout - Shows 4 products, slides one at a time
          <div className="products-slider-wrapper" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <div
              className="products-slider-container"
              style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                className="products-slider-track"
                style={{
                  display: 'flex',
                  transform: slidesToShow === 4 
                    ? `translateX(calc(-${currentSlide} * (25% + 0.375rem)))`
                    : `translateX(calc(-${currentSlide} * (50% + 0.375rem)))`,
                  transition: 'transform 0.5s ease-in-out',
                  gap: slidesToShow === 2 ? '0.5rem' : '1.5rem',
                }}
              >
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="product-slider-item"
                    style={{
                      flex: slidesToShow === 4 
                        ? '0 0 calc(25% - 1.125rem)'
                        : '0 0 calc(50% - 0.25rem)',
                      minWidth: 0,
                    }}
                  >
                    {renderProductCard(product, index, false)}
                  </div>
                ))}
              </div>
              
              {/* Slider Navigation */}
              {products.length > slidesToShow && (
                <>
                  <button
                    className="product-slider-nav-btn product-slider-nav-prev"
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
                    className="product-slider-nav-btn product-slider-nav-next"
                    onClick={() => setCurrentSlide((prev) => Math.min(products.length - slidesToShow, prev + 1))}
                    disabled={currentSlide >= products.length - slidesToShow}
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
                      cursor: currentSlide >= products.length - slidesToShow ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                      backdropFilter: 'blur(10px)',
                      zIndex: 20,
                      pointerEvents: 'auto',
                      transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, opacity 160ms ease',
                      opacity: currentSlide >= products.length - slidesToShow ? 0.5 : 0.95,
                    }}
                    onMouseEnter={(e) => {
                      if (currentSlide < products.length - slidesToShow) {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 14px 36px rgba(0, 0, 0, 0.16)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = currentSlide >= products.length - slidesToShow ? 0.5 : 0.95;
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
            
            {/* Slider Dots - Show dots based on how many slides we can show */}
            {products.length > slidesToShow && (
              <div
                className="product-slider-dots"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.5rem',
                }}
              >
                {Array.from({ length: Math.max(1, products.length - slidesToShow + 1) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`product-slider-dot ${currentSlide === index ? 'product-slider-dot-active' : ''}`}
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
        ) : (
          // Grid Layout (default)
          <motion.div
            className="products-grid"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap',
              alignItems: 'stretch',
            }}
          >
            <AnimatePresence>
              {products.map((product, index) => renderProductCard(product, index, false))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
    </>
  );
};

export default DynamicProductSection;

