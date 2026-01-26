// Utility functions for handling product images from API

const rawApiBaseUrl =
  import.meta.env.VITE_LARAVEL_API ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

// Normalize:
// - apiBaseUrl: always points to the Laravel API prefix (ends with /api)
// - fileBaseUrl: origin/base (no /api)
const apiBaseUrl = (() => {
  const trimmed = rawApiBaseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

const fileBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

export const buildAssetUrl = (rawPath) => {
  if (!rawPath) return null;
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }
  // Use API route for storage files (works on DigitalOcean)
  const cleaned = rawPath.replace(/^\/+/, '');
  // Remove 'storage/' prefix if present since we'll add /api/storage/
  const pathWithoutStorage = cleaned.startsWith('storage/') 
    ? cleaned.replace(/^storage\//, '') 
    : cleaned;
  // Use API route: /api/storage/{path}
  return `${apiBaseUrl}/storage/${pathWithoutStorage}`;
};

const normalizeImageValue = (val) => {
  if (!val) return null;
  if (typeof val === 'object') {
    if (val.url) return buildAssetUrl(val.url);
    if (val.path) return buildAssetUrl(val.path);
    if (val.full_url) return buildAssetUrl(val.full_url);
    return null;
  }
  if (typeof val === 'string') {
    return buildAssetUrl(val);
  }
  return null;
};

const normalizeImageArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(normalizeImageValue).filter(Boolean);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(normalizeImageValue).filter(Boolean);
      return [normalizeImageValue(parsed)].filter(Boolean);
    } catch (e) {
      // fall back to comma-separated string
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(normalizeImageValue)
        .filter(Boolean);
    }
  }
  return [normalizeImageValue(val)].filter(Boolean);
};

export const getProductImage = (product) => {
  if (!product) return null;
  
  // Fallback to building URL from path
  if (product.thumbnail_image) {
    return buildAssetUrl(product.thumbnail_image);
  }
  
  // Try other image fields
  if (product.thumbnail) {
    return buildAssetUrl(product.thumbnail);
  }
  
  if (product.image) {
    return buildAssetUrl(product.image);
  }
  
  // Try feature images
  const featureImages = normalizeImageArray(product.feature_images);
  if (featureImages.length > 0) return featureImages[0];
  
  return null;
};

// Get all feature images from a product
export const getAllProductImages = (product) => {
  if (!product) return [];

  const images = [];
  
  // Build URLs from paths
  normalizeImageArray(product.feature_images).forEach((url) => {
    if (url && !images.includes(url)) images.push(url);
  });
  
  // Add thumbnail as first image
  const thumbnail = getProductImage(product);
  if (thumbnail && !images.includes(thumbnail)) {
    images.unshift(thumbnail);
  }
  
  return images.length > 0 ? images : [];
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₱0.00';
  return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

