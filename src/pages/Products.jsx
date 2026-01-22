import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import EmailSubscribeFooter from '../components/EmailSubscribeFooter';
import FilterAndSort from '../components/FilterAndSort';
import { getProductImage as getApiProductImage, formatCurrency } from '../utils/productImageUtils';

// Helper function to convert title to URL-friendly slug
const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const normalizePrice = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = parseFloat(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Sample products data - kept only as design fallback, main data now comes from API
export const allProducts = [

  {

    id: 1,

    title: 'Accounts Receivables Tracker',

    subtitle: 'Track invoices and payments efficiently',

    price: 199.0,

    oldPrice: null,

    onSale: false,

    category: 'Business',

    availability: 'In Stock',

    imageType: 'receivables',

    color: '#4CAF50',

    accentColor: '#2E7D32',

  },

  {

    id: 2,

    title: 'Airbnb Bookings & Expense Tracker',

    subtitle: 'Manage your rental business',

    price: 299.0,

    oldPrice: 599.0,

    onSale: true,

    category: 'Business',

    availability: 'In Stock',

    imageType: 'airbnb',

    color: '#2196F3',

    accentColor: '#1565C0',

  },

  {

    id: 3,

    title: 'Bank Account Tracker',

    subtitle: 'Monitor all your accounts',

    price: 199.0,

    oldPrice: null,

    onSale: false,

    category: 'Finance',

    availability: 'In Stock',

    imageType: 'bank',

    color: '#4CAF50',

    accentColor: '#2E7D32',

  },

  {

    id: 4,

    title: 'Best Selling Templates Bundle',

    subtitle: '10+ premium spreadsheet templates',

    price: 1499.0,

    oldPrice: 3735.0,

    onSale: true,

    category: 'Bundle',

    availability: 'In Stock',

    imageType: 'bundle',

    color: '#FFC107',

    accentColor: '#F57C00',

  },

  {

    id: 5,

    title: 'Buy and Sell Business Tracker',

    subtitle: 'Track your buy and sell operations',

    price: 249.0,

    oldPrice: 399.0,

    onSale: true,

    category: 'Business',

    availability: 'In Stock',

    imageType: 'buy-sell',

    color: '#9C27B0',

    accentColor: '#6A1B9A',

  },

  {

    id: 6,

    title: 'Check Monitoring Template',

    subtitle: 'Keep track of all your checks',

    price: 179.0,

    oldPrice: null,

    onSale: false,

    category: 'Finance',

    availability: 'In Stock',

    imageType: 'check',

    color: '#E91E63',

    accentColor: '#C2185B',

  },

  {

    id: 7,

    title: 'Client Appointment Tracker',

    subtitle: 'Schedule and manage appointments',

    price: 229.0,

    oldPrice: null,

    onSale: false,

    category: 'Business',

    availability: 'In Stock',

    imageType: 'appointment',

    color: '#00BCD4',

    accentColor: '#00838F',

  },

  {

    id: 8,

    title: 'Meeting Notes Template',

    subtitle: 'Organize your meeting notes',

    price: 149.0,

    oldPrice: null,

    onSale: false,

    category: 'Productivity',

    availability: 'In Stock',

    imageType: 'meeting',

    color: '#4CAF50',

    accentColor: '#2E7D32',

  },

  {

    id: 9,

    title: 'Monthly Subscription Business Payments Tracker',

    subtitle: 'Track recurring payments',

    price: 199.0,

    oldPrice: 299.0,

    onSale: true,

    category: 'Business',

    availability: 'In Stock',

    imageType: 'subscription',

    color: '#FF9800',

    accentColor: '#E65100',

  },

  {

    id: 10,

    title: 'Inventory Management & Sales Tracker',

    subtitle: 'Complete inventory solution',

    price: 349.0,

    oldPrice: 499.0,

    onSale: true,

    category: 'Business',

    availability: 'In Stock',

    imageType: 'inventory',

    color: '#F44336',

    accentColor: '#C62828',

  },

  {

    id: 11,

    title: 'Personal Productivity Bundle',

    subtitle: '15+ spreadsheet templates',

    price: 1299.0,

    oldPrice: 3090.0,

    onSale: true,

    category: 'Bundle',

    availability: 'In Stock',

    imageType: 'productivity-bundle',

    color: '#FFC107',

    accentColor: '#F57C00',

  },

  {

    id: 12,

    title: 'Expense Tracker Pro',

    subtitle: 'Track all your expenses',

    price: 179.0,

    oldPrice: null,

    onSale: false,

    category: 'Finance',

    availability: 'In Stock',

    imageType: 'expense',

    color: '#9C27B0',

    accentColor: '#6A1B9A',

  },

  // Add more products to reach 47 total

  ...Array.from({ length: 35 }, (_, i) => ({

    id: 13 + i,

    title: `Spreadsheet Template ${13 + i}`,

    subtitle: 'Professional spreadsheet solution',

    price: 149.0 + i * 10,

    oldPrice: i % 3 === 0 ? 199.0 + i * 10 : null,

    onSale: i % 3 === 0,

    category: ['Business', 'Finance', 'Productivity', 'Personal'][i % 4],

    availability: 'In Stock',

    imageType: 'default',

    color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][i % 4],

    accentColor: ['#2E7D32', '#1565C0', '#E65100', '#6A1B9A'][i % 4],

  })),

];

// Add slug property to all products
allProducts.forEach(product => {
  product.slug = createSlug(product.title);
});

// Generate product mockup image
export const getProductImage = (imageType, bgColor, accentColor) => {
  const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="${bgColor}"/>
    <!-- Desktop monitor -->
    <rect x="50" y="30" width="300" height="200" fill="#E5E5E5" rx="4"/>
    <rect x="50" y="30" width="300" height="180" fill="#F5F5F5" rx="4 4 0 0"/>
    <rect x="60" y="40" width="280" height="160" fill="#FFFFFF" rx="2" stroke="#D0D0D0" stroke-width="1"/>
    <!-- Screen content -->
    <rect x="60" y="40" width="280" height="30" fill="#F8F9FA" stroke="#E0E0E0" stroke-width="1"/>
    <circle cx="80" cy="55" r="6" fill="${accentColor}"/>
    <rect x="100" y="50" width="200" height="20" fill="#E0E0E0" rx="2"/>
    <!-- Spreadsheet grid -->
    ${Array.from({ length: 5 }, (_, i) => {
      const y = 75 + i * 20;
      return `<rect x="70" y="${y}" width="260" height="18" fill="${
        i === 0 ? '#F8F9FA' : '#FFFFFF'
      }" stroke="#E0E0E0" stroke-width="0.5"/>`;
    }).join('')}
    <!-- Mobile device -->
    <rect x="320" y="100" width="60" height="100" fill="#E5E5E5" rx="8"/>
    <rect x="325" y="105" width="50" height="90" fill="#FFFFFF" rx="4"/>
    <rect x="330" y="110" width="40" height="25" fill="#F8F9FA" rx="2"/>
    ${Array.from({ length: 3 }, (_, i) => {
      const y = 140 + i * 15;
      return `<rect x="330" y="${y}" width="40" height="12" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="0.5"/>`;
    }).join('')}
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
};

const Products = () => {
  const [products, setProducts] = useState([]); // live products from API
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState({});
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    categories: [], // multiple categories
  });
  const [sortBy, setSortBy] = useState('Alphabetically, A-Z');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const productsPerPage = 8;
  const location = useLocation();
  const navigate = useNavigate();

  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8000';

  // Data source: use live products from API only
  const sourceProducts = products;

  // Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/products?per_page=1000`, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch products for public listing', response.status);
          setProducts([]);
          return;
        }

        const data = await response.json();
        let list = [];
        if (Array.isArray(data.products)) {
          list = data.products;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        }

        const normalized = list.map((p) => {
          const title = p.title || p.name || '';
          const price = normalizePrice(p.price);
          return {
            ...p,
            title,
            price,
            oldPrice: p.old_price ?? null,
            onSale: !!p.on_sale,
            category: p.category || 'Uncategorized',
            availability: p.is_active === false ? 'Unavailable' : 'In Stock',
            slug: p.slug || createSlug(title),
          };
        });

        setProducts(normalized);
      } catch (error) {
        console.error('Error fetching products for public listing:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiBaseUrl]);

  // Fetch collections with products for storefront filters
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/public/product-collections`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error(
            'Failed to fetch public product collections',
            response.status
          );
          setCollections([]);
          return;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.collections)) {
          // Normalize collection products for consistent display
          const normalizedCollections = data.collections.map((c) => {
            const normalizedProducts = Array.isArray(c.products)
              ? c.products.map((p) => {
                  const title = p.title || p.name || '';
                  const price = normalizePrice(p.price);
                  return {
                    ...p,
                    title,
                    price,
                    oldPrice: p.old_price ?? null,
                    onSale: !!p.on_sale,
                    category: p.category || 'Uncategorized',
                    availability: p.is_active === false ? 'Unavailable' : 'In Stock',
                    slug: p.slug || createSlug(title),
                  };
                })
              : [];
            return {
              ...c,
              products: normalizedProducts,
            };
          });
          setCollections(normalizedCollections);
        } else {
          setCollections([]);
        }
      } catch (error) {
        console.error('Error fetching public product collections:', error);
        setCollections([]);
      }
    };

    fetchCollections();
  }, [apiBaseUrl]);

  // Filter collections to only show those with products
  const collectionsWithProducts = useMemo(() => {
    return collections.filter((collection) => {
      // Check if collection has products array with at least one product
      return Array.isArray(collection.products) && collection.products.length > 0;
    });
  }, [collections]);

  // Sync search term from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const term = params.get('search') || '';
    setSearchTerm(term);
    setSearchInput(term);
    setCurrentPage(1);
  }, [location.search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      navigate(`/all-products?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/all-products');
    }
  };

  const handleSearchClear = () => {
    setSearchInput('');
    if (searchTerm) {
      navigate('/all-products');
    }
  };

  // Base products after collection + search term
  const baseFilteredProducts = useMemo(() => {
    let filtered = [];

    // If a collection is selected and it has products, use those products
    if (selectedCollectionId && collections.length > 0) {
      const collection = collections.find(
        (c) => String(c.id) === String(selectedCollectionId)
      );
      if (collection && Array.isArray(collection.products) && collection.products.length > 0) {
        // Normalize collection products
        filtered = collection.products.map((p) => ({
          ...p,
          oldPrice: p.old_price ?? p.oldPrice ?? null,
          onSale: p.onSale ?? !!p.on_sale,
          availability:
            p.availability ?? (p.is_active === false ? 'Unavailable' : 'In Stock'),
        }));
      } else if (collection) {
        // Fallback: filter main products by the collection's product IDs if products were not eager loaded
        const productIds = new Set(
          Array.isArray(collection.products)
            ? collection.products.map((p) => String(p.id))
            : []
        );
        filtered = sourceProducts.filter((p) => productIds.has(String(p.id)));
      } else {
        filtered = [];
      }
    } else {
      // No collection selected, use all products
      filtered = [...sourceProducts];
    }

    // Apply search term
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const subtitle = (p.subtitle || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return (
          title.includes(normalizedSearch) ||
          subtitle.includes(normalizedSearch) ||
          category.includes(normalizedSearch)
        );
      });
    }

    return filtered;
  }, [sourceProducts, selectedCollectionId, collections, searchTerm]);

  // Category counts and list (only categories that actually have products)
  const categoryCounts = useMemo(() => {
    const counts = {};
    baseFilteredProducts.forEach((p) => {
      if (!p.category) return;
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [baseFilteredProducts]);

  const allCategories = useMemo(
    () => Object.keys(categoryCounts).sort(),
    [categoryCounts]
  );

  // Filter + sort
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...baseFilteredProducts];

    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter(p => filters.categories.includes(p.category));
    }

    // Apply sorting
    switch (sortBy) {
      case 'Alphabetically, A-Z':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Alphabetically, Z-A':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'Price, low to high':
        filtered.sort((a, b) => normalizePrice(a.price) - normalizePrice(b.price));
        break;
      case 'Price, high to low':
        filtered.sort((a, b) => normalizePrice(b.price) - normalizePrice(a.price));
        break;
      case 'Date, new to old':
        filtered = [...filtered].reverse();
        break;
      case 'Date, old to new':
      default:
        break;
    }

    return filtered;
  }, [filters, sortBy, baseFilteredProducts]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handlePageChange = page => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveAll = () => {
    setFilters({ categories: [] });
    setSelectedCollectionId(null);
    setSortBy('Alphabetically, A-Z');
    setCurrentPage(1);
  };

  const handleCollectionChange = (value) => {
    if (value === '' || value === 'all') {
      setSelectedCollectionId(null);
    } else {
      const id = parseInt(value, 10);
      setSelectedCollectionId(Number.isNaN(id) ? null : id);
    }
    setSortBy('Alphabetically, A-Z');
    setCurrentPage(1);
  };

  // Clear selected collection if it no longer has products
  useEffect(() => {
    if (selectedCollectionId) {
      const selectedCollectionExists = collectionsWithProducts.some(
        (c) => String(c.id) === String(selectedCollectionId)
      );
      if (!selectedCollectionExists && collectionsWithProducts.length > 0) {
        // Only clear if there are other collections available
        // This prevents clearing when collections are still loading
        setSelectedCollectionId(null);
      }
    }
  }, [selectedCollectionId, collectionsWithProducts]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', width: '100%' }}>
      {/* Main content */}
      <section
        className="products-page-section"
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
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="products-page-title"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: '#000',
              marginTop: 0,
              marginBottom: '2rem',
              textAlign: 'left',
            }}
          >
            Products
          </motion.h1>

          {/* Search results header + search bar */}
          {searchTerm && (
            <div className="products-search-header">
              <h2 className="products-search-title">Search results</h2>
              <form className="products-search-form" onSubmit={handleSearchSubmit}>
                <div className="products-search-input-wrapper">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search"
                    className="products-search-input"
                    aria-label="Search products"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className="products-search-clear"
                      aria-label="Clear search"
                      onClick={handleSearchClear}
                    >
                      ×
                    </button>
                  )}
                  <button
                    type="submit"
                    className="products-search-submit"
                    aria-label="Submit search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.65" y1="16.65" x2="21" y2="21" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter and Sort Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <FilterAndSort
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              onCollectionChange={(value) => {
                handleCollectionChange(value);
                setCurrentPage(1);
              }}
              sortBy={sortBy}
              onSortChange={(value) => {
                setSortBy(value);
                setCurrentPage(1);
              }}
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentPage(1);
              }}
              allCategories={allCategories}
              categoryCounts={categoryCounts}
              filteredCount={filteredAndSortedProducts.length}
              totalCount={baseFilteredProducts.length}
              onClearAll={handleRemoveAll}
            />
          </motion.div>

          {/* Loading state, no products, or grid */}
          {loading ? (
            <div
              className="products-grid loading"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '3rem',
              }}
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="product-card-skeleton"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #E0E0E0',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Header skeleton */}
                  <div
                    style={{
                      height: '44px',
                      background:
                        'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                  {/* Image skeleton */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '4/3',
                      background:
                        'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                  {/* Text skeleton */}
                  <div style={{ padding: '0.75rem' }}>
                    <div
                      style={{
                        height: '14px',
                        width: '70%',
                        marginBottom: '0.5rem',
                        borderRadius: '6px',
                        background:
                          'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                      }}
                    />
                    <div
                      style={{
                        height: '16px',
                        width: '40%',
                        borderRadius: '6px',
                        background:
                          'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 1rem',
                textAlign: 'center',
                minHeight: '300px',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 700,
                  color: '#000',
                  margin: '0 0 1rem 0',
                }}
              >
                No products found
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#666',
                  margin: 0,
                }}
              >
                Use fewer filters or{' '}
                <button
                  onClick={handleRemoveAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#000',
                    textDecoration: 'underline',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  remove all
                </button>
              </p>
            </div>
          ) : (
            <div
              className="products-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '3rem',
              }}
            >
              <AnimatePresence mode="wait">
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: '-100px' }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                      delay: index * 0.04,
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #E0E0E0',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                    }}
                    whileHover={{
                      y: -4,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                      transition: { duration: 0.2, ease: 'easeOut' },
                    }}
                    className="product-card"
                  >
                    <Link
                      to={`/products/${product.slug}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                      }}
                    >
                      {/* Header banner */}
                      <div
                        style={{
                          backgroundColor: product.color || '#4CAF50',
                          padding: '0.75rem',
                          color: '#FFFFFF',
                        }}
                        className="green-header-banner"
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            lineHeight: 1.3,
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
                          overflow: 'hidden',
                        }}
                      >
                        {product.onSale && (
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
                        {(() => {
                          const imageUrl =
                            getApiProductImage(product) ||
                            getProductImage(
                              product.imageType,
                              product.color,
                              product.accentColor
                            );

                          if (!imageUrl) {
                            return null;
                          }

                          const isLoaded = imageLoading[imageUrl] === false;

                          return (
                            <>
                              {/* Shimmer overlay while image is loading */}
                              {!isLoaded && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background:
                                      'linear-gradient(90deg, #f2f2f2 25%, #e5e5e5 50%, #f2f2f2 75%)',
                                    backgroundSize: '200% 100%',
                                    animation:
                                      'shimmer 1.5s ease-in-out infinite',
                                    zIndex: 1,
                                  }}
                                />
                              )}
                              <img
                                src={imageUrl}
                                alt={product.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                  opacity: isLoaded ? 1 : 0,
                                  transition: 'opacity 0.3s ease',
                                }}
                                onLoadStart={() => {
                                  setImageLoading((prev) => ({
                                    ...prev,
                                    [imageUrl]: true,
                                  }));
                                }}
                                onLoad={() => {
                                  setImageLoading((prev) => ({
                                    ...prev,
                                    [imageUrl]: false,
                                  }));
                                }}
                                onError={() => {
                                  setImageLoading((prev) => ({
                                    ...prev,
                                    [imageUrl]: false,
                                  }));
                                }}
                              />
                            </>
                          );
                        })()}
                      </div>

                      {/* Feature bar */}
                      <div
                        className="product-feature-bar"
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
                          className="feature-bar-icon"
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
                        <span className="feature-bar-text-full" style={{ 
                          lineHeight: 1.3,
                        }}>
                          Google Sheets Document | Easy to use | Mobile
                          Compatibility
                        </span>
                        <span className="feature-bar-text-mobile" style={{ 
                          lineHeight: 1.3,
                          display: 'none',
                        }}>
                          Google Sheets
                        </span>
                      </div>

                      {/* Title + price */}
                      <div className="product-card-content" style={{ padding: '0.75rem', flex: 1 }}>
                        <h3
                          className="product-title"
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#000',
                            margin: '0 0 0.5rem 0',
                            lineHeight: 1.4,
                          }}
                        >
                          {product.title}
                        </h3>
                        <div
                          className="product-price-container"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {product.oldPrice && (
                            <span
                              className="product-old-price"
                              style={{
                                fontSize: '0.9rem',
                                color: '#999',
                                textDecoration: 'line-through',
                              }}
                            >
                              ₱
                              {product.oldPrice.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              PHP
                            </span>
                          )}
                          <span
                            className="product-price"
                            style={{
                              fontSize: product.oldPrice ? '1rem' : '1.1rem',
                              fontWeight: 600,
                              color: '#000',
                            }}
                          >
                            ₱
                            {product.price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            PHP
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {filteredAndSortedProducts.length > 0 && totalPages > 1 && (
            <div
              className="pagination-wrapper"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '3rem',
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
                  backgroundColor:
                    currentPage === 1 ? '#F5F5F5' : '#FFFFFF',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? '#999' : '#000',
                  fontSize: '1rem',
                }}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                    backgroundColor:
                      currentPage === page ? '#000' : '#FFFFFF',
                    color: currentPage === page ? '#FFFFFF' : '#000',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    textDecoration:
                      currentPage === page ? 'underline' : 'none',
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
                  backgroundColor:
                    currentPage === totalPages ? '#F5F5F5' : '#FFFFFF',
                  cursor:
                    currentPage === totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage === totalPages ? '#999' : '#000',
                  fontSize: '1rem',
                }}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </section>

      <EmailSubscribeFooter />

      {/* Responsive CSS for mobile only */}
      <style>{`
        /* Prevent horizontal overflow and flickering - Global fixes (excluding navbar) */
        html, body {
          overflow-x: hidden !important;
          width: 100% !important;
          max-width: 100vw !important;
          position: relative !important;
        }
        
        #root {
          overflow-x: hidden !important;
          width: 100% !important;
          max-width: 100vw !important;
          position: relative !important;
        }
        
        /* Prevent main containers from causing overflow (excluding navbar) */
        main, section:not(.navbar), article, div[class*="container"]:not(.navbar-wrapper):not(.navbar-icons-wrapper), div[class*="wrapper"]:not(.navbar-wrapper):not(.navbar-icons-wrapper) {
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
        
        /* Products page specific - Only overflow fixes, no padding changes */
        .products-page-section {
          overflow-x: hidden !important;
          width: 100% !important;
          max-width: 100vw !important;
          position: relative !important;
        }
        
        /* Ensure inner container matches Hero component exactly on large screens */
        @media (min-width: 769px) {
          .products-page-section > div {
            max-width: 1100px !important;
            margin: 0 auto !important;
          }
        }
        
        .products-page-section > div {
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }
        
        /* Prevent motion components from causing overflow */
        [data-framer-component] {
          max-width: 100vw !important;
        }
        
        /* Pagination button hover effects - ONLY background color + smooth transition */
        .pagination-button:not(:disabled) {
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        
        .pagination-page-button:not(.active):not(:disabled):hover {
          background-color: #E5E5E5 !important;
        }
        
        .pagination-page-button.active:hover {
          background-color: #222 !important;
        }
        
        .pagination-nav-button:not(:disabled):hover {
          background-color: #E5E5E5 !important;
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
        }
        
        .products-search-header {
          margin-bottom: 1.5rem;
        }

        .products-search-title {
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 700;
          color: #000;
          margin: 0 0 0.75rem 0;
          text-align: center;
        }

        .products-search-form {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .products-search-input-wrapper {
          width: min(600px, 100%);
          display: flex;
          align-items: center;
          border: 1px solid #cfcfcf;
          border-radius: 10px;
          padding: 0 10px;
          background-color: #fff;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03), 0 4px 10px rgba(0, 0, 0, 0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .products-search-input-wrapper:focus-within {
          border-color: #111;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08), 0 6px 14px rgba(0, 0, 0, 0.08);
        }

        .products-search-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 10px 8px;
          font-size: 0.95rem;
          color: #111;
          background: transparent;
        }

        .products-search-input::placeholder {
          color: #777;
        }

        .products-search-submit {
          border: none;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          color: #111;
          cursor: pointer;
        }

        .products-search-clear {
          border: none;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          font-size: 1.6rem;
          line-height: 1;
          color: #666;
          cursor: pointer;
          border-radius: 999px;
          transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .products-search-clear:hover {
          background-color: #f2f2f2;
          color: #111;
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          /* Prevent horizontal scroll on mobile - Stronger constraints (excluding navbar) */
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
            position: relative !important;
          }
          
          #root {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
            position: relative !important;
          }
          
          *:not(.navbar):not(.navbar-wrapper):not(.navbar-icons-wrapper):not(.navbar-icon-btn):not(.navbar-cart-btn) {
            max-width: 100vw !important;
          }
          
          .products-page-section {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          
          .products-page-section > div {
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          
          /* Prevent filter panel from causing overflow */
          .mobile-filter-button-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          
          /* Prevent drawer from causing overflow during animation */
          .mobile-filter-drawer {
            max-width: min(80%, 400px) !important;
            right: 0 !important;
            overflow-x: hidden !important;
          }
          
          .mobile-drawer-backdrop {
            width: 100vw !important;
            max-width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
          }
          
          .products-grid,
          .products-grid.loading {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          
          .product-card {
            border-radius: 6px !important;
          }
          
          .green-header-banner {
            padding: 0.5rem !important;
          }
          
          .green-header-banner > div {
            font-size: 0.65rem !important;
            line-height: 1.2 !important;
          }
          
          .product-feature-bar {
            padding: 0.4rem 0.5rem !important;
            font-size: 0.65rem !important;
            gap: 0.3rem !important;
          }
          
          .product-feature-bar .feature-bar-icon {
            width: 12px !important;
            height: 12px !important;
          }
          
          .product-feature-bar .feature-bar-text-full {
            display: none !important;
          }
          
          .product-feature-bar .feature-bar-text-mobile {
            display: inline !important;
          }
          
          .product-card-content {
            padding: 0.5rem !important;
          }
          
          .product-title {
            font-size: 0.8rem !important;
            margin-bottom: 0.4rem !important;
          }
          
          .product-old-price {
            font-size: 0.75rem !important;
          }
          
          .product-price {
            font-size: 0.85rem !important;
          }
          
          .product-price-container {
            gap: 0.3rem !important;
          }
          
          .products-page-title {
            font-size: 1.5rem !important;
            margin-bottom: 1rem !important;
          }
          
          .pagination-wrapper {
            gap: 0.25rem !important;
            margin-bottom: 2rem !important;
          }
          
          .pagination-button {
            padding: 0.4rem 0.75rem !important;
            font-size: 0.875rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .products-grid,
          .products-grid.loading {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          
          .product-card-skeleton {
            min-height: auto !important;
          }
        }
        
        @media (max-width: 360px) {
          .products-grid,
          .products-grid.loading {
            gap: 0.4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Products;

