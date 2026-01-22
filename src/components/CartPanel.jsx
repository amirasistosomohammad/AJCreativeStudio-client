import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import PublicLogin from '../pages/public/auth/Login';
import { showAlert } from '../services/notificationService';
import Swal from 'sweetalert2';

const formatPHP = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);

const CartPanel = () => {
  const navigate = useNavigate();
  const { cartOpen, setCartOpen, cartItems, updateQuantity, removeFromCart, getCartTotal, getCartItemCount, clearCart } = useCart();
  const { customer, customerToken, isCustomerAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const itemsCount = getCartItemCount();
  const subtotal = getCartTotal();
  const finalTotal = subtotal; // No discounts - total equals subtotal


  // Handle checkout - requires customer to be logged in
  const handleCheckout = async () => {
    // Check if cart is empty
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Get token from localStorage (more reliable than context state)
    const token = localStorage.getItem('customer_token');
    
    // Check if customer is authenticated
    if (!token) {
      // Show login modal
      setCartOpen(false);
      setShowLoginModal(true);
      return;
    }

    // Customer is authenticated - proceed with checkout
    // Also get customer data from context if available
    setIsProcessingCheckout(true);
    setCartOpen(false);

    // Show loading SweetAlert
    let loadingAlert = null;

    try {
      const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const totalAmount = finalTotal;

      // Step 1: Show loading - Processing checkout
      loadingAlert = showAlert.loading(
        'Processing Checkout',
        'Please wait while we process your order...',
        {
          width: 400,
          padding: '1.5rem',
        }
      );

      // Step 2: Create order
      const orderItems = cartItems.map((item) => {
        const productId = parseInt(item.id);
        const quantity = parseInt(item.quantity || 1);
        
        if (isNaN(productId) || isNaN(quantity) || quantity < 1) {
          throw new Error(`Invalid cart item: ${item.id}`);
        }
        
        return {
          product_id: productId,
          quantity: quantity,
        };
      });

      const orderData = {
        items: orderItems,
        subtotal: subtotal,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: totalAmount,
        currency: 'PHP',
        billing_address: null,
        shipping_address: null,
      };

      console.log('Creating order...', orderData);

      // Update loading message - Creating order
      Swal.update({
        title: 'Creating Your Order',
        html: 'Please wait while we create your order...',
      });

      const orderResponse = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.error('Order creation error:', errorData);
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResult = await orderResponse.json();
      
      if (!orderResult.success || !orderResult.order) {
        throw new Error('Failed to create order');
      }

      const order = orderResult.order;
      console.log('Order created:', order);

      // Step 3: Update loading message - Preparing payment
      Swal.update({
        title: 'Preparing Payment',
        html: 'Please wait while we prepare your payment checkout...',
      });

      // Step 4: Create PayMaya checkout
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/order/${order.order_number}`;
      const cancelUrl = `${baseUrl}/`;
      const failureUrl = `${baseUrl}/`;

      const orderDescription = cartItems.length === 1 
        ? cartItems[0].title || cartItems[0].name 
        : `${cartItems.length} items`;

      // Prepare customer data for PayMaya
      const customerData = {};
      if (customer) {
        const nameParts = (customer.name || '').split(' ');
        customerData.name = customer.name || 'Customer';
        customerData.first_name = nameParts[0] || 'Customer';
        customerData.last_name = nameParts.slice(1).join(' ') || '';
        customerData.email = customer.email || '';
      }

      const checkoutResponse = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/payments/paymaya/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          order_id: order.id,
          order_number: order.order_number,
          description: orderDescription,
          success_url: successUrl,
          cancel_url: cancelUrl,
          failure_url: failureUrl,
          customer: customerData,
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({}));
        console.error('PayMaya checkout error:', errorData);
        throw new Error(errorData.message || 'Failed to create payment checkout');
      }

      const checkoutResult = await checkoutResponse.json();
      
      if (!checkoutResult.success || !checkoutResult.checkout) {
        throw new Error('Failed to create payment checkout');
      }

      console.log('PayMaya checkout created:', checkoutResult);

      // Step 5: Update loading message - Redirecting
      Swal.update({
        title: 'Redirecting to Payment',
        html: 'Please wait while we redirect you to the payment page...',
      });

      // Step 6: Store order info and redirect to PayMaya
      localStorage.setItem('pending_order', JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
      }));

      // DO NOT clear cart here - only clear after successful payment confirmation
      // Cart will be cleared in OrderConfirmation.jsx when order is confirmed as paid

      // Small delay to show the redirecting message, then redirect
      setTimeout(() => {
        // Close loading alert before redirect
        Swal.close();
        // Redirect to PayMaya checkout
        window.location.href = checkoutResult.checkout.redirect_url;
      }, 500);

    } catch (err) {
      console.error('Checkout error:', err);
      
      // Close loading alert if it's still open
      if (loadingAlert) {
        Swal.close();
      }
      
      // Show error alert
      showAlert.error(
        'Checkout Failed',
        err.message || 'An error occurred during checkout. Please try again.',
        {
          width: 400,
          padding: '1.5rem',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        }
      );
      
      setIsProcessingCheckout(false);
      setCartOpen(true); // Reopen cart on error
    }
  };

  return (
    <>
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
            }}
            onClick={() => setCartOpen(false)}
          />
          
          {/* Cart Panel */}
          <motion.div
            className="cart-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '100%',
              maxWidth: '400px',
              height: '100vh',
              maxHeight: '100vh', // Ensure it doesn't exceed viewport
              backgroundColor: '#FFFFFF',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // Prevent outer scroll, let inner content scroll
            }}
          >
            {/* Cart Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 1,
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#000',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Shopping Cart
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                style={{
                  background: 'linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%)',
                  border: '1px solid #d8d8d8',
                  color: '#111',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                  transition: 'background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f2f2f2 0%, #ffffff 100%)';
                  e.currentTarget.style.borderColor = '#c0c0c0';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%)';
                  e.currentTarget.style.borderColor = '#d8d8d8';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>

              {/* Cart Content */}
            <div style={{
              flex: 1,
              minHeight: 0, // Critical for flex scrolling on mobile
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto', // Enable scrolling on the content area
              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            }}>
              {/* Discount progress promo removed – no top progress bar / message */}
              {cartItems.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                  }}>
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#000000"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <p style={{
                    fontSize: '1rem',
                    color: '#666',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                  }}>
                    Your shopping cart is empty
                  </p>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    style={{
                      color: '#0066CC',
                      background: 'none',
                      border: 'none',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div style={{
                    flex: 1,
                    marginBottom: '1.5rem',
                  }}>
                    {cartItems.map((item, index) => (
                      <div
                        className="cart-item-row"
                        key={`${item.id}-${index}`}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          padding: '1rem 0',
                          borderBottom: index < cartItems.length - 1 ? '1px solid #E0E0E0' : 'none',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #E0E0E0',
                          }}
                        />
                        <div
                          className="cart-item-main"
                          style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                          }}
                        >
                          {/* Left: title + stars + reviews */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3
                              className="cart-item-title"
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: '#000',
                                margin: 0,
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                              }}
                            >
                              {item.title}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem', marginTop: '0.2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <svg
                                    key={i}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="#FFD700"
                                  >
                                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.401 8.168L12 18.896l-7.335 3.87 1.401-8.168L.132 9.21l8.2-1.192z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="cart-item-reviews" style={{ fontSize: '0.8rem', color: '#555' }}>6 reviews</span>
                            </div>
                          </div>

                          {/* Right: price + trash + quantity box */}
                          <div
                            className="cart-item-side"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: '0.4rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <p
                              style={{
                                fontSize: '0.9rem',
                                color: '#000',
                                margin: 0,
                                fontWeight: 600,
                              }}
                            >
                              {formatPHP(item.price)}
                            </p>

                            <div
                              className="cart-item-side-controls"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                              }}
                            >
                              {/* Trash icon */}
                              <button
                                type="button"
                                onClick={() => {
                                  removeFromCart(item.id);
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#b52b27'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#d9534f'; }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#d9534f',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem',
                                  padding: '0.15rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s ease',
                                }}
                                aria-label="Remove item"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>

                              {/* Quantity box */}
                              <div
                                className="cart-quantity-box"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  border: '1px solid #000',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Prevent decreasing quantity below 1
                                    if (item.quantity <= 1) {
                                      showAlert.info(
                                        'Minimum Quantity',
                                        'Quantity cannot be less than 1. Please use the delete icon to remove this item from your cart.',
                                        {
                                          width: '280px',
                                          padding: '1rem',
                                          confirmButtonText: 'OK',
                                          confirmButtonColor: '#000',
                                          customClass: {
                                            popup: 'small-alert-popup',
                                            title: 'small-alert-title',
                                            htmlContainer: 'small-alert-content',
                                            confirmButton: 'small-alert-button',
                                          },
                                        }
                                      );
                                      return;
                                    }
                                    updateQuantity(item.id, item.quantity - 1);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f0f0f0';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#FFFFFF';
                                  }}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    border: 'none',
                                    background: '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.1rem',
                                    color: '#000',
                                    borderRight: '1px solid #000',
                                  }}
                                >
                                  −
                                </button>
                                <span style={{
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  color: '#000',
                                  minWidth: '30px',
                                  textAlign: 'center',
                                }}>
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateQuantity(item.id, item.quantity + 1);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f0f0f0';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#FFFFFF';
                                  }}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    border: 'none',
                                    background: '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.1rem',
                                    color: '#000',
                                    borderLeft: '1px solid #000',
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Footer */}
                  <div style={{
                    borderTop: '1px solid #E0E0E0',
                    paddingTop: '1.5rem',
                  }}>
                    {/* Subtotal */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                    }}>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#000',
                      }}>
                        Subtotal
                      </span>
                      <span
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#000',
                        }}
                      >
                        {formatPHP(finalTotal)}
                      </span>
                    </div>
                    <motion.button
                      whileHover={!isProcessingCheckout ? { y: -2, backgroundColor: '#222222' } : {}}
                      whileTap={!isProcessingCheckout ? { y: 0 } : {}}
                      type="button"
                      style={{
                        width: '100%',
                        padding: '0.9rem 1.5rem',
                        backgroundColor: isProcessingCheckout ? '#666' : '#000000',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.98rem',
                        fontWeight: 600,
                        cursor: isProcessingCheckout ? 'not-allowed' : 'pointer',
                        marginTop: '0.25rem',
                        opacity: isProcessingCheckout ? 0.7 : 1,
                      }}
                      onClick={handleCheckout}
                      disabled={isProcessingCheckout}
                    >
                      {isProcessingCheckout ? 'Processing...' : 'Checkout'}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
      <AnimatePresence>
        {showLoginModal && (
          <PublicLogin
            key="login-modal"
            onClose={async () => {
              setShowLoginModal(false);
              // Small delay to ensure auth state is updated after login
              setTimeout(async () => {
                // Re-check auth state after login
                const token = localStorage.getItem('customer_token');
                if (token && cartItems.length > 0) {
                  // Customer is now authenticated, proceed with checkout
                  await handleCheckout();
                }
              }, 1000);
            }}
            returnTo="/"
          />
        )}
      </AnimatePresence>

      {/* Responsive styles for small alert modal */}
      <style>{`
        .small-alert-popup {
          width: 280px !important;
          padding: 1rem !important;
          font-size: 0.9rem !important;
        }

        .small-alert-title {
          font-size: 1rem !important;
          margin-bottom: 0.75rem !important;
          padding: 0 !important;
        }

        .small-alert-content {
          font-size: 0.85rem !important;
          line-height: 1.4 !important;
          padding: 0 !important;
          margin-bottom: 1rem !important;
        }

        .small-alert-button {
          font-size: 0.85rem !important;
          padding: 0.5rem 1.25rem !important;
          margin-top: 0.5rem !important;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .small-alert-popup {
            width: 90% !important;
            max-width: 280px !important;
            padding: 0.875rem !important;
            margin: 1rem !important;
          }

          .small-alert-title {
            font-size: 0.95rem !important;
            margin-bottom: 0.625rem !important;
          }

          .small-alert-content {
            font-size: 0.8rem !important;
            margin-bottom: 0.875rem !important;
          }

          .small-alert-button {
            font-size: 0.8rem !important;
            padding: 0.45rem 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .small-alert-popup {
            width: 85% !important;
            max-width: 260px !important;
            padding: 0.75rem !important;
          }

          .small-alert-title {
            font-size: 0.9rem !important;
          }

          .small-alert-content {
            font-size: 0.75rem !important;
          }

          .small-alert-button {
            font-size: 0.75rem !important;
            padding: 0.4rem 0.9rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default CartPanel;
