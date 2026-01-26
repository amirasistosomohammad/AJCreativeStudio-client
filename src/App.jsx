import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import GcashPayment from './pages/GcashPayment';
import Login from './pages/Login'; // admin login
import PublicLogin from './pages/public/auth/Login';
import Signup from './pages/public/auth/Signup';
import ForgotPassword from './pages/public/auth/ForgotPassword';
import ResetPassword from './pages/public/auth/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductList from './pages/admin/ProductList';
import ProductCategories from './pages/admin/ProductCategories';
import ProductCollections from './pages/admin/ProductCollections';
import ProductReviews from './pages/admin/ProductReviews';
import ProductFaqs from './pages/admin/ProductFaqs';
import ContactMessages from './pages/admin/ContactMessages';
import LandingPageSections from './pages/admin/LandingPageSections';
import SectionTypeAdmin from './pages/admin/content/SectionTypeAdmin';
import CustomerList from './pages/admin/CustomerList';
import EmailSubscribers from './pages/admin/EmailSubscribers';
import TimeLogging from './pages/admin/TimeLogging';
import OrderList from './pages/admin/OrderList';
import AdminSettings from './pages/admin/AdminSettings';
import SidebarLayout from './layout/SidebarLayout';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';
import CartPanel from './components/CartPanel';

// Guard admin pages and re-check token on mount
const ProtectedRoute = ({ children }) => {
  const { token, isAuthenticated, loading, checkAuth } = useAuth();

  React.useEffect(() => {
    if (!loading && token && !isAuthenticated) {
      checkAuth();
    }
  }, [loading, token, isAuthenticated, checkAuth]);

  if (loading || (token && !isAuthenticated)) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border mb-2" role="status" />
          <div className="text-muted small">Validating session…</div>
        </div>
      </div>
    );
  }

  if (!token || !isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;
  const mainLocation = backgroundLocation || location;

  const isAdminRoute = mainLocation.pathname.startsWith('/admin');
  const isAuthRoute = mainLocation.pathname.startsWith('/auth');

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Keep main site UI visible when auth is shown as a modal over an existing page */}
      {!isAdminRoute && !isAuthRoute && (
        <>
          <Navbar />
          <CartPanel />
        </>
      )}

      <div className={isAdminRoute ? "" : "main-content-wrapper"}>
        {/* Main routes render the "background" location if a modal route is open */}
        <Routes location={mainLocation}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/all-products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth/login" element={<PublicLogin />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/gcash-payment" element={<GcashPayment />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarLayout><AdminDashboard /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <SidebarLayout><OrderList /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <SidebarLayout><ProductList /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/categories"
              element={
                <ProtectedRoute>
                  <SidebarLayout><ProductCategories /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/collections"
              element={
                <ProtectedRoute>
                  <SidebarLayout><ProductCollections /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/reviews"
              element={
                <ProtectedRoute>
                  <SidebarLayout><ProductReviews /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/faqs"
              element={
                <ProtectedRoute>
                  <SidebarLayout><ProductFaqs /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/landing-page-sections"
              element={
                <ProtectedRoute>
                  <SidebarLayout><LandingPageSections /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            {/* Content Management Routes */}
            <Route
              path="/admin/content/hero"
              element={
                <ProtectedRoute>
                  <SidebarLayout><SectionTypeAdmin /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content/products"
              element={
                <ProtectedRoute>
                  <SidebarLayout><SectionTypeAdmin /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content/faq"
              element={
                <ProtectedRoute>
                  <SidebarLayout><SectionTypeAdmin /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content/testimonials"
              element={
                <ProtectedRoute>
                  <SidebarLayout><SectionTypeAdmin /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content/email-subscribe"
              element={
                <ProtectedRoute>
                  <SidebarLayout><SectionTypeAdmin /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content/media"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <div className="container-fluid px-3 py-2">
                      <h1>Media Library</h1>
                      <p>Media Library coming soon...</p>
                    </div>
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute>
                  <SidebarLayout><CustomerList /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers/time-logs"
              element={
                <ProtectedRoute>
                  <SidebarLayout><TimeLogging /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers/email-subscribers"
              element={
                <ProtectedRoute>
                  <SidebarLayout><EmailSubscribers /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers/contact-messages"
              element={
                <ProtectedRoute>
                  <SidebarLayout><ContactMessages /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <div className="container-fluid px-3 py-2">
                      <h1>Profile</h1>
                      <p>Profile page coming soon...</p>
                    </div>
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <SidebarLayout><AdminSettings /></SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* Legacy routes still mapped to Home for now */}
            <Route path="/bundles" element={<Home />} />
            <Route path="/planners" element={<Home />} />
            <Route path="/small-business" element={<Home />} />
            <Route path="/personal-budget" element={<Home />} />
            <Route path="/social-media" element={<Home />} />
            <Route path="/productivity" element={<Home />} />
            <Route path="/printables" element={<Home />} />
        </Routes>

        {/* Modal routes render on top of the background when opened with `state.backgroundLocation` */}
        {backgroundLocation && (
          <Routes location={location}>
            <Route path="/auth/login" element={<PublicLogin />} />
            <Route path="/auth/signup" element={<Signup />} />
          </Routes>
        )}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 100005 }}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrandingProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
      </BrandingProvider>
    </AuthProvider>
  );
};

export default App;
