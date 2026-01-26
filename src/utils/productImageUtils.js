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
  // OLD WORKING METHOD: Use /storage/ directly (like asset() helper does)
  const cleaned = rawPath.replace(/^\/+/, '');
  if (cleaned.startsWith('storage/')) {
    return `${fileBaseUrl}/${cleaned}`;
  }
  // If path doesn't start with storage/, prepend it
  return `${fileBaseUrl}/storage/${cleaned}`;
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
  
  // OLD WORKING METHOD: Use thumbnail_image_url from API (uses asset('storage/...'))
  if (product.thumbnail_image_url) {
    return product.thumbnail_image_url;
  }
  
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
  
  // OLD WORKING METHOD: Use feature_images_urls from API (uses asset('storage/...'))
  if (product.feature_images_urls && Array.isArray(product.feature_images_urls) && product.feature_images_urls.length > 0) {
    product.feature_images_urls.forEach((url) => {
      if (url && !images.includes(url)) images.push(url);
    });
  }
  
  // Fallback to building URLs from paths
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

