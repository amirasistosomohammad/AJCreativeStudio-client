import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '../contexts/CartContext';

const formatPHP = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);

const GcashPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [gcashNumber, setGcashNumber] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);

  // Get order total from location state or calculate from cart
  const total = location.state?.total || getCartTotal();
  
  useEffect(() => {
    setOrderTotal(total);
  }, [total]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create payment and get QR code
  useEffect(() => {
    const createPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get API base URL (adjust this to match your Laravel backend URL)
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        const response = await fetch(`${apiBaseUrl}/api/payments/gcash/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            amount: orderTotal,
            order_id: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: 'Order Payment',
          }),
        });

        const data = await response.json();

        if (data.success && data.payment) {
          setQrData(data.payment.qr_string);
          setPaymentId(data.payment.id);
          setGcashNumber(data.payment.gcash_number);
        } else {
          setError(data.message || 'Failed to create payment. Please try again.');
        }
      } catch (err) {
        console.error('Payment creation error:', err);
        setError('An error occurred while creating the payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (orderTotal > 0) {
      createPayment();
    }
  }, [orderTotal]);


  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Blue Header */}
      <div
        style={{
          backgroundColor: '#0070BA',
          padding: isMobile ? '1rem 1.25rem' : '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* GCash Logo */}
        <div
          style={{
            width: isMobile ? '32px' : '40px',
            height: isMobile ? '32px' : '40px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width={isMobile ? '20' : '24'}
            height={isMobile ? '20' : '24'}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#0070BA" />
            <path
              d="M8 12C8 10.8954 8.89543 10 10 10H14C15.1046 10 16 10.8954 16 12C16 13.1046 15.1046 14 14 14H10C8.89543 14 8 13.1046 8 12Z"
              fill="#FFFFFF"
            />
            <path
              d="M12 8C13.1046 8 14 8.89543 14 10V14C14 15.1046 13.1046 16 12 16C10.8954 16 10 15.1046 10 14V10C10 8.89543 10.8954 8 12 8Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
        <span
          style={{
            color: '#FFFFFF',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          GCash
        </span>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '2rem 1.25rem' : '3rem 2rem',
        }}
      >
        {/* White Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
            maxWidth: isMobile ? '100%' : '500px',
            width: '100%',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          {/* Instructions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: 600,
                color: '#333333',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Securely complete the payment with your GCash app
            </p>
            <p
              style={{
                fontSize: isMobile ? '0.875rem' : '0.9375rem',
                fontWeight: 400,
                color: '#666666',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Open your GCash app and scan this QR code to pay.
            </p>
            {gcashNumber && (
              <p
                style={{
                  fontSize: isMobile ? '0.75rem' : '0.8125rem',
                  fontWeight: 400,
                  color: '#999999',
                  margin: '0.5rem 0 0 0',
                  lineHeight: 1.5,
                }}
              >
                Merchant: {gcashNumber}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid #E0E0E0',
                  borderTop: '4px solid #0070BA',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p style={{ color: '#666666', margin: 0 }}>
                Generating payment QR code...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#FFF3CD',
                borderRadius: '8px',
                border: '1px solid #FFC107',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#856404', margin: 0, fontWeight: 500 }}>
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0070BA',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* QR Code */}
          {!loading && !error && qrData && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QRCodeSVG
                value={qrData}
                size={isMobile ? 220 : 280}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
          )}

          {/* Payment Instructions */}
          {!loading && !error && qrData && (
            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: '#E7F3FF',
                borderRadius: '8px',
                border: '1px solid #0070BA',
                width: '100%',
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#004085',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 600,
                }}
              >
                Payment Instructions:
              </p>
              <ol
                style={{
                  fontSize: '0.8125rem',
                  color: '#004085',
                  margin: 0,
                  paddingLeft: '1.25rem',
                  lineHeight: 1.6,
                }}
              >
                <li>Open your GCash app</li>
                <li>Tap "Scan QR"</li>
                <li>Scan this QR code</li>
                <li>Confirm the amount and complete payment</li>
                <li>Save your receipt for reference</li>
              </ol>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#666666',
                  margin: '0.75rem 0 0 0',
                  fontStyle: 'italic',
                }}
              >
                Note: Payment verification is manual. Please contact us after payment with your transaction reference.
              </p>
            </div>
          )}

          {/* Order Total Display */}
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              border: '1px solid #E0E0E0',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: '#666666',
                margin: '0 0 0.5rem 0',
                fontWeight: 500,
              }}
            >
              Amount to Pay
            </p>
            <p
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#000000',
                margin: 0,
              }}
            >
              {formatPHP(orderTotal)}
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/checkout')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#0070BA',
              border: '1px solid #0070BA',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0070BA';
              e.target.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#0070BA';
            }}
          >
            Back to Checkout
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GcashPayment;

