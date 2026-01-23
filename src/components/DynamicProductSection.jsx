import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { getProductImage, formatCurrency } from '../utils/productImageUtils';

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

  useEffect(() => {
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products from collection
      const response = await fetch(`${apiBaseUrl}/product-collections/${section.source_value}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let productsList = [];
        
        if (data.success && data.collection && data.collection.products) {
          productsList = data.collection.products;
        }

        // Limit to product_count
        const limitedProducts = productsList.slice(0, section.product_count || 4);
        setProducts(limitedProducts);

        // Initialize image loading states
        const initialLoadingStates = {};
        limitedProducts.forEach((product) => {
          const imageUrl = getProductImage(product);
          if (imageUrl) {
            initialLoadingStates[product.id] = true;
          }
        });
        setImageLoading(initialLoadingStates);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!section.is_active) {
    return null;
  }

  const backgroundColor = section.name === 'new_arrivals' ? '#F3F3F3' : '#FFFFFF';

  return (
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
        ) : (
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
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  id={`product-item-${index}`}
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
                  className="product-card"
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
                      
                      {/* Skeleton Loading State */}
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
                          objectFit: 'contain',
                          display: 'block',
                          opacity: imageLoading[product.id] ? 0 : 1,
                          transition: 'opacity 0.3s ease-in-out',
                        }}
                        onLoad={() => {
                          setImageLoading((prev) => ({
                            ...prev,
                            [product.id]: false,
                          }));
                        }}
                        onLoadStart={() => {
                          setImageLoading((prev) => ({
                            ...prev,
                            [product.id]: true,
                          }));
                        }}
                        onError={() => {
                          setImageLoading((prev) => ({
                            ...prev,
                            [product.id]: false,
                          }));
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
                      {/* Product Title */}
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

                      {/* Pricing row */}
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

                      {/* Add to cart Button */}
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
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DynamicProductSection;

