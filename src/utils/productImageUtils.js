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
  const cleaned = rawPath.replace(/^\/+/, '');
  // If backend returns an API path, respect it.
  if (cleaned.startsWith('api/')) {
    return `${fileBaseUrl}/${cleaned}`;
  }
  if (cleaned.startsWith('storage/')) {
    // Prefer API streaming (works on App Platform even when /storage symlink isn't served)
    return `${apiBaseUrl}/files/${cleaned.replace(/^storage\//, '')}`;
  } else if (cleaned.startsWith('public/')) {
    return `${apiBaseUrl}/files/${cleaned.replace(/^public\//, '')}`;
  }
  return `${apiBaseUrl}/files/${cleaned}`;
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
  
  // NEW METHOD: Use product ID endpoint like branding does
  if (product.id) {
    const apiBaseUrl = (() => {
      const rawApiBaseUrl =
        import.meta.env.VITE_LARAVEL_API ||
        import.meta.env.VITE_API_URL ||
        'http://localhost:8000';
      const trimmed = rawApiBaseUrl.replace(/\/+$/, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    })();
    
    return `${apiBaseUrl}/products/${product.id}/thumbnail?v=${Date.now()}`;
  }
  
  // Fallback to old method
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
  
  // NEW METHOD: Use product ID endpoint for feature images (fetches from DB)
  if (product.id) {
    const apiBaseUrl = (() => {
      const rawApiBaseUrl =
        import.meta.env.VITE_LARAVEL_API ||
        import.meta.env.VITE_API_URL ||
        'http://localhost:8000';
      const trimmed = rawApiBaseUrl.replace(/\/+$/, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    })();
    
    // Get feature images count from product
    const featureImages = normalizeImageArray(product.feature_images);
    if (featureImages.length > 0) {
      featureImages.forEach((_, index) => {
        images.push(`${apiBaseUrl}/products/${product.id}/feature/${index}?v=${Date.now()}`);
      });
    }
    
    // Add thumbnail as first image
    const thumbnail = getProductImage(product);
    if (thumbnail) {
      images.unshift(thumbnail);
    }
    
    return images.length > 0 ? images : [];
  }
  
  // Fallback to old method
  normalizeImageArray(product.feature_images).forEach((url) => {
    if (url && !images.includes(url)) images.push(url);
  });
  
  normalizeImageArray(product.feature_images_urls).forEach((url) => {
    if (url && !images.includes(url)) images.push(url);
  });
  
  if (images.length === 0) {
    const thumbnail = getProductImage(product);
    if (thumbnail) {
      images.push(thumbnail);
    }
  }
  
  return images;
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₱0.00';
  return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

