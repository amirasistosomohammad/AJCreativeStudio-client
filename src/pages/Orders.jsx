import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicLogin from './public/auth/Login';
import { getProductImage } from '../utils/productImageUtils';
import { motion, AnimatePresence } from 'framer-motion';

// Component to handle product thumbnail with fallback
const ProductThumbnail = ({ product, productName, size = 'small' }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbnailUrl = getProductImage(product);

  const fontSize = size === 'small' ? '0.7rem' : '0.875rem';

  if (!thumbnailUrl || imageError) {
    return (
      <span style={{ fontSize, fontWeight: 600, color: '#6b7280' }}>
        {productName?.slice(0, 2)?.toUpperCase() || 'PR'}
      </span>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
            zIndex: 1,
          }}
        />
      )}
      <img
        src={thumbnailUrl}
        alt={productName}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

const Orders = () => {
  const { isCustomerAuthenticated, checkAuth } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('customer_token');

      if (!token) {
        setShowLoginModal(true);
        setLoading(false);
        return;
      }

      // Only fetch orders with payment_status='paid'
      const response = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/orders?payment_status=paid`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        setShowLoginModal(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load orders');
      }

      const data = await response.json();
      const fetched = data.orders?.data || data.orders || [];
      // Double-check filter on frontend as well (defense in depth)
      const paidOnly = fetched.filter((order) => order.payment_status === 'paid');
      setOrders(paidOnly);
    } catch (err) {
      console.error('Orders load error:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Group orders by date
  const groupOrdersByDate = (orders) => {
    const grouped = {};
    orders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(order);
    });
    return grouped;
  };

  const handleLoginClose = async () => {
    setShowLoginModal(false);
    await checkAuth();
    loadOrders();
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAFA',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!isCustomerAuthenticated && showLoginModal) {
    return (
      <>
        <PublicLogin onClose={handleLoginClose} returnTo="/orders" />
      </>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#FAFAFA' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Orders</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={loadOrders}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#000',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', width: '100%' }}>
      <section
        style={{
          backgroundColor: '#FFFFFF',
          position: 'relative',
          paddingTop: 'var(--navbar-height, 0)',
          paddingBottom: '4rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          marginTop: '0px',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100vw',
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ maxWidth: '1100px', margin: '0 auto' }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.4rem', fontSize: '2rem', fontWeight: 700, color: '#000' }}>
              Orders
            </h1>
            <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
              Review completed purchases and download files anytime.
            </p>
          </div>

          {orders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.75rem',
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #E0E0E0',
              }}
            >
              <p style={{ marginBottom: '0.9rem', color: '#666', fontSize: '1rem' }}>
                No completed purchases yet.
              </p>
              <button
                onClick={() => navigate('/all-products')}
                style={{
                  padding: '0.75rem 1.4rem',
                  backgroundColor: '#000',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Shop Products
              </button>
            </div>
          ) : (
            Object.entries(groupOrdersByDate(orders)).map(([date, dateOrders]) => (
              <div key={date} style={{ marginBottom: '2.25rem' }}>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '1rem',
                    paddingLeft: '0.25rem',
                  }}
                >
                  {date}
                </h2>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={listVariants}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {dateOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      variants={cardVariants}
                      style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 8px 18px rgba(15,23,42,0.10)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 1px 3px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      onClick={() => navigate(`/order/${order.order_number}`)}
                    >
                  {/* Order Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontWeight: 500,
                          marginBottom: '0.25rem',
                        }}
                      >
                        {order.order_number}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          color: '#1f2937',
                          fontWeight: 600,
                        }}
                      >
                        ₱{Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div
                      style={{
                        background: '#ecfdf3',
                        color: '#16a34a',
                        fontWeight: 600,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                      }}
                    >
                      Complete
                    </div>
                  </div>

                  {/* Product Thumbnails Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.min(order.items?.length || 1, 4)}, 1fr)`,
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {order.items?.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ProductThumbnail product={item.product} productName={item.product_name} />
                      </div>
                    ))}
                    {order.items && order.items.length > 4 && (
                      <div
                        style={{
                          aspectRatio: '1',
                          borderRadius: '8px',
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                      }}
                    >
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order/${order.order_number}`);
                      }}
                      style={{
                        padding: '0.4rem 0.9rem',
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Access order
                    </button>
                  </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))
          )}

          {showLoginModal && <PublicLogin onClose={handleLoginClose} returnTo="/orders" />}
        </motion.div>
      </section>

      {/* Shimmer keyframes used by thumbnail skeletons */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Orders;

