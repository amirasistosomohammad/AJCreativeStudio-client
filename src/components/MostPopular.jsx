import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { getProductImage, formatCurrency } from '../utils/productImageUtils';

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

const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MostPopular = () => {
  const navigate = useNavigate();
  const { addToCart, setCartOpen } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [visibleItems, setVisibleItems] = useState({});
  const lastScrollY = useRef(0);
  const sectionRef = useRef(null);
  const itemRefs = useRef({});

  // Fetch bestsellers from API
  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/products/bestsellers/list`, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.products) {
            // Limit to 8 products for display
            const limitedProducts = data.products.slice(0, 8);
            setProducts(limitedProducts);
          }
        }
      } catch (error) {
        console.error('Error fetching bestsellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, []);

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
  }, []);

  return (
    <section
      ref={sectionRef}
      className="most-popular"
      style={{
        padding: '3rem 1rem 4rem',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div
        className="most-popular-container"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <motion.h2
          className="most-popular-title"
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
          Our Best Sellers
        </motion.h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <p>No best sellers available at the moment.</p>
          </div>
        ) : (
          <motion.div
            className="most-popular-grid"
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
              {products.map((product, index) => (
              <motion.div
                key={product.id}
                id={`popular-item-${index}`}
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
                  delay: index * 0.04,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="most-popular-item product-card"
                style={{
                  flex: '0 0 calc(25% - 1.125rem)',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #E0E0E0',
                }}
                whileHover={{
                  y: -4,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  transition: { duration: 0.25, ease: 'easeOut' },
                }}
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
                  {/* Header banner */}
                  <div
                    className="green-header-banner"
                    style={{
                      backgroundColor: '#4CAF50',
                      padding: '0.75rem',
                      color: '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.title.toUpperCase()}
                    </div>
                  </div>

                  {/* Image */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      backgroundColor: '#F8F8F8',
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
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  {/* Feature bar */}
                  <div
                    style={{
                      backgroundColor: '#E8F5E9',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#2E7D32',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                    </svg>
                    <span>
                      Google Sheets Document | Easy to use | Mobile Compatibility
                    </span>
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
                    {/* Product Title */}
                    <motion.h3
                      className="most-popular-product-title"
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

                    {/* Pricing */}
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
                          color: '#000',
                        }}
                      >
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    {/* Add to cart Button */}
                    <button
                      className="most-popular-add-to-cart"
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
                        
                        // Add product to cart
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
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* View all Spreadsheets Button */}
        <motion.div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '3rem',
            paddingTop: '2rem',
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.button
            whileHover={{ y: -2, backgroundColor: '#222222' }}
            whileTap={{ y: 0 }}
            type="button"
            onClick={() => navigate('/all-products')}
            className="most-popular-view-all"
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
            View all spreadsheets
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default MostPopular;
