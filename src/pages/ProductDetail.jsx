import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { allProducts } from './Products';
import { getProductImage as getApiProductImage, getAllProductImages } from '../utils/productImageUtils';
import gcashLogo from '../assets/images/gcash-logo.jpg';
import mayaLogo from '../assets/images/maya-logo.png';
import grabPayLogo from '../assets/images/grabpay-logo.png';
import shopeePayLogo from '../assets/images/shopeepay-logo.jpg';
import sevenElevenLogo from '../assets/images/7eleven-logo.png';
import EmailSubscribeFooter from '../components/EmailSubscribeFooter';
import { useCart } from '../contexts/CartContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

// Import all product sample images
import productImage1 from '../assets/images/digital_product_sample/1.webp';
import productImage2 from '../assets/images/digital_product_sample/2.webp';
import productImage3 from '../assets/images/digital_product_sample/3.webp';
import productImage4 from '../assets/images/digital_product_sample/4.webp';
import productImage5 from '../assets/images/digital_product_sample/5.webp';
import productImage6 from '../assets/images/digital_product_sample/6.webp';
import productImage7 from '../assets/images/digital_product_sample/7.webp';
import productImage8 from '../assets/images/digital_product_sample/8.webp';
import productImage9 from '../assets/images/digital_product_sample/9.webp';

// Helper function to convert slug back to readable title
const slugToTitle = (slug) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\bAnd\b/gi, '&');
};

// Generate short description with features for product detail page
const generateShortDescription = (product) => {
  const category = product.category || 'Business';
  const title = product.title || '';
  
  // Generate intro paragraph based on category
  const shortIntros = {
    'Business': `Easily track your business transactions and auto-calculate your profit margins with ${title}!`,
    'Finance': `Easily monitor your finances and track all your transactions with ${title}!`,
    'Productivity': `Easily organize your tasks and boost your productivity with ${title}!`,
    'Bundle': `Get comprehensive solutions for all your needs with ${title}!`,
    'Personal': `Easily organize your personal life and track important information with ${title}!`,
  };
  
  // Generate features based on category
  const featureLists = {
    'Business': [
      { icon: '★', text: 'Track ALL your transactions' },
      { icon: '💰', text: 'Auto-calculate profits' },
      { icon: '📄', text: 'Save sales history per product' },
      { icon: '📱', text: 'Access & sync across all devices' },
    ],
    'Finance': [
      { icon: '★', text: 'Track ALL your expenses' },
      { icon: '💰', text: 'Auto-calculate budgets' },
      { icon: '📄', text: 'Save transaction history' },
      { icon: '📱', text: 'Access & sync across all devices' },
    ],
    'Productivity': [
      { icon: '★', text: 'Track ALL your tasks' },
      { icon: '💰', text: 'Auto-calculate progress' },
      { icon: '📄', text: 'Save project history' },
      { icon: '📱', text: 'Access & sync across all devices' },
    ],
    'Bundle': [
      { icon: '★', text: 'Track ALL your data' },
      { icon: '💰', text: 'Auto-calculate metrics' },
      { icon: '📄', text: 'Save comprehensive history' },
      { icon: '📱', text: 'Access & sync across all devices' },
    ],
    'Personal': [
      { icon: '★', text: 'Track ALL your information' },
      { icon: '💰', text: 'Auto-organize data' },
      { icon: '📄', text: 'Save personal records' },
      { icon: '📱', text: 'Access & sync across all devices' },
    ],
  };
  
  return {
    intro: shortIntros[category] || shortIntros['Business'],
    features: featureLists[category] || featureLists['Business'],
  };
};

// Helper to ensure we can match slugs for API products too
const createSlug = (title) => {
  return (title || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Generate dynamic description content based on product
const generateDescription = (product) => {
  const category = product.category || 'Business';
  const title = product.title || '';
  
  // Generate intro paragraph based on category
  const introParagraphs = {
    'Business': `With our ${title}, you get a simple, powerful, and automated spreadsheet that helps you manage your business operations efficiently and track important metrics in real-time!`,
    'Finance': `With our ${title}, you get a comprehensive financial tracking solution that helps you monitor your finances, analyze spending patterns, and stay on top of your budget with ease!`,
    'Productivity': `With our ${title}, you get an intuitive and feature-rich template that helps you organize your tasks, track your progress, and boost your productivity effortlessly!`,
    'Bundle': `With our ${title}, you get access to multiple professional templates that work together seamlessly to help you manage various aspects of your business or personal life!`,
    'Personal': `With our ${title}, you get a user-friendly template designed to help you organize your personal life, track important information, and achieve your goals!`,
  };
  
  const intro = introParagraphs[category] || introParagraphs['Business'];
  
  // Generate features based on category
  const featureSets = {
    'Business': [
      'Set up your own custom categories and tracking parameters',
      'Calculate metrics efficiently with automated formulas',
      'Custom markups and adjustments - allows for easy modifications for each business phase',
      'Automated Summary Dashboard - track important business metrics such as revenue, expenses, profit margins, and more',
      'Detailed Breakdowns - get a breakdown of totals for each category for easy analysis',
      'Real-time Tracking - easily track projected vs actual performance for any period',
      'Intuitive charts and tables for visual clarity',
    ],
    'Finance': [
      'Comprehensive financial tracking and categorization',
      'Automated calculations for budgets, expenses, and savings',
      'Customizable categories to match your financial needs',
      'Visual Dashboard - track income, expenses, savings goals, and trends',
      'Monthly and Annual Reports - detailed breakdowns for easy financial analysis',
      'Real-time Budget Monitoring - track spending against your budget limits',
      'Interactive charts and graphs for better financial insights',
    ],
    'Productivity': [
      'Customizable task and project management system',
      'Automated progress tracking and deadline reminders',
      'Flexible organization - adapt to your workflow',
      'Progress Dashboard - visualize your productivity metrics and achievements',
      'Task Breakdowns - organize tasks by priority, category, or project',
      'Time Tracking - monitor time spent on different activities',
      'Clean and intuitive interface for maximum efficiency',
    ],
    'Bundle': [
      'Multiple integrated templates working seamlessly together',
      'Consistent design and functionality across all templates',
      'Comprehensive solution for various business or personal needs',
      'Unified Dashboard - access all templates from one central location',
      'Cross-template Data Sharing - use data from one template in another',
      'Cost-effective solution - get more value with bundled templates',
      'Regular updates and support for all included templates',
    ],
    'Personal': [
      'Personalized tracking and organization system',
      'Easy-to-use interface designed for everyday use',
      'Customizable fields to match your personal needs',
      'Personal Dashboard - track goals, habits, and important information',
      'Flexible Organization - organize information your way',
      'Progress Monitoring - see your personal growth and achievements',
      'Simple and clean design for stress-free management',
    ],
  };
  
  const features = featureSets[category] || featureSets['Business'];
  
  return {
    intro,
    features,
  };
};

// Create dummy product when not found
const createDummyProduct = (slug) => {
  const title = slugToTitle(slug);
  return {
    id: 999,
    title: title,
    subtitle: 'Professional digital template for your needs',
    price: 299.0,
    oldPrice: 499.0,
    onSale: true,
    category: 'Digital',
    availability: 'In Stock',
    imageType: 'default',
    color: '#4CAF50',
    accentColor: '#2E7D32',
    slug: slug,
    isDummy: true,
  };
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Most Recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [displayNameExample, setDisplayNameExample] = useState('John Smith');
  const [displayNameExampleDropdownOpen, setDisplayNameExampleDropdownOpen] = useState(false);
  const displayNameExampleDropdownRef = useRef(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewStatusMessage, setReviewStatusMessage] = useState('');
  const [reviewStatusType, setReviewStatusType] = useState('info');
  const [activeReviewImage, setActiveReviewImage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE_MB = 5; // Maximum file size in MB
  const sortDropdownRef = useRef(null);
  const reviewFormRef = useRef(null);
  const reviewTitleInputRef = useRef(null);
  const successMessageRef = useRef(null);
  const refreshButtonRef = useRef(null);
  const customerReviewsSectionRef = useRef(null);
  const { addToCart, setCartOpen } = useCart();
  
  const reviewsPerPage = 5;

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8000';

  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [productFaqs, setProductFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(false);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const sortOptions = [
    'Most Recent',
    'Highest Rating',
    'Lowest Rating',
    'Only Pictures',
    'Pictures First',
    'Videos First',
    'Most Helpful',
  ];
  
  const displayNameOptions = [
    'John Smith',
    'John S.',
    'John',
    'J.S.',
    'Anonymous',
  ];
  
  // Scroll to review form and focus title input when form opens
  useEffect(() => {
    if (showReviewForm && reviewFormRef.current && reviewTitleInputRef.current) {
      // Fast scroll directly to the review form div (skipping Customer Reviews title)
      setTimeout(() => {
        const element = reviewFormRef.current;
        if (element) {
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 20; // Small offset from top
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Focus the title input after scroll
          setTimeout(() => {
            reviewTitleInputRef.current?.focus();
          }, 300);
        }
      }, 100);
    }
  }, [showReviewForm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
      if (displayNameExampleDropdownRef.current && !displayNameExampleDropdownRef.current.contains(event.target)) {
        setDisplayNameExampleDropdownOpen(false);
      }
    };
    
    if (sortDropdownOpen || displayNameExampleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortDropdownOpen, displayNameExampleDropdownOpen]);
  
  // Fetch product from API (fall back only to dummy product if not found)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);

        // Fetch all products and match by slug
        const response = await fetch(`${apiBaseUrl}/products?per_page=1000`, {
          headers: {
            Accept: 'application/json',
          },
        });

        let apiProduct = null;

        if (response.ok) {
          const data = await response.json();
          let list = [];
          if (Array.isArray(data.products)) {
            list = data.products;
          } else if (Array.isArray(data.data)) {
            list = data.data;
          }

          const normalized = list.map((p) => {
            const title = p.title || p.name || '';
            const price = parseFloat(p.price ?? 0);
            const slugValue = p.slug || createSlug(title);
            return {
              ...p,
              title,
              price,
              oldPrice: p.old_price ?? null,
              onSale: !!p.on_sale,
              category: p.category || 'Digital',
              availability: p.is_active === false ? 'Unavailable' : 'In Stock',
              slug: slugValue,
            };
          });

          apiProduct = normalized.find((p) => p.slug === slug);
        }

        if (apiProduct) {
          setProduct({ ...apiProduct, isDummy: false });
          setCurrentImageIndex(0); // Reset to first image when product changes
        } else {
          // Fallback: create generic dummy product
          setProduct(createDummyProduct(slug));
          setCurrentImageIndex(0);
        }
      } catch (error) {
        console.error('Error fetching product detail:', error);
        setProduct(createDummyProduct(slug));
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [apiBaseUrl, slug]);

  // Fetch reviews for product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?.id || product?.isDummy) {
        setProductReviews([]);
        return;
      }

      try {
        setReviewsLoading(true);
        const response = await fetch(`${apiBaseUrl}/products/${product.id}/reviews`, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          setProductReviews([]);
          return;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.reviews)) {
          setProductReviews(data.reviews);
        } else {
          setProductReviews([]);
        }
      } catch (error) {
        console.error('Error fetching product reviews:', error);
        setProductReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [apiBaseUrl, product?.id, product?.isDummy]);

  // Fetch FAQs for product
  useEffect(() => {
    const fetchFaqs = async () => {
      if (!product?.id || product?.isDummy) {
        setProductFaqs([]);
        return;
      }

      try {
        setFaqsLoading(true);
        const response = await fetch(`${apiBaseUrl}/products/${product.id}/faqs`, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          setProductFaqs([]);
          return;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.faqs)) {
          setProductFaqs(data.faqs);
        } else {
          setProductFaqs([]);
        }
      } catch (error) {
        console.error('Error fetching product FAQs:', error);
        setProductFaqs([]);
      } finally {
        setFaqsLoading(false);
      }
    };

    fetchFaqs();
  }, [apiBaseUrl, product?.id, product?.isDummy]);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqItems = useMemo(() => {
    const safeProduct = product || {};

    const dynamicItems = (productFaqs || [])
      .slice()
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((item) => ({
        question: item.question,
        answer: (
          <div style={{ fontSize: '0.95rem', color: '#333', lineHeight: 1.6, paddingTop: '0.5rem' }}>
            <MarkdownRenderer
              content={item.answer}
              style={{
                fontSize: '0.95rem',
                color: '#333',
                lineHeight: 1.6,
              }}  
            />
          </div>
        ),
      }));

    const descriptionItem = {
      question: 'Description',
      isDescription: true,
      answer: (() => {
        if (safeProduct.description) {
          return (
            <div style={{ fontSize: '0.95rem', color: '#333', lineHeight: 1.6, paddingTop: '0.5rem' }}>
              <MarkdownRenderer
                content={safeProduct.description}
                style={{
                  fontSize: '0.95rem',
                  color: '#333',
                  lineHeight: 1.6,
                }}
              />
            </div>
          );
        }

        const desc = generateDescription(safeProduct);
        return (
          <div style={{ fontSize: '0.95rem', color: '#333', lineHeight: 1.6, paddingTop: '0.5rem' }}>
            {/* Intro Paragraph */}
            <p style={{ marginBottom: '1rem' }}>
              {desc.intro}
            </p>
            
            {/* Demo File Link */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, color: '#000' }}>DEMO FILE HERE: </span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Replace with actual demo file URL
                  window.open('#', '_blank');
                }}
                style={{
                  color: '#0066CC',
                  textDecoration: 'underline',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0052A3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#0066CC';
                }}
              >
                CLICK THIS LINK
              </a>
            </div>
            
            {/* Key Attributes */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#FFC107', fontSize: '1rem' }}>★</span>
                <span>Microsoft Excel & Google Sheets compatible (upload the Excel file to Google Drive to use it in Sheets)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#FFC107', fontSize: '1rem' }}>★</span>
                <span>Instant Download</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#FFC107', fontSize: '1rem' }}>★</span>
                <span>Lifetime Access</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#FFC107', fontSize: '1rem' }}>★</span>
                <span>Mobile Compatible</span>
              </div>
            </div>
            
            {/* Features Section */}
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.95rem', textTransform: 'uppercase' }}>FEATURES:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {desc.features.map((feature, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Additional Features */}
            <div style={{ marginBottom: '1rem' }}>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Custom project markups</strong> - allows for easy adjustments and additions for each phase/sub-phase.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Automated Project Summary</strong> - track important project metrics such as bid price, cost breakdowns, total actual vs projected costs, etc.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Cost Breakdowns</strong> - get a breakdown of total cost for each project phase or cost category for easy cost analysis.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Project Cost Tracking</strong> - easily track projected costs vs actual costs for any project in real time.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Intuitive charts and tables</strong> - for visual clarity.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Compatible with PC, mobile phones, and tablets</strong>
                </li>
              </ul>
            </div>
            
            {/* Note */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#FFF9E6', borderRadius: '4px', border: '1px solid #FFE082' }}>
              <strong>NOTE:</strong> This template works in Microsoft Excel and Google Sheets. To use it in Google Sheets, upload the Excel file to Google Drive and open it with Google Sheets.
            </div>
            
            {/* Disclaimer */}
            <div style={{ marginTop: '1.5rem' }}>
              <strong style={{ fontSize: '0.95rem', textTransform: 'uppercase' }}>DISCLAIMER</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  This template is a digital product and all sales are final. No refunds.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  You may not resell, redistribute, or share this template.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  Personal or business use only for the original purchaser.
                </p>
              </div>
            </div>
          </div>
        );
      })(),
    };

    return [...dynamicItems, descriptionItem];
  }, [productFaqs, product]);

  const paymentLogos = [
    { name: 'GCash', src: gcashLogo },
    { name: 'Maya', src: mayaLogo },
    { name: 'GrabPay', src: grabPayLogo },
    { name: 'ShopeePay', src: shopeePayLogo },
    { name: '7-Eleven', src: sevenElevenLogo },
  ];

  // Product images array for gallery - get all feature images from API, fallback to samples
  const apiImages = product ? getAllProductImages(product) : [];
  const thumb = product ? getApiProductImage(product) : null;

  // Build gallery: thumbnail first (if present), then feature images, remove duplicates
  const combined = [
    ...(thumb ? [thumb] : []),
    ...apiImages,
  ].filter(Boolean);

  const seen = new Set();
  const uniqueImages = combined.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  const productImages = uniqueImages.length > 0
    ? uniqueImages.map((imgSrc, index) => ({
        src: imgSrc,
        alt: `${product?.title || ''} - Image ${index + 1}`
      }))
    : [
        { src: productImage1, alt: `${product?.title || ''} - Image 1` },
        { src: productImage2, alt: `${product?.title || ''} - Image 2` },
        { src: productImage3, alt: `${product?.title || ''} - Image 3` },
        { src: productImage4, alt: `${product?.title || ''} - Image 4` },
        { src: productImage5, alt: `${product?.title || ''} - Image 5` },
        { src: productImage6, alt: `${product?.title || ''} - Image 6` },
        { src: productImage7, alt: `${product?.title || ''} - Image 7` },
        { src: productImage8, alt: `${product?.title || ''} - Image 8` },
        { src: productImage9, alt: `${product?.title || ''} - Image 9` },
      ];

  // Gallery helpers to mirror admin modal styling
  const gallery = productImages.map((img) => img.src);
  const featureIdx =
    gallery.length > 0
      ? Math.min(currentImageIndex, gallery.length - 1)
      : 0;
  
  const handleImageChange = (index) => {
    setHeroLoaded(false);
    setCurrentImageIndex(index);
  };
  
  const handlePreviousImage = () => {
    setHeroLoaded(false);
    setCurrentImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1
    );
  };
  
  const handleNextImage = () => {
    setHeroLoaded(false);
    setCurrentImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1
    );
  };
  

  const reviews = useMemo(() => {
    return (productReviews || []).map((review) => {
      const createdAt = review.created_at ? new Date(review.created_at) : null;
      return {
        id: review.id,
        name: review.name || 'Anonymous',
        rating: Number(review.rating || 0),
        title: review.title || '',
        text: review.content || '',
        date: createdAt ? createdAt.toLocaleDateString() : '',
        createdAt: review.created_at || null,
        verified: review.status === 'approved' && review.is_active === true,
        imageUrls: review.image_urls || [],
      };
    });
  }, [productReviews]);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (selectedSort === 'Highest Rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === 'Lowest Rating') {
      list.sort((a, b) => a.rating - b.rating);
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [reviews, selectedSort]);

  // Calculate average rating and star distribution
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;
  const starDistribution = [5, 4, 3, 2, 1].map(star => ({
    stars: star,
    count: reviews.filter(r => r.rating === star).length,
  }));
  
  // Pagination logic
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const paginatedReviews = sortedReviews.slice(indexOfFirstReview, indexOfLastReview);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitReview = async () => {
    if (reviewSubmitting) return;

    const errors = {};
    if (reviewRating === 0) {
      errors.rating = 'Rating is required';
    }
    if (!reviewTitle.trim()) {
      errors.title = 'Review title is required';
    }
    if (!reviewContent.trim()) {
      errors.content = 'Review content is required';
    }
    if (!displayName.trim()) {
      errors.displayName = 'Display name is required';
    }
    if (!emailAddress.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setReviewStatusType('error');
      setReviewStatusMessage('Please complete all required fields.');
      return;
    }

    if (!product?.id || product?.isDummy) {
      toast.error('Unable to submit review for this product.');
      setReviewStatusType('error');
      setReviewStatusMessage('Unable to submit review for this product.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewStatusMessage('');
      const formData = new FormData();
      formData.append('product_id', product.id);
      formData.append('rating', reviewRating);
      formData.append('title', reviewTitle.trim());
      formData.append('content', reviewContent.trim());
      formData.append('name', displayName.trim());
      formData.append('email', emailAddress.trim());
      uploadedFiles
        .filter((file) => file.type.startsWith('image/'))
        .forEach((file) => {
          formData.append('images[]', file);
        });

      const response = await fetch(`${apiBaseUrl}/product-reviews`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to submit review.');
      }

      toast.success(data?.message || 'Review submitted.');
      setReviewStatusType('success');
      setReviewStatusMessage(data?.message || 'Review submitted and pending approval.');
      setReviewSubmitted(true);
      // Clean up preview URLs before clearing
      filePreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      setUploadedFiles([]);
      setFilePreviews([]);

      // Scroll to Customer Reviews section so the title and refresh button are visible
      setTimeout(() => {
        if (customerReviewsSectionRef.current) {
          const element = customerReviewsSectionRef.current;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 150;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      }, 400);
    } catch (error) {
      console.error('Review submit error:', error);
      toast.error(error.message || 'Unable to submit review.');
      setReviewStatusType('error');
      setReviewStatusMessage(error.message || 'Unable to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loadingProduct || !product) {
    // Skeleton loading state – mimics final layout with gray placeholders
    return (
      <>
        <section
          style={{ padding: '3rem 1rem 4rem', backgroundColor: '#FFFFFF' }}
          className="product-detail-section"
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Back link skeleton */}
            <div
              style={{
                width: '140px',
                height: '16px',
                marginBottom: '1.25rem',
                background:
                  'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '999px',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />

            {/* Main layout skeleton */}
            <div
              className="product-detail-main-layout-skeleton"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '2.5rem',
                alignItems: 'flex-start',
                marginBottom: '3rem',
              }}
            >
              {/* Left: image skeleton – structure mirrors real hero + thumbnails */}
              <div className="product-detail-skeleton-left">
                {/* Hero container skeleton matches .detail-hero */}
                <div
                  className="detail-hero position-relative rounded"
                  style={{
                    overflow: 'hidden',
                    maxHeight: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--background-light)',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '420px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      background:
                        'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Thumbnails row skeleton – matches loaded strip container */}
                <div
                  className="product-detail-skeleton-thumbs d-flex justify-content-start gap-2 flex-wrap mt-3 p-3 rounded"
                  style={{
                    background: 'var(--background-light)',
                    border: '1px solid var(--input-border)',
                  }}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        border: '1px solid #E0E0E0',
                        background:
                          'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Right: text skeletons */}
              <div>
                {/* Title lines */}
                <div
                  style={{
                    width: '60%',
                    height: '22px',
                    marginBottom: '0.75rem',
                    borderRadius: '6px',
                    background:
                      'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: '18px',
                    marginBottom: '1.25rem',
                    borderRadius: '6px',
                    background:
                      'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }}
                />

                {/* Price + badge skeleton */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '26px',
                      borderRadius: '6px',
                      background:
                        'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      width: '70px',
                      height: '22px',
                      borderRadius: '999px',
                      background:
                        'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Paragraph lines */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === 2 ? '70%' : '100%',
                      height: '14px',
                      marginBottom: '0.5rem',
                      borderRadius: '6px',
                      background:
                        'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                ))}

                {/* Add to cart button skeleton */}
                <div
                  style={{
                    width: '100%',
                    height: '44px',
                    marginTop: '1.5rem',
                    borderRadius: '4px',
                    background:
                      'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </section>
        <EmailSubscribeFooter />

        {/* Mobile-specific tweaks for skeleton layout ONLY */}
        <style>{`
          @media (max-width: 991.98px) {
            .product-detail-section .product-detail-main-layout-skeleton {
              display: flex !important;
              flex-direction: column !important;
              gap: 1.75rem !important;
            }

            .product-detail-section .product-detail-skeleton-left {
              align-self: center !important;
              width: 100% !important;
            }

            .product-detail-section .product-detail-skeleton-left > .detail-hero > div:first-child {
              height: 260px !important;
            }

            .product-detail-section .product-detail-skeleton-thumbs {
              margin-top: 0.5rem !important;
              justify-content: center !important;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <section style={{ padding: '3rem 1rem 4rem', backgroundColor: '#FFFFFF' }} className="product-detail-section">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Back link */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
            style={{
              marginBottom: '1.25rem',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: backHover ? '#555555' : '#000000',
              fontSize: '0.95rem',
              textDecoration: 'underline',
              transition: 'color 0.2s ease',
            }}
          >
            ← Back to products
          </button>

          {/* Main Two-Column Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '2.5rem',
              alignItems: 'flex-start',
              marginBottom: '3rem',
            }}
            className="product-detail-main-layout"
          >
            {/* Left Column: Feature Blocks with Images */}
            <div>
              {/* Main Product Images - Responsive Gallery (structure and styling like admin ProductDetailsModal) */}
              <div style={{ marginBottom: '2rem' }}>
                {/* Hero image container */}
                <div
                  className="detail-hero position-relative rounded"
                  style={{
                    overflow: 'auto',
                    maxHeight: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--background-light)',
                  }}
                >
                  {gallery.length > 0 ? (
                    <>
                      {/* Fade-in shimmer overlay while hero image is loading */}
                      {!heroLoaded && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s ease-in-out infinite',
                          }}
                        />
                      )}
                      <img
                        src={gallery[featureIdx]}
                        alt={product.title}
                        style={{
                          width: 'auto',
                          height: 'auto',
                          maxWidth: '100%',
                          maxHeight: '600px',
                          objectFit: 'contain',
                          display: 'block',
                          opacity: heroLoaded ? 1 : 0,
                          transition: 'opacity 0.2s ease',
                        }}
                        onLoad={() => setHeroLoaded(true)}
                      />
                    </>
                  ) : (
                    <div
                      className="w-100 d-flex align-items-center justify-content-center"
                      style={{
                        height: '300px',
                        backgroundColor: 'var(--background-light)',
                      }}
                    >
                      {/* Simple placeholder box */}
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '16px',
                          backgroundColor: '#E0E0E0',
                        }}
                      />
                    </div>
                  )}

                  {/* Navigation + index indicator (same layout as admin modal) */}
                  {gallery.length > 1 && (
                    <div
                      className="position-absolute top-50 start-0 end-0 px-2 d-flex justify-content-between align-items-center"
                      style={{ transform: 'translateY(-50%)' }}
                    >
                      <button
                        type="button"
                        className="hero-nav-btn"
                        onClick={handlePreviousImage}
                        onMouseEnter={() => setHeroLoaded(true)}
                      >
                        ‹
                      </button>
                      <div className="hero-nav-indicator">
                        {featureIdx + 1}/{gallery.length}
                      </div>
                      <button
                        type="button"
                        className="hero-nav-btn"
                        onClick={handleNextImage}
                        onMouseEnter={() => setHeroLoaded(true)}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnails strip (same sizing and active styling concept as admin) */}
                {gallery.length > 0 && (
                  <div
                    className="d-flex justify-content-center gap-2 flex-wrap mt-3 p-3 rounded"
                    style={{
                      background: 'var(--background-light)',
                      border: '1px solid var(--input-border)',
                    }}
                  >
                    {gallery.slice(0, 6).map((img, idx) => {
                      const isActive = idx === featureIdx;
                      return (
                        <div
                          key={idx}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: isActive
                              ? '3px solid var(--primary-color)'
                              : '1px solid var(--input-border)',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isActive
                              ? '0 0 0 3px rgba(0, 123, 255, 0.25)'
                              : 'none',
                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                            position: 'relative',
                          }}
                          onClick={() => handleImageChange(idx)}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor =
                                'var(--primary-color)';
                              e.currentTarget.style.opacity = '0.8';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor =
                                'var(--input-border)';
                              e.currentTarget.style.opacity = '1';
                            }
                          }}
                        >
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary-color)',
                                border: '2px solid #fff',
                                zIndex: 10,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }}
                            />
                          )}
                          <img
                            src={img}
                            alt={`feature-${idx}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Product Information */}
            <div>
              {/* Rating and title */}
              <motion.div
                style={{ marginBottom: '0.75rem' }}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-100px' }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#FFC107', fontSize: '1.1rem' }}>★★★★★</span>
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{averageRating.toFixed(2)} out of 5</span>
                  <span style={{ fontSize: '0.9rem', color: '#999' }}>Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: '-100px' }}
                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontSize: 'clamp(1.75rem, 3.3vw, 2.4rem)',
                    fontWeight: 600,
                    margin: 0,
                    color: '#000',
                  }}
                >
                  {product.title}
                </motion.h1>
              </motion.div>

              {/* Pricing row */}
              <motion.div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-100px' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {product.oldPrice && (
                  <span
                    style={{
                      fontSize: '1rem',
                      color: '#999',
                      textDecoration: 'line-through',
                    }}
                  >
                    ₱{product.oldPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
                  </span>
                )}
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#000',
                  }}
                >
                  ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
                </span>
                {product.onSale && (
                  <span
                    style={{
                      backgroundColor: '#4CAF50',
                      color: '#FFFFFF',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Sale
                  </span>
                )}
              </motion.div>

              {/* Short Description Section */}
              {(() => {
                // Use custom subtitle if available, otherwise generate one
                if (product.subtitle) {
                  return (
                    <motion.div
                      style={{ marginBottom: '1.5rem' }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, margin: '-100px' }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <MarkdownRenderer
                        content={product.subtitle}
                        style={{
                          fontSize: '0.95rem',
                          color: '#333',
                          lineHeight: 1.6,
                        }}
                      />
                    </motion.div>
                  );
                }
                
                // Fallback to generated description
                const shortDesc = generateShortDescription(product);
                return (
                  <motion.div
                    style={{ marginBottom: '1.5rem' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: '-100px' }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Intro Paragraph */}
                    <p
                      style={{
                        fontSize: '0.95rem',
                        color: '#333',
                        lineHeight: 1.6,
                        marginBottom: '1rem',
                        textAlign: 'left',
                      }}
                    >
                      {shortDesc.intro}
                    </p>
                    
                    {/* Features List */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {shortDesc.features.map((feature, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.95rem',
                            color: '#333',
                          }}
                        >
                          <span style={{ color: '#FFC107', fontSize: '1rem', flexShrink: 0 }}>
                            {feature.icon}
                          </span>
                          <span>{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}

              {/* Payment methods row */}
              <motion.div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-100px' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {paymentLogos.map((method) => (
                  <div
                    key={method.name}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={method.src}
                      alt={`${method.name} logo`}
                      style={{
                        maxHeight: '22px',
                        width: 'auto',
                        display: 'block',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ))}
              </motion.div>

              {/* Add to cart button */}
              <motion.button
                whileHover={{ y: -2, backgroundColor: '#222222' }}
                whileTap={{ y: 0 }}
                type="button"
                onClick={() => {
                  // Add product to cart
                  const productToAdd = {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: getApiProductImage(product),
                  };
                  
                  addToCart(productToAdd);
                  
                  // Open cart panel
                  setCartOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '0.9rem 1.5rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '1.25rem',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-100px' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                Add to cart
              </motion.button>

              {/* Quick benefits row */}
              <motion.div
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '1.5rem',
                  marginBottom: '1.75rem',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-100px' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {[{
                  label: 'One-time payment',
                  icon: '💳',
                }, {
                  label: 'Instant download',
                  icon: '⚡',
                }, {
                  label: 'Lifetime support',
                  icon: '🎧',
                }].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </motion.div>

              {/* FAQ Section */}
              <motion.div
                style={{
                  marginBottom: '1.75rem',
                  borderTop: '1px solid #E0E0E0',
                  borderBottom: '1px solid #E0E0E0',
                  overflow: 'hidden',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-100px' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {faqsLoading ? (
                  <div style={{ padding: '1rem', fontSize: '0.95rem', color: '#666' }}>
                    Loading FAQs...
                  </div>
                ) : faqItems.length === 0 ? (
                  <div style={{ padding: '1rem', fontSize: '0.95rem', color: '#666' }}>
                    No FAQs available yet.
                  </div>
                ) : (
                  faqItems.map((faq, index) => (
                    <div key={index}>
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundColor: '#FFFFFF',
                        border: 'none',
                        borderBottom: index < faqItems.length - 1 ? '1px solid #E0E0E0' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8F8F8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <span
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#000',
                          }}
                        >
                          {faq.question}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          flexShrink: 0,
                          marginLeft: '1rem',
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6L8 10L12 6"
                            stroke="#666"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedFaq === index && faq.answer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ 
                            duration: 0.3,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          style={{
                            overflow: 'hidden',
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <div style={{
                            padding: '0 1rem 1rem 1rem',
                          }}>
                            {typeof faq.answer === 'function' ? faq.answer() : faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  ))
                )}
              </motion.div>

              {/* Share Button and Review Count - Outside Description Dropdown */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.title,
                        text: `Check out ${product.title} from AJ Creative Studio`,
                        url: window.location.href,
                      }).catch(() => {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      });
                    } else {
                      // Fallback: copy to clipboard
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#000',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    alignSelf: 'flex-start',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share</span>
                </button>
                
                {/* Rating and Review Count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.15rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="#FFD700"
                        stroke="#FFD700"
                        strokeWidth="1"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.95rem', color: '#000', fontWeight: 500 }}>
                    {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>

        {/* Customer Reviews Section - Same Width as Main Content */}
        <motion.div
          ref={customerReviewsSectionRef}
          style={{
            maxWidth: '1100px',
            margin: isMobile ? '2.5rem auto' : '3.5rem auto',
            padding: isMobile ? '0 0.75rem' : '0 1rem'
          }}
          className="customer-reviews-section"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-100px' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Customer Reviews Title - Centered */}
          <motion.div
            style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative' }}
            className="customer-reviews-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 style={{ 
              fontSize: '1.6rem', 
              fontWeight: 600, 
              margin: 0,
              color: '#000',
            }}>
              Customer Reviews
            </h2>
          </motion.div>

          {/* Rating Summary Section - Three Column Layout */}
          <motion.div
            className="rating-summary-section"
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto',
              gap: isMobile ? '1.5rem' : '2.5rem',
              alignItems: 'flex-start',
              marginBottom: isMobile ? '1.5rem' : '2rem',
              paddingBottom: isMobile ? '1.5rem' : '2rem',
              borderBottom: '1px solid #E0E0E0',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Overall Rating (Left) */}
            <div className="overall-rating-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: isMobile ? 'auto' : '140px' }}>
              <div className="overall-rating-stars" style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.75rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
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
              <div className="overall-rating-text" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#000', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                {averageRating.toFixed(2)} out of 5
              </div>
              <div className="overall-rating-count" style={{ fontSize: '0.9rem', color: '#666' }}>
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Star Rating Breakdown (Center) */}
            <div className="star-breakdown-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-start', width: isMobile ? '100%' : 'auto' }}>
              {starDistribution.map(({ stars, count }) => {
                const maxCount = Math.max(...starDistribution.map(s => s.count), 1);
                const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.15rem', minWidth: isMobile ? '80px' : '100px', flexShrink: 0 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={star <= stars ? '#FFD700' : 'none'}
                          stroke={star <= stars ? '#FFD700' : '#E0E0E0'}
                          strokeWidth="1"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <div style={{ position: 'relative', flex: 1, height: '10px', backgroundColor: '#E0E0E0', borderRadius: '2px', minWidth: isMobile ? '80px' : '100px', maxWidth: isMobile ? '100%' : '250px' }}>
                      {count > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${barWidth}%`,
                            backgroundColor: '#FFD700',
                            borderRadius: '2px',
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#666', minWidth: '30px', textAlign: 'right', fontWeight: 500 }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Write a review Button (Right) */}
            <div className="write-review-button-wrapper" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: isMobile ? 'center' : 'flex-end', marginTop: isMobile ? '0.5rem' : 0 }}>
              <motion.button
                whileHover={{ y: -2, backgroundColor: '#FFC700' }}
                whileTap={{ y: 0 }}
                type="button"
                className="write-review-button"
                onClick={() => {
                  if (reviewSubmitted) {
                    window.location.reload();
                  } else if (showReviewForm) {
                    // Reset form when canceling
                    setReviewRating(0);
                    setReviewTitle('');
                    setReviewContent('');
                    setDisplayName('');
                    setEmailAddress('');
                    setReviewSubmitted(false);
                    setValidationErrors({});
                    // Clean up preview URLs before clearing
                    filePreviews.forEach(url => {
                      if (url) URL.revokeObjectURL(url);
                    });
                    setUploadedFiles([]);
                    setFilePreviews([]);
                    setShowReviewForm(false);
                  } else {
                    // Open form and scroll will happen via useEffect
                    setShowReviewForm(true);
                  }
                }}
                style={{
                  padding: isMobile ? '0.65rem 1.5rem' : '0.75rem 2rem',
                  backgroundColor: '#FFD700',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {reviewSubmitted ? 'Refresh page' : showReviewForm ? 'Cancel review' : 'Write a review'}
              </motion.button>
            </div>
          </motion.div>

          {/* Write Review Form Dropdown */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                ref={reviewFormRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{
                  overflow: 'hidden',
                  marginBottom: '2rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div style={{ padding: '2rem' }}>
                  {reviewSubmitted ? (
                    /* Success Message */
                    <div ref={successMessageRef} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                      {/* Checkmark Icon */}
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        backgroundColor: '#FFD700', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)'
                      }}>
                        <svg 
                          width="48" 
                          height="48" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#FFFFFF" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          style={{ transform: 'rotate(-5deg)' }}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      
                      {/* Success Title */}
                      <h3 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: 700, 
                        marginBottom: '1rem', 
                        color: '#FFD700', 
                        textAlign: 'center' 
                      }}>
                        Review Submitted!
                      </h3>
                      
                      {/* Success Message */}
                      <p style={{ 
                        fontSize: '1rem', 
                        color: '#FFD700', 
                        lineHeight: 1.6, 
                        textAlign: 'center',
                        marginBottom: '2rem',
                        maxWidth: '500px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}>
                        Thank you! Your review will be published as soon as it is approved by the shop admin.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Form Header */}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#000', textAlign: 'center' }}>
                        Write a review
                      </h3>

                  {/* Rating Section */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem', color: '#333' }}>
                      Rating
                    </label>
                    <div 
                      style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                      onMouseLeave={() => setHoveredRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const displayRating = hoveredRating || reviewRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              setReviewRating(star);
                              if (validationErrors.rating) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.rating;
                                  return newErrors;
                                });
                              }
                            }}
                            onMouseEnter={() => setHoveredRating(star)}
                style={{
                              background: 'none',
                              border: 'none',
                              padding: '4px',
                              cursor: 'pointer',
                              margin: '-4px',
                            }}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill={star <= displayRating ? '#FFD700' : 'none'}
                              stroke="#FFD700"
                              strokeWidth="1.5"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                        );
                      })}
                      {(hoveredRating > 0 || reviewRating > 0) && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                          {hoveredRating || reviewRating} star{(hoveredRating || reviewRating) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {validationErrors.rating && (
                      <div className="invalid-feedback" style={{ display: 'block', width: '100%', marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc3545', textAlign: 'center' }}>
                        {validationErrors.rating}
                      </div>
                    )}
                  </div>

                  {/* Review Title */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem', color: '#333' }}>
                      Review Title <span style={{ color: '#808080' }}>(100)</span>
                    </label>
                    <input
                      ref={reviewTitleInputRef}
                      type="text"
                      className={`form-control ${validationErrors.title ? 'is-invalid' : ''}`}
                      value={reviewTitle}
                      onChange={(e) => {
                        setReviewTitle(e.target.value.slice(0, 100));
                        if (validationErrors.title) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.title;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Give your review a title"
                      maxLength={100}
                      style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        border: validationErrors.title ? '2px solid #dc3545' : '2px solid rgba(255, 215, 0, 0.5)',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#808080', marginTop: '0.25rem', textAlign: 'center' }}>
                      {reviewTitle.length}/100
                    </div>
                    {validationErrors.title && (
                      <div className="invalid-feedback" style={{ display: 'block', width: '100%', marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc3545', textAlign: 'center' }}>
                        {validationErrors.title}
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem', color: '#333' }}>
                      Review content <span style={{ color: '#808080' }}>(5000)</span>
                    </label>
                    <textarea
                      className={`form-control ${validationErrors.content ? 'is-invalid' : ''}`}
                      value={reviewContent}
                      onChange={(e) => {
                        setReviewContent(e.target.value.slice(0, 5000));
                        if (validationErrors.content) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.content;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Start writing here..."
                      maxLength={5000}
                      rows={6}
                      style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        resize: 'vertical',
                        border: validationErrors.content ? '2px solid #dc3545' : '2px solid rgba(255, 215, 0, 0.5)',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#808080', marginTop: '0.25rem', textAlign: 'center' }}>
                      {reviewContent.length}/5000
                    </div>
                    {validationErrors.content && (
                      <div className="invalid-feedback" style={{ display: 'block', width: '100%', marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc3545', textAlign: 'center' }}>
                        {validationErrors.content}
                      </div>
                    )}
                  </div>

                  {/* Picture Upload */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.75rem', color: '#333', textAlign: 'center' }}>
                      Photos (optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        const validFiles = [];
                        const validPreviews = [];
                        
                        files.forEach(file => {
                          // Check if file is an image
                          if (!file.type.startsWith('image/')) {
                            toast.error(`${file.name} is not an image file. Only images are allowed.`);
                            return;
                          }
                          
                          // Check file size (convert bytes to MB)
                          const fileSizeMB = file.size / (1024 * 1024);
                          if (fileSizeMB > MAX_FILE_SIZE_MB) {
                            toast.error(`${file.name} exceeds the maximum file size of ${MAX_FILE_SIZE_MB}MB. File size: ${fileSizeMB.toFixed(2)}MB`);
                            return;
                          }
                          
                          // File is valid
                          validFiles.push(file);
                          validPreviews.push(URL.createObjectURL(file));
                        });
                        
                        if (validFiles.length > 0) {
                          setUploadedFiles(prev => [...prev, ...validFiles]);
                          setFilePreviews(prev => [...prev, ...validPreviews]);
                          const imageCount = validFiles.length;
                          const message = `${imageCount} image${imageCount !== 1 ? 's' : ''} uploaded successfully`;
                          if (validFiles.length === files.length) {
                            toast.success(message);
                          }
                        }
                        
                        // Reset input to allow selecting the same file again
                        e.target.value = '';
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start', justifyContent: 'center' }}>
                      {/* Upload Box */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: '150px',
                          height: '120px',
                          border: '2px solid #E0E0E0',
                          borderRadius: '4px',
                  display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: '#FFFFFF',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#FFD700';
                          e.currentTarget.style.backgroundColor = '#FFF9E6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E0E0E0';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      
                      {/* Uploaded Images and Videos */}
                      {uploadedFiles.map((file, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            position: 'relative', 
                            width: '150px',
                            height: '120px',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {filePreviews[index] ? (
                            <>
                              <img
                                src={filePreviews[index]}
                                alt={file.name}
                                style={{
                                  width: '150px',
                                  height: '120px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '2px solid #E0E0E0',
                                  display: 'block',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#FFD700';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#E0E0E0';
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                  const newPreviews = filePreviews.filter((_, i) => i !== index);
                                  setUploadedFiles(newFiles);
                                  setFilePreviews(newPreviews);
                                  // Revoke the URL to free memory
                                  if (filePreviews[index]) {
                                    URL.revokeObjectURL(filePreviews[index]);
                                  }
                                  toast.info(`${file.name} removed`);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: 'rgba(0, 0, 0, 0.6)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  lineHeight: '1',
                                  padding: '0',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 0, 0, 0.8)';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                ×
                              </button>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Display Name */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem', color: '#333' }}>
                      Display name (displayed publicly like{' '}
                      <span ref={displayNameExampleDropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setDisplayNameExampleDropdownOpen(!displayNameExampleDropdownOpen)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: '#FFD700',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {displayNameExample}
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: displayNameExampleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        
                        {displayNameExampleDropdownOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              marginTop: '0.25rem',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E0E0E0',
                              borderRadius: '6px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              zIndex: 1000,
                              overflow: 'hidden',
                              minWidth: '120px',
                            }}
                          >
                            {displayNameOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setDisplayNameExample(option);
                                  setDisplayNameExampleDropdownOpen(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: displayNameExample === option ? '#0066CC' : '#FFFFFF',
                                  color: displayNameExample === option ? '#FFFFFF' : '#FFD700',
                                  border: 'none',
                                  borderBottom: '1px solid #F0F0F0',
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (displayNameExample !== option) {
                                    e.currentTarget.style.backgroundColor = '#FFF9E6';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (displayNameExample !== option) {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                  }
                                }}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </span>
                      )
                    </label>
                    <input
                      type="text"
                      className={`form-control ${validationErrors.displayName ? 'is-invalid' : ''}`}
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (validationErrors.displayName) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.displayName;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Display name"
                      style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        border: validationErrors.displayName ? '2px solid #dc3545' : '2px solid rgba(255, 215, 0, 0.5)',
                      }}
                    />
                    {validationErrors.displayName && (
                      <div className="invalid-feedback" style={{ display: 'block', width: '100%', marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc3545', textAlign: 'center' }}>
                        {validationErrors.displayName}
                      </div>
                    )}
                  </div>

                  {/* Email Address */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem', color: '#333' }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                      value={emailAddress}
                      onChange={(e) => {
                        setEmailAddress(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Your email address"
                      style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        border: validationErrors.email ? '2px solid #dc3545' : '2px solid rgba(255, 215, 0, 0.5)',
                      }}
                    />
                    {validationErrors.email && (
                      <div className="invalid-feedback" style={{ display: 'block', width: '100%', marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc3545', textAlign: 'center' }}>
                        {validationErrors.email}
                      </div>
                    )}
                  </div>

                  {!reviewSubmitted && (
                    <>
                      {/* Privacy Notice */}
                      <div style={{ 
                        marginBottom: '2rem', 
                        fontSize: '0.875rem', 
                        color: '#4a4a4a', 
                        lineHeight: 1.6, 
                        textAlign: 'center',
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        padding: '0 1rem'
                      }}>
                        How we use your data: We'll only contact you about the review you left, and only if necessary. By submitting your review, you agree to Judge.me's{' '}
                        <a href="#" style={{ color: '#007bff', textDecoration: 'underline' }}>terms</a>,{' '}
                        <a href="#" style={{ color: '#007bff', textDecoration: 'underline' }}>privacy</a> and{' '}
                        <a href="#" style={{ color: '#007bff', textDecoration: 'underline' }}>content policies</a>.
                      </div>
                    </>
                  )}

                  {/* Action Buttons - Always Visible */}
                  {reviewSubmitted ? (
                    <div 
                      ref={refreshButtonRef}
                      style={{ 
                        display: 'flex', 
                  gap: '1.25rem',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginTop: '2rem'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          window.location.reload();
                        }}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#FFFFFF',
                          color: '#FFD700',
                          border: '2px solid #FFD700',
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '140px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFF9E6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        Refresh page
                      </button>
                      </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      gap: '1.25rem', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      {reviewStatusMessage && (
                        <div
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            color:
                              reviewStatusType === 'success'
                                ? '#1f7a1f'
                                : reviewStatusType === 'error'
                                  ? '#b00020'
                                  : '#333333',
                          }}
                        >
                          {reviewStatusMessage}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewRating(0);
                          setReviewTitle('');
                          setReviewContent('');
                          setDisplayName('');
                          setEmailAddress('');
                          setReviewSubmitted(false);
                          setValidationErrors({});
                          // Clean up preview URLs before clearing
                          filePreviews.forEach(url => {
                            if (url) URL.revokeObjectURL(url);
                          });
                          setUploadedFiles([]);
                          setFilePreviews([]);
                        }}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#FFFFFF',
                          color: '#FFD700',
                          border: '2px solid #FFD700',
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '140px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFF9E6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        Cancel review
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSubmitReview();
                        }}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#FFD700',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '140px',
                          opacity: reviewSubmitting ? 0.7 : 1,
                        }}
                        disabled={reviewSubmitting}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFC700';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFD700';
                        }}
                      >
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  )}
                    </>
                  )}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sort Option Dropdown */}
          <div ref={sortDropdownRef} className="sort-option-dropdown" style={{ marginBottom: '1.5rem', position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#FFD700',
                fontSize: '0.95rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {selectedSort}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none"
                style={{ transform: sortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {sortDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  minWidth: '180px',
                  overflow: 'hidden',
                }}
              >
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedSort(option);
                      setSortDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: selectedSort === option ? '#0066CC' : '#FFFFFF',
                      color: selectedSort === option ? '#FFFFFF' : '#FFD700',
                      border: 'none',
                      borderBottom: '1px solid #F0F0F0',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSort !== option) {
                        e.target.style.backgroundColor = '#FFF9E6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSort !== option) {
                        e.target.style.backgroundColor = '#FFFFFF';
                      }
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            </div>

          {/* Individual Reviews */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '1rem 0' }}>
                Loading reviews...
              </div>
            ) : paginatedReviews.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '1rem 0' }}>
                No reviews yet. Be the first to write one.
              </div>
            ) : paginatedReviews.map((review, index) => (
              <div
                key={review.id}
                style={{
                  borderBottom: index < paginatedReviews.length - 1 ? '1px solid #E0E0E0' : 'none',
                  paddingBottom: index < paginatedReviews.length - 1 ? '1.5rem' : 0,
                }}
              >
                {/* Star Rating */}
                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="#FFD700"
                      stroke="#FFD700"
                      strokeWidth="1"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
          </div>

                {/* Reviewer Info and Date */}
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '0.35rem' : 0, marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* User Icon */}
                    <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#FFD700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                        </svg>
                      </div>
                      {review.verified && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '14px',
                            height: '14px',
                            backgroundColor: '#FFD700',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #FFFFFF',
                          }}
                        >
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#000' }}>{review.name}</span>
                    {review.verified && (
                      <span
                        style={{
                          backgroundColor: '#FFD700',
                          color: '#FFFFFF',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        Verified
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#999' }}>{review.date}</span>
                </div>

                {/* Review Title */}
                {review.title && (
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#000' }}>
                    {review.title}
                  </div>
                )}

                {/* Review Text */}
                <div style={{ fontSize: '0.95rem', color: '#333', lineHeight: 1.6 }}>
                  {review.text}
                </div>
                {review.imageUrls && review.imageUrls.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: '0.75rem',
                    }}
                  >
                    {review.imageUrls.map((url, imgIndex) => (
                      <div
                        key={imgIndex}
                        style={{
                          width: '90px',
                          height: '70px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #E0E0E0',
                        }}
                      >
                        <img
                          src={url}
                          alt={`Review ${review.id} image ${imgIndex + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            cursor: 'zoom-in',
                          }}
                          onClick={() => setActiveReviewImage(url)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="pagination-wrapper"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '2rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="pagination-button pagination-nav-button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #CCCCCC',
                  borderRadius: '4px',
                  backgroundColor: currentPage === 1 ? '#F5F5F5' : '#FFFFFF',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? '#999' : '#000',
                  fontSize: '1rem',
                }}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-button pagination-page-button${
                    currentPage === page ? ' active' : ''
                  }`}
                  onClick={() => handlePageChange(page)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #CCCCCC',
                    borderRadius: '4px',
                    backgroundColor: currentPage === page ? '#000' : '#FFFFFF',
                    color: currentPage === page ? '#FFFFFF' : '#000',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    textDecoration: currentPage === page ? 'underline' : 'none',
                    fontWeight: currentPage === page ? 600 : 400,
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="pagination-button pagination-nav-button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #CCCCCC',
                  borderRadius: '4px',
                  backgroundColor: currentPage === totalPages ? '#F5F5F5' : '#FFFFFF',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage === totalPages ? '#999' : '#000',
                  fontSize: '1rem',
                }}
              >
                &gt;
              </button>
            </div>
          )}
        </motion.div>
        {activeReviewImage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem',
            }}
            onClick={() => setActiveReviewImage(null)}
          >
            <div
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeReviewImage}
                alt="Review attachment"
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                }}
              />
              <button
                type="button"
                onClick={() => setActiveReviewImage(null)}
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '-12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#fff',
                  color: '#000',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </section>


      <EmailSubscribeFooter />

      {/* Toast Container */}
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
      />

      {/* Mobile / tablet-specific layout tweaks for product detail images and skeleton */}
      <style>{`
        @media (max-width: 991.98px) {
          /* Stack image gallery above text on small screens */
          .product-detail-section .product-detail-main-layout {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.75rem !important;
          }

          /* Stack skeleton layout similarly on mobile */
          .product-detail-section .product-detail-main-layout-skeleton {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.75rem !important;
          }

          .product-detail-section .product-detail-skeleton-left > div:first-child {
            height: 260px !important;
          }

          .product-detail-section .product-detail-skeleton-thumbs {
            margin-top: 0.5rem !important;
          }

          .product-detail-section .detail-hero {
            max-height: 420px !important;
          }

          .product-detail-section .product-image-thumbnails,
          .product-detail-section .d-flex.justify-content-center.gap-2.flex-wrap.mt-3.p-3.rounded {
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </>
  );
};


export default ProductDetail;
