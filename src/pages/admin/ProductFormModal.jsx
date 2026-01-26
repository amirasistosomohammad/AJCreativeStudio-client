import React, { useState, useEffect, useRef } from 'react';
import Portal from '../../components/Portal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { showAlert } from '../../services/notificationService';
import RichTextEditor from '../../components/RichTextEditor';
import { buildAssetUrl as buildApiAssetUrl } from '../../utils/productImageUtils';

const ProductFormModal = ({ product, onClose, onSave, token }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    price: '',
    old_price: '',
    on_sale: false,
    category: '',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [swalShown, setSwalShown] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [featureImages, setFeatureImages] = useState([]);
  const [featureImagePreviews, setFeatureImagePreviews] = useState([]);
  const [removedFeatureImageIndices, setRemovedFeatureImageIndices] = useState([]); // Track removed existing feature images
  const [originalFeatureImageCount, setOriginalFeatureImageCount] = useState(0); // Track original count for index mapping
  const thumbnailInputRef = useRef(null);
  const featureImagesInputRef = useRef(null);
  
  const isEdit = !!product;
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const initialFormState = useRef({});
  const fileInputRef = useRef(null);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const buildAssetUrl = (rawPath) => buildApiAssetUrl(rawPath);

  const normalizeFeatureImages = (raw) => {
    if (!raw) return [];
    let arr = [];
    if (Array.isArray(raw)) {
      arr = raw;
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) arr = parsed;
      } catch (e) {
        arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return arr
      .map((img) => {
        if (img && typeof img === 'object' && img.path) return buildAssetUrl(img.path) || img.path;
        return buildAssetUrl(img) || img;
      })
      .filter(Boolean);
  };

  // Fetch categories from API when modal opens
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) {
        console.warn('No token available for fetching categories');
        setCategoriesLoading(false);
        return;
      }

      setCategoriesLoading(true);
      try {
        // Use the exact same endpoint pattern as ProductCategories (which works)
        const url = `${apiBaseUrl}/product-categories?per_page=1000`;
        console.log('Fetching categories from:', url);
        console.log('Token available:', !!token);
        console.log('apiBaseUrl:', apiBaseUrl);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        console.log('Categories response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch categories. Status:', response.status);
          console.error('Error response:', errorText);
          setCategories([]);
          setCategoriesLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Categories API response:', data);
        
        // Use the same structure as ProductCategories expects
        if (data.success && data.categories && Array.isArray(data.categories)) {
          // Extract category names from the categories array (same as ProductCategories)
          const categoryNames = data.categories.map(cat => {
            // Categories from index endpoint have a 'name' property
            return cat.name || null;
          }).filter(Boolean);
          
          console.log('Category names extracted:', categoryNames);
          console.log('Setting categories state with', categoryNames.length, 'categories');
          
          if (categoryNames.length > 0) {
            setCategories(categoryNames);
            console.log('Categories state updated successfully');
          } else {
            console.warn('No category names extracted from response');
            setCategories([]);
          }
        } else {
          console.warn('Invalid categories data structure:', data);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        console.error('Error details:', error.message, error.stack);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Only fetch if we have a token
    if (token) {
      fetchCategories();
    } else {
      setCategoriesLoading(false);
    }
  }, [token, apiBaseUrl]);

  useEffect(() => {
    if (product) {
      const productFormState = {
        title: product.title || '',
        subtitle: product.subtitle || '',
        price: product.price || '',
        old_price: product.old_price || '',
        on_sale: product.on_sale || false,
        category: product.category || '',
        description: product.description || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
      };
      setFormData(productFormState);
      initialFormState.current = { ...productFormState };
      
      // Set file preview if product has a file
      if (product.file_name) {
        setFilePreview({
          name: product.file_name,
          size: product.file_size,
          path: product.file_path,
        });
      } else {
        setFilePreview(null);
      }
      setSelectedFile(null);
      setRemoveFile(false);
      
      // Set thumbnail preview if product has thumbnail
      if (product.thumbnail_image) {
        setThumbnailPreview({
          path: buildAssetUrl(product.thumbnail_image) || product.thumbnail_image,
        });
      } else {
        setThumbnailPreview(null);
      }
      setThumbnailImage(null);
      setRemoveThumbnail(false);
      
      // Set feature images preview if product has feature images
      // First, get the raw feature_images from the product (before normalization)
      let rawFeatureImages = [];
      if (product.feature_images) {
        if (Array.isArray(product.feature_images)) {
          rawFeatureImages = product.feature_images;
        } else if (typeof product.feature_images === 'string') {
          try {
            rawFeatureImages = JSON.parse(product.feature_images);
            if (!Array.isArray(rawFeatureImages)) {
              rawFeatureImages = [];
            }
          } catch (e) {
            console.error('Error parsing feature_images:', e);
            rawFeatureImages = [];
          }
        }
      }
      
      // Now normalize for display
      const normalizedFeatures = normalizeFeatureImages(product.feature_images);
      setOriginalFeatureImageCount(rawFeatureImages.length);
      
      console.log('Loading product feature images:');
      console.log('  Raw feature_images:', rawFeatureImages);
      console.log('  Normalized features:', normalizedFeatures);
      
      if (normalizedFeatures.length > 0) {
        // Map each normalized feature to its original index in the raw array
        // We need to match by comparing the image paths
        setFeatureImagePreviews(normalizedFeatures.map((normalizedImg, normalizedIdx) => {
          // Try to find the original index by matching paths
          let originalIdx = normalizedIdx;
          for (let i = 0; i < rawFeatureImages.length; i++) {
            const rawImg = rawFeatureImages[i];
            const rawPath = typeof rawImg === 'string' ? rawImg : (rawImg?.path || rawImg?.url || '');
            // Check if paths match (accounting for URL building)
            if (rawPath && normalizedImg) {
              const rawFileName = rawPath.split('/').pop();
              const normalizedFileName = normalizedImg.split('/').pop();
              if (rawFileName === normalizedFileName || normalizedImg.includes(rawPath) || rawPath.includes(normalizedImg.split('/').pop())) {
                originalIdx = i;
                break;
              }
            }
          }
          return { path: normalizedImg, originalIndex: originalIdx };
        }));
      } else {
        setFeatureImagePreviews([]);
      }
      setFeatureImages([]);
      setRemovedFeatureImageIndices([]); // Reset removed indices when opening product
    } else {
      const defaultState = {
        title: '',
        subtitle: '',
        price: '',
        old_price: '',
        on_sale: false,
        category: '',
        description: '',
        is_active: true,
      };
      setFormData(defaultState);
      initialFormState.current = { ...defaultState };
      setFilePreview(null);
      setSelectedFile(null);
      setRemoveFile(false);
      setThumbnailPreview(null);
      setThumbnailImage(null);
      setRemoveThumbnail(false);
      setFeatureImagePreviews([]);
      setFeatureImages([]);
    }
  }, [product]);

  // Check if form has unsaved changes
  const checkFormChanges = (currentForm) => {
    const formChanged = JSON.stringify(currentForm) !== JSON.stringify(initialFormState.current);
    const fileChanged = selectedFile !== null || (filePreview && !product?.file_path);
    const thumbnailChanged = thumbnailImage !== null || removeThumbnail;
    const featureImagesChanged = featureImages.length > 0;
    return formChanged || fileChanged || thumbnailChanged || featureImagesChanged;
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    // Handle file input
    if (type === 'file' && files && files.length > 0) {
      const file = files[0];
      
      // STRICT validation - Excel and PDF files allowed
      const allowedExtensions = ['.xlsx', '.xls', '.pdf'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      // First check: File extension MUST be .xlsx, .xls, or .pdf
      if (!allowedExtensions.includes(fileExtension)) {
        setErrors(prev => ({ ...prev, file: 'Only Excel files (.xlsx or .xls) or PDF files (.pdf) are allowed. Please select a valid file.' }));
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      
      // Second check: MIME type validation (if provided by browser)
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/excel', // Alternative MIME for .xls
        'application/x-excel', // Alternative MIME for .xls
        'application/pdf', // .pdf
      ];
      
      // If MIME type is provided and doesn't match, reject (unless it's empty string which some browsers use)
      if (file.type && file.type !== '' && !allowedMimeTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: 'Invalid file type. Only Excel files (.xlsx or .xls) or PDF files (.pdf) are allowed.' }));
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      
      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 20MB' }));
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      
      // File is valid - clear any previous errors and set the file
      setErrors(prev => ({ ...prev, file: '' }));
      setSelectedFile(file);
      setFilePreview({
        name: file.name,
        size: file.size,
      });
      setHasUnsavedChanges(true);
      return;
    }
    
    const newForm = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    };
    setFormData(newForm);
    setHasUnsavedChanges(checkFormChanges(newForm));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    // If editing and file exists, mark for removal
    if (product?.file_path && filePreview?.path) {
      setRemoveFile(true);
      setFilePreview(null);
    } else {
      setFilePreview(null);
      setRemoveFile(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setHasUnsavedChanges(true);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, thumbnail: 'Only image files (JPEG, PNG, WebP, GIF) are allowed' }));
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, thumbnail: 'Thumbnail image must be less than 5MB' }));
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview({ url: reader.result, name: file.name, size: file.size });
    };
    reader.readAsDataURL(file);

    setThumbnailImage(file);
    setRemoveThumbnail(false);
    setErrors(prev => ({ ...prev, thumbnail: '' }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveThumbnail = () => {
    setThumbnailImage(null);
    if (product?.thumbnail_image && thumbnailPreview?.path) {
      setRemoveThumbnail(true);
      setThumbnailPreview(null);
    } else {
      setThumbnailPreview(null);
      setRemoveThumbnail(false);
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
    setHasUnsavedChanges(true);
  };

  const handleFeatureImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate image files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setErrors(prev => ({ ...prev, feature_images: 'Only image files (JPEG, PNG, WebP, GIF) are allowed' }));
      if (featureImagesInputRef.current) {
        featureImagesInputRef.current.value = '';
      }
      return;
    }

    // Validate file sizes (5MB max per image)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors(prev => ({ ...prev, feature_images: 'Each feature image must be less than 5MB' }));
      if (featureImagesInputRef.current) {
        featureImagesInputRef.current.value = '';
      }
      return;
    }

    // Limit to 10 images max
    const totalImages = featureImages.length + featureImagePreviews.length + files.length;
    if (totalImages > 10) {
      setErrors(prev => ({ ...prev, feature_images: 'Maximum 10 feature images allowed' }));
      if (featureImagesInputRef.current) {
        featureImagesInputRef.current.value = '';
      }
      return;
    }

    // Create previews for all files
    const previewPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result, name: file.name, size: file.size });
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all previews to be created, then update state
    Promise.all(previewPromises).then((newPreviews) => {
      setFeatureImagePreviews(prev => [...prev, ...newPreviews]);
    });

    setFeatureImages(prev => [...prev, ...files]);
    setErrors(prev => ({ ...prev, feature_images: '' }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveFeatureImage = (index, isPreview) => {
    if (isPreview) {
      // Remove from previews (existing images)
      // Track the original index of the removed image for backend
      const preview = featureImagePreviews[index];
      console.log('Removing feature image at preview index:', index);
      console.log('Preview data:', preview);
      if (preview && preview.originalIndex !== undefined) {
        console.log('Tracking removal of original index:', preview.originalIndex);
        setRemovedFeatureImageIndices(prev => {
          // Avoid duplicates
          if (prev.includes(preview.originalIndex)) {
            console.log('Index already in removal list, skipping');
            return prev;
          }
          const updated = [...prev, preview.originalIndex];
          console.log('Updated removal indices:', updated);
          return updated;
        });
      } else {
        console.warn('Preview does not have originalIndex, cannot track removal');
      }
      const newPreviews = featureImagePreviews.filter((_, i) => i !== index);
      // Keep original indices for remaining previews (don't re-index)
      setFeatureImagePreviews(newPreviews);
    } else {
      // Remove from new uploads
      const newImages = featureImages.filter((_, i) => i !== index);
      setFeatureImages(newImages);
      // Also remove corresponding preview (new uploads don't have path)
      const previewIndex = featureImagePreviews.findIndex(p => !p.path);
      if (previewIndex !== -1) {
        const newPreviews = featureImagePreviews.filter((_, i) => i !== previewIndex);
        setFeatureImagePreviews(newPreviews);
      }
    }
    setHasUnsavedChanges(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required';
    }
    
    // Check subtitle - strip HTML tags for validation
    const subtitleText = formData.subtitle ? formData.subtitle.replace(/<[^>]*>/g, '').trim() : '';
    if (!subtitleText) {
      newErrors.subtitle = 'Subtitle is required';
    }
    
    // Check description - strip HTML tags for validation
    const descriptionText = formData.description ? formData.description.replace(/<[^>]*>/g, '').trim() : '';
    if (!descriptionText) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    // Validate old_price when on_sale is checked
    if (formData.on_sale) {
      if (!formData.old_price || parseFloat(formData.old_price) <= 0) {
        newErrors.old_price = 'Old price is required when product is on sale';
      } else if (parseFloat(formData.old_price) <= parseFloat(formData.price)) {
        newErrors.old_price = 'Old price must be greater than current price';
      }
    } else if (formData.old_price && parseFloat(formData.old_price) > 0 && parseFloat(formData.old_price) <= parseFloat(formData.price)) {
      // If not on sale but old_price is provided, still validate it's greater
      newErrors.old_price = 'Old price must be greater than current price';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    // Validate thumbnail - REQUIRED
    if (!isEdit && !thumbnailImage && !thumbnailPreview) {
      newErrors.thumbnail = 'Thumbnail image is required';
    } else if (isEdit) {
      // When editing: must have either existing thumbnail OR new thumbnail
      // If removing thumbnail, must provide a new one
      const hasExistingThumbnail = product?.thumbnail_image && !removeThumbnail;
      const hasNewThumbnail = !!thumbnailImage;
      const hasThumbnailPreview = !!thumbnailPreview && !removeThumbnail;
      
      if (removeThumbnail && !hasNewThumbnail) {
        newErrors.thumbnail = 'You must upload a new thumbnail image if you remove the existing one';
      } else if (!hasExistingThumbnail && !hasNewThumbnail && !hasThumbnailPreview) {
        newErrors.thumbnail = 'Thumbnail image is required';
      }
    }
    
    // Validate file - REQUIRED for digital products
    if (!isEdit && !selectedFile) {
      // New product must have a file
      newErrors.file = 'Product file is required. Please upload an Excel or PDF file.';
    } else if (isEdit) {
      // When editing: must have either existing file OR new file
      // If removing file, must provide a new one
      const hasExistingFile = product?.file_path && !removeFile;
      const hasNewFile = !!selectedFile;
      const hasFilePreview = !!filePreview && !removeFile;
      
      if (removeFile && !hasNewFile) {
        newErrors.file = 'You must upload a new product file if you remove the existing one';
      } else if (!hasExistingFile && !hasNewFile && !hasFilePreview) {
        newErrors.file = 'Product file is required. Please upload an Excel or PDF file.';
      } else if (selectedFile) {
        // Validate file type and size if a file is selected
        const allowedExtensions = ['.xlsx', '.xls', '.pdf'];
        const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
          newErrors.file = 'Only Excel files (.xlsx or .xls) or PDF files (.pdf) are allowed. Please select a valid file.';
        } else if (selectedFile.size > 20 * 1024 * 1024) {
          newErrors.file = 'File size must be less than 20MB';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form and show errors if validation fails
    const validationErrors = {};
    let isValid = true;
    
    // Run validation manually to get errors
    if (!formData.title.trim()) {
      validationErrors.title = 'Product title is required';
      isValid = false;
    }
    
    const subtitleText = formData.subtitle ? formData.subtitle.replace(/<[^>]*>/g, '').trim() : '';
    if (!subtitleText) {
      validationErrors.subtitle = 'Subtitle is required';
      isValid = false;
    }
    
    const descriptionText = formData.description ? formData.description.replace(/<[^>]*>/g, '').trim() : '';
    if (!descriptionText) {
      validationErrors.description = 'Description is required';
      isValid = false;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      validationErrors.price = 'Valid price is required';
      isValid = false;
    }
    
    // Validate old_price when on_sale is checked
    if (formData.on_sale) {
      if (!formData.old_price || parseFloat(formData.old_price) <= 0) {
        validationErrors.old_price = 'Old price is required when product is on sale';
        isValid = false;
      } else if (parseFloat(formData.old_price) <= parseFloat(formData.price)) {
        validationErrors.old_price = 'Old price must be greater than current price';
        isValid = false;
      }
    } else if (formData.old_price && parseFloat(formData.old_price) > 0 && parseFloat(formData.old_price) <= parseFloat(formData.price)) {
      // If not on sale but old_price is provided, still validate it's greater
      validationErrors.old_price = 'Old price must be greater than current price';
      isValid = false;
    }
    
    if (!formData.category) {
      validationErrors.category = 'Category is required';
      isValid = false;
    }
    
    // Validate thumbnail - REQUIRED
    if (!isEdit && !thumbnailImage && !thumbnailPreview) {
      validationErrors.thumbnail = 'Thumbnail image is required';
      isValid = false;
    } else if (isEdit) {
      // When editing: must have either existing thumbnail OR new thumbnail
      // If removing thumbnail, must provide a new one
      const hasExistingThumbnail = product?.thumbnail_image && !removeThumbnail;
      const hasNewThumbnail = !!thumbnailImage;
      const hasThumbnailPreview = !!thumbnailPreview && !removeThumbnail;
      
      if (removeThumbnail && !hasNewThumbnail) {
        validationErrors.thumbnail = 'You must upload a new thumbnail image if you remove the existing one';
        isValid = false;
      } else if (!hasExistingThumbnail && !hasNewThumbnail && !hasThumbnailPreview) {
        validationErrors.thumbnail = 'Thumbnail image is required';
        isValid = false;
      }
    }
    
    // Validate file - REQUIRED for digital products
    if (!isEdit && !selectedFile) {
      validationErrors.file = 'Product file is required. Please upload an Excel or PDF file.';
      isValid = false;
    } else if (isEdit) {
      // When editing: must have either existing file OR new file
      // If removing file, must provide a new one
      const hasExistingFile = product?.file_path && !removeFile;
      const hasNewFile = !!selectedFile;
      const hasFilePreview = !!filePreview && !removeFile;
      
      if (removeFile && !hasNewFile) {
        validationErrors.file = 'You must upload a new product file if you remove the existing one';
        isValid = false;
      } else if (!hasExistingFile && !hasNewFile && !hasFilePreview) {
        validationErrors.file = 'Product file is required. Please upload an Excel or PDF file.';
        isValid = false;
      } else if (selectedFile) {
        const allowedExtensions = ['.xlsx', '.xls', '.pdf'];
        const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
          validationErrors.file = 'Only Excel files (.xlsx or .xls) or PDF files (.pdf) are allowed. Please select a valid file.';
          isValid = false;
        } else if (selectedFile.size > 20 * 1024 * 1024) {
          validationErrors.file = 'File size must be less than 20MB';
          isValid = false;
        }
      }
    }
    
    // Set errors and show feedback
    setErrors(validationErrors);
    
    if (!isValid) {
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        setTimeout(() => {
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
                             document.querySelector(`.is-invalid`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (errorElement.focus) {
              errorElement.focus();
            }
          }
        }, 100);
      }
      
      // Show error message using showAlert to ensure it appears above modal
      const errorMessages = Object.values(validationErrors).filter(msg => msg).join(', ');
      console.log('Validation errors:', validationErrors, 'Error messages:', errorMessages);
      
      if (errorMessages) {
        showAlert.error(
          'Validation Error',
          `Please fix the following errors:\n\n${Object.entries(validationErrors)
            .filter(([_, msg]) => msg)
            .map(([field, msg]) => `• ${field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}: ${msg}`)
            .join('\n')}`
        );
      } else {
        // Fallback - show toast with field names
        const errorFields = Object.keys(validationErrors).join(', ');
        console.warn('Validation failed but no error messages. Fields with errors:', errorFields);
        toast.error(`Please fix the errors in: ${errorFields || 'the form'}`);
      }
      return;
    }

    const confirmation = await showAlert.confirm(
      isEdit ? 'Confirm Product Update' : 'Confirm Create Product',
      `Are you sure you want to ${isEdit ? 'update' : 'create'} this product?`,
      `Yes, ${isEdit ? 'Update' : 'Create'} Product`,
      'Review Details'
    );

    if (!confirmation.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      showAlert.loading(
        isEdit ? 'Updating Product' : 'Creating Product',
        'Please wait while we save the product information...'
      );

      // For file uploads with PUT, Laravel may require POST with _method=PUT
      // But let's try PUT first and see if it works
      // Always use FormData when images or files are involved
      // Use FormData if: new product, file selected/removed, thumbnail selected/removed, feature images selected, or feature images removed
      const hasImagesOrFiles = !isEdit || selectedFile || removeFile || thumbnailImage || removeThumbnail || featureImages.length > 0 || removedFeatureImageIndices.length > 0;
      
      const url = isEdit
        ? `${apiBaseUrl}/products/${product.id}`
        : `${apiBaseUrl}/products`;
      
      // Use POST with _method=PUT for file uploads if we have images/files
      // This is more reliable for Laravel file handling
      const usePostMethod = hasImagesOrFiles && isEdit;
      const method = usePostMethod ? 'POST' : (isEdit ? 'PUT' : 'POST');
      
      // Debug: Log what we're sending
      console.log('=== PRODUCT UPDATE DEBUG ===');
      console.log('isEdit:', isEdit);
      console.log('selectedFile:', !!selectedFile);
      console.log('removeFile:', removeFile);
      console.log('thumbnailImage:', !!thumbnailImage);
      console.log('removeThumbnail:', removeThumbnail);
      console.log('featureImages.length:', featureImages.length);
      console.log('removedFeatureImageIndices:', removedFeatureImageIndices);
      console.log('hasImagesOrFiles:', hasImagesOrFiles);
      
      let requestBody;
      let headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      if (hasImagesOrFiles) {
        // Use FormData for file/image upload or removal
        const formDataToSend = new FormData();
        
        // If using POST for PUT update, add _method field for Laravel
        if (usePostMethod) {
          formDataToSend.append('_method', 'PUT');
          console.log('Using POST with _method=PUT for file upload');
        }
        
        // Debug: Log formData values before sending
        console.log('FormData values before sending:', {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          category: formData.category,
        });
        
        formDataToSend.append('title', formData.title || '');
        
        // Ensure subtitle and description are sent with actual content
        // RichTextEditor returns HTML, so we need to check if it has actual content
        const subtitleValue = formData.subtitle || '';
        const descriptionValue = formData.description || '';
        
        // Strip HTML tags to check if there's actual text content
        const subtitleText = subtitleValue.replace(/<[^>]*>/g, '').trim();
        const descriptionText = descriptionValue.replace(/<[^>]*>/g, '').trim();
        
        if (!subtitleText) {
          console.error('Subtitle is empty after stripping HTML');
        }
        if (!descriptionText) {
          console.error('Description is empty after stripping HTML');
        }
        
        // Always append subtitle and description, even if empty (backend will validate content)
        formDataToSend.append('subtitle', subtitleValue || '');
        formDataToSend.append('price', parseFloat(formData.price));
        formDataToSend.append('old_price', formData.old_price ? parseFloat(formData.old_price) : '');
        formDataToSend.append('on_sale', formData.on_sale ? '1' : '0');
        formDataToSend.append('category', formData.category || '');
        formDataToSend.append('description', descriptionValue || '');
        formDataToSend.append('is_active', formData.is_active ? '1' : '0');
        
        // Debug: Verify FormData contents
        console.log('FormData entries:', {
          hasSubtitle: formDataToSend.has('subtitle'),
          hasDescription: formDataToSend.has('description'),
          subtitleValue: subtitleValue ? subtitleValue.substring(0, 50) + '...' : 'EMPTY',
          descriptionValue: descriptionValue ? descriptionValue.substring(0, 50) + '...' : 'EMPTY',
        });
        
        // Handle Excel or PDF file
        if (selectedFile) {
          // Final validation before upload - double check file extension
          const allowedExtensions = ['.xlsx', '.xls', '.pdf'];
          const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
          
          if (!allowedExtensions.includes(fileExtension)) {
            showAlert.close();
            showAlert.error(
              'Invalid File Type',
              'Only Excel files (.xlsx or .xls) or PDF files (.pdf) are allowed. Please select a valid file.'
            );
            setLoading(false);
            return;
          }
          
          formDataToSend.append('file', selectedFile);
        }
        
        if (removeFile) {
          formDataToSend.append('remove_file', '1');
        }
        
        // Handle thumbnail image
        if (thumbnailImage) {
          console.log('Appending thumbnail_image:', thumbnailImage.name, thumbnailImage.size);
          formDataToSend.append('thumbnail_image', thumbnailImage);
        }
        
        if (removeThumbnail) {
          console.log('Appending remove_thumbnail flag');
          formDataToSend.append('remove_thumbnail', '1');
        }
        
        // Handle feature images
        console.log('Appending feature images:', featureImages.length);
        featureImages.forEach((image, index) => {
          console.log(`  feature_images[${index}]:`, image.name, image.size);
          formDataToSend.append(`feature_images[${index}]`, image);
        });
        
        // Send removed feature image indices to backend
        // Laravel expects remove_feature_images as an array, so we need to send it correctly
        if (removedFeatureImageIndices.length > 0) {
          console.log('Appending removed feature image indices:', removedFeatureImageIndices);
          // Sort indices to ensure correct order
          const sortedIndices = [...removedFeatureImageIndices].sort((a, b) => a - b);
          sortedIndices.forEach((index, idx) => {
            // Send as sequential indexed array: remove_feature_images[0], remove_feature_images[1], etc.
            // The value is the actual index in the product's feature_images array
            formDataToSend.append(`remove_feature_images[${idx}]`, index.toString());
          });
          console.log('Sent remove_feature_images array:', sortedIndices);
        }
        
        // Debug: Log all FormData entries
        console.log('FormData entries:');
        for (let pair of formDataToSend.entries()) {
          if (pair[1] instanceof File) {
            console.log(`  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
          } else {
            console.log(`  ${pair[0]}: ${pair[1]}`);
          }
        }
        
        requestBody = formDataToSend;
        // Don't set Content-Type header - browser will set it with boundary for FormData
      } else {
        // Use JSON for regular updates without files/images
        // Always include subtitle and description fields, even if empty
        const submitData = {
          ...formData,
          price: parseFloat(formData.price),
          old_price: formData.old_price ? parseFloat(formData.old_price) : null,
          subtitle: formData.subtitle || '', // Always send as string, never null
          description: formData.description || '', // Always send as string, never null
        };
        
        // Debug: Log JSON payload
        console.log('JSON payload before sending:', {
          title: submitData.title,
          subtitle: submitData.subtitle ? submitData.subtitle.substring(0, 50) + '...' : 'EMPTY',
          description: submitData.description ? submitData.description.substring(0, 50) + '...' : 'EMPTY',
          category: submitData.category,
        });
        
        requestBody = JSON.stringify(submitData);
        headers['Content-Type'] = 'application/json';
      }

      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Using FormData:', hasImagesOrFiles);
      
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      showAlert.close();

      if (response.ok) {
        // Debug: Log the response to see what the backend returned
        console.log('=== PRODUCT UPDATE SUCCESS ===');
        console.log('Full response:', data);
        if (data.product) {
          console.log('Updated product ID:', data.product.id);
          console.log('Updated product thumbnail:', data.product.thumbnail_image);
          console.log('Updated product feature_images:', data.product.feature_images);
          console.log('Updated product feature_images type:', typeof data.product.feature_images);
          console.log('Updated product feature_images is array:', Array.isArray(data.product.feature_images));
          console.log('Added by user ID:', data.product.added_by_user_id);
          console.log('Added by user type:', data.product.added_by_user_type);
          console.log('Added by name:', data.product.added_by_name);
          console.log('Added by admin:', data.product.added_by_admin);
          console.log('Added by personnel:', data.product.added_by_personnel);
        } else {
          console.warn('Response does not contain product data!');
        }
        toast.success(
          isEdit ? 'Product updated successfully!' : 'Product created successfully!'
        );
        setHasUnsavedChanges(false);
        onSave(data.product || data);
      } else {
        if (data.message === 'Unauthenticated.') {
          showAlert.error(
            'Session Expired',
            'Your session has expired. Please log in again.'
          );
          return;
        }

        if (data.errors) {
          // Laravel validation errors come as arrays, so we need to flatten them
          const flattenedErrors = {};
          Object.keys(data.errors).forEach(key => {
            // If the error is an array, take the first message
            // If it's already a string, use it directly
            const errorValue = Array.isArray(data.errors[key]) 
              ? data.errors[key][0] 
              : data.errors[key];
            
            // Map backend field names to frontend field names if needed
            // Laravel might use 'name' but frontend uses 'title' for products
            const frontendFieldName = key === 'name' ? 'title' : key;
            flattenedErrors[frontendFieldName] = errorValue;
          });
          
          setErrors(flattenedErrors);
          
          // Show toast with all errors or first error
          const errorMessages = Object.entries(flattenedErrors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ');
          
          if (errorMessages) {
            toast.error(errorMessages);
          } else {
            toast.error('Please fix the errors in the form');
          }
          
          // Don't throw error - just return so user can see the errors
          return;
        }
        throw new Error(
          data.message || `Failed to ${isEdit ? 'update' : 'create'} product`
        );
      }
    } catch (error) {
      showAlert.close();
      console.error('Error saving product:', error);
      showAlert.error(
        'Error',
        error.message || `Failed to ${isEdit ? 'update' : 'create'} product`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget && !loading) {
      await handleCloseAttempt();
    }
  };

  const handleEscapeKey = async (e) => {
    if (e.key === 'Escape' && !loading) {
      e.preventDefault();
      await handleCloseAttempt();
    }
  };

  const handleCloseAttempt = async () => {
    if (hasUnsavedChanges) {
      setSwalShown(true);
      const result = await showAlert.confirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close without saving?',
        'Yes, Close',
        'Continue Editing'
      );
      setSwalShown(false);

      if (result.isConfirmed) {
        await closeModal();
      }
    } else {
      await closeModal();
    }
  };

  const handleCloseButtonClick = async () => {
    await handleCloseAttempt();
  };

  const closeModal = async () => {
    setIsClosing(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [loading, hasUnsavedChanges]);

  return (
    <Portal>
      <div
        ref={modalRef}
        className={`modal fade show d-block modal-backdrop-animation ${isClosing ? 'exit' : ''}`}
        style={{ 
          backgroundColor: swalShown ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
          transition: 'background-color 0.2s ease',
          zIndex: 9999, // Very high - above topbar (1039) but below SweetAlert (100000) and Toastify (100002)
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
        onClick={handleBackdropClick}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 10000 }}>
          <div
            ref={contentRef}
            className={`modal-content border-0 modal-content-animation ${isClosing ? 'exit' : ''}`}
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 10000,
            }}
          >
            {/* Header */}
            <div
              className="modal-header border-0 text-white modal-smooth"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <h5 className="modal-title fw-bold">
                <i className={`fas ${isEdit ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white btn-smooth"
                onClick={handleCloseButtonClick}
                aria-label="Close"
                disabled={loading}
                style={{
                  transition: 'all 0.2s ease',
                }}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Modal Body */}
              <div
                className="modal-body modal-smooth"
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {/* Basic Information Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-info-circle me-2"></i>Basic Information
                  </h6>
                  <div className="row g-3">
                    {/* Title */}
                    <div className="col-md-8">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Product Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control modal-smooth ${
                          errors.title ? 'is-invalid' : ''
                        }`}
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="e.g., Accounts Receivables Tracker"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.title && (
                        <div className="invalid-feedback">{errors.title}</div>
                      )}
                      <small className="text-muted">This will be displayed on product cards and detail pages</small>
                    </div>

                    {/* Category */}
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select modal-smooth ${
                          errors.category ? 'is-invalid' : ''
                        }`}
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        disabled={loading || categoriesLoading}
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <option value="">
                          {categoriesLoading ? 'Loading categories...' : categories.length === 0 ? 'No categories available' : 'Select Category'}
                        </option>
                        {categories.length > 0 && categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {categoriesLoading && (
                        <small className="text-muted d-block mt-1">
                          <i className="fas fa-spinner fa-spin me-1"></i>
                          Loading categories...
                        </small>
                      )}
                      {!categoriesLoading && categories.length === 0 && (
                        <small className="text-warning d-block mt-1">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          No categories found. Please add categories first.
                        </small>
                      )}
                      {errors.category && (
                        <div className="invalid-feedback">{errors.category}</div>
                      )}
                    </div>

                    {/* Subtitle */}
                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Subtitle <span className="text-danger">*</span>
                      </label>
                      <RichTextEditor
                        value={formData.subtitle || ''}
                        onChange={(value) => {
                          const nextValue = value && value.target ? value.target.value : (value || '');
                          const newForm = {
                            ...formData,
                            subtitle: nextValue,
                          };
                          setFormData(newForm);
                          setHasUnsavedChanges(checkFormChanges(newForm));
                          // Clear error when user starts typing
                          if (errors.subtitle) {
                            setErrors(prev => ({ ...prev, subtitle: '' }));
                          }
                        }}
                        placeholder="e.g., Track invoices and payments efficiently

★ Track ALL your transactions
💰 Auto-calculate profits
📄 Save sales history per product"
                        height={200}
                        disabled={loading}
                        className={errors.subtitle ? 'is-invalid' : ''}
                      />
                      {errors.subtitle && (
                        <div className="invalid-feedback d-block">{errors.subtitle}</div>
                      )}
                      <small className="text-muted">Short tagline displayed below the title on product cards. Use the toolbar to format your text (bold, italic, colors, lists, etc.).</small>
                    </div>

                    {/* Description */}
                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Description <span className="text-danger">*</span> <small className="text-muted">(Used on product detail page)</small>
                      </label>
                      <RichTextEditor
                        value={formData.description || ''}
                        onChange={(value) => {
                          const nextValue = value && value.target ? value.target.value : (value || '');
                          const newForm = {
                            ...formData,
                            description: nextValue,
                          };
                          setFormData(newForm);
                          setHasUnsavedChanges(checkFormChanges(newForm));
                          // Clear error when user starts typing
                          if (errors.description) {
                            setErrors(prev => ({ ...prev, description: '' }));
                          }
                        }}
                        placeholder="Enter detailed product description. This will be displayed on the product detail page. Use the toolbar to format your text with bold, italic, lists, colors, and more."
                        height={400}
                        disabled={loading}
                        className={errors.description ? 'is-invalid' : ''}
                      />
                      {errors.description && (
                        <div className="invalid-feedback d-block">{errors.description}</div>
                      )}
                      <small className="text-muted">Use the toolbar above to format your text like in Word documents.</small>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Image Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-image me-2"></i>Thumbnail Image
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Product Thumbnail <span className="text-danger">*</span> <small className="text-muted">(Displayed on product cards)</small>
                      </label>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        className={`form-control modal-smooth ${errors.thumbnail ? 'is-invalid' : ''}`}
                        onChange={handleThumbnailChange}
                        disabled={loading}
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.thumbnail && (
                        <div className="invalid-feedback">{errors.thumbnail}</div>
                      )}
                      <small className="text-muted">Upload a thumbnail image for product cards. Recommended size: 400x400px. Maximum file size: 5MB.</small>
                      
                      {/* Thumbnail Preview */}
                      {(thumbnailPreview || thumbnailImage) && !removeThumbnail && (
                        <div className="mt-3 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                              {thumbnailPreview?.url ? (
                                <img
                                  src={thumbnailPreview.url}
                                  alt="Thumbnail preview"
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1px solid #dee2e6'
                                  }}
                                />
                              ) : thumbnailPreview?.path ? (
                                <img
                                  src={thumbnailPreview.path}
                                  alt="Thumbnail preview"
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1px solid #dee2e6'
                                  }}
                                />
                              ) : null}
                              <div>
                                <div className="fw-semibold">{thumbnailPreview?.name || 'Current thumbnail'}</div>
                                <small className="text-muted">
                                  {thumbnailPreview?.size ? formatFileSize(thumbnailPreview.size) : ''}
                                  {thumbnailPreview?.path && !thumbnailImage && (
                                    <span className="ms-2">
                                      <i className="fas fa-check-circle text-success"></i> Current image
                                    </span>
                                  )}
                                  {thumbnailImage && (
                                    <span className="ms-2">
                                      <i className="fas fa-upload text-primary"></i> New image
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={handleRemoveThumbnail}
                              disabled={loading}
                            >
                              <i className="fas fa-times me-1"></i>Remove
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Thumbnail Removed Notice */}
                      {removeThumbnail && !thumbnailImage && (
                        <div className="mt-3 p-3 border rounded border-warning" style={{ backgroundColor: '#fff3cd' }}>
                          <div className="d-flex align-items-center">
                            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                            <small className="text-muted">
                              Thumbnail will be removed when you save. Upload a new image to replace it.
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feature Images Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-images me-2"></i>Feature Images (Slider)
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Product Feature Images <small className="text-muted">(Displayed in product detail slider, max 10 images)</small>
                      </label>
                      <input
                        ref={featureImagesInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        multiple
                        className={`form-control modal-smooth ${errors.feature_images ? 'is-invalid' : ''}`}
                        onChange={handleFeatureImagesChange}
                        disabled={loading}
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.feature_images && (
                        <div className="invalid-feedback">{errors.feature_images}</div>
                      )}
                      <small className="text-muted">Upload multiple images for the product detail slider. Recommended size: 1200x800px. Maximum 10 images, 5MB per image.</small>
                      
                      {/* Feature Images Preview */}
                      {(featureImagePreviews.length > 0 || featureImages.length > 0) && (
                        <div className="mt-3">
                          <div className="row g-2">
                            {featureImagePreviews.map((preview, index) => (
                              <div key={index} className="col-md-3 col-sm-4 col-6">
                                <div className="position-relative border rounded p-2" style={{ backgroundColor: '#f8f9fa' }}>
                                  <img
                                    src={preview.url || preview.path}
                                    alt={`Feature ${index + 1}`}
                                    style={{
                                      width: '100%',
                                      height: '120px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger position-absolute"
                                    style={{
                                      top: '8px',
                                      right: '8px',
                                      padding: '2px 6px',
                                    }}
                                    onClick={() => handleRemoveFeatureImage(index, !!preview.path)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                  {preview.path && !featureImages[index] && (
                                    <small className="d-block mt-1 text-muted text-center">
                                      <i className="fas fa-check-circle text-success"></i> Current
                                    </small>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-file-excel me-2"></i>Product File (Excel or PDF)
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Upload Product File <span className="text-danger">*</span> <small className="text-muted">(.xlsx, .xls, or .pdf)</small>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className={`form-control modal-smooth ${errors.file ? 'is-invalid' : ''}`}
                        name="file"
                        accept=".xlsx,.xls,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
                        onChange={handleChange}
                        disabled={loading}
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.file && (
                        <div className="invalid-feedback">{errors.file}</div>
                      )}
                      <small className="text-muted">Excel files (.xlsx or .xls) or PDF files (.pdf) are accepted. Maximum file size: 20MB. This file will be available for download by customers.</small>
                      
                      {/* File Preview */}
                      {(filePreview || selectedFile) && !removeFile && (
                        <div className="mt-3 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <i className={`fas ${(filePreview?.name || selectedFile?.name)?.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-danger' : 'fa-file-excel text-success'} me-2`} style={{ fontSize: '1.5rem' }}></i>
                              <div>
                                <div className="fw-semibold">{filePreview?.name || selectedFile?.name}</div>
                                <small className="text-muted">
                                  {formatFileSize(filePreview?.size || selectedFile?.size)}
                                  {filePreview?.path && !selectedFile && (
                                    <span className="ms-2">
                                      <i className="fas fa-check-circle text-success"></i> Current file
                                    </span>
                                  )}
                                  {selectedFile && (
                                    <span className="ms-2">
                                      <i className="fas fa-upload text-primary"></i> New file
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={handleRemoveFile}
                              disabled={loading}
                            >
                              <i className="fas fa-times me-1"></i>Remove
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* File Removed Notice */}
                      {removeFile && !selectedFile && (
                        <div className="mt-3 p-3 border rounded border-warning" style={{ backgroundColor: '#fff3cd' }}>
                          <div className="d-flex align-items-center">
                            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                            <small className="text-muted">
                              File will be removed when you save. Upload a new file to replace it.
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-dollar-sign me-2"></i>Pricing
                  </h6>
                  <div className="row g-3">
                    {/* Price */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Price <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 modal-smooth">
                          ₱
                        </span>
                        <input
                          type="number"
                          className={`form-control border-start-0 ps-2 modal-smooth ${
                            errors.price ? 'is-invalid' : ''
                          }`}
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          disabled={loading}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          style={{ backgroundColor: '#ffffff' }}
                        />
                      </div>
                      {errors.price && (
                        <div className="invalid-feedback d-block">{errors.price}</div>
                      )}
                    </div>

                    {/* Old Price */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Old Price (for sale) {formData.on_sale && <span className="text-danger">*</span>}
                      </label>
                      <div className="input-group">
                        <span className={`input-group-text bg-white border-end-0 modal-smooth ${errors.old_price ? 'border-danger' : ''}`}>
                          ₱
                        </span>
                        <input
                          type="number"
                          className={`form-control border-start-0 ps-2 modal-smooth ${errors.old_price ? 'is-invalid' : ''}`}
                          name="old_price"
                          value={formData.old_price}
                          onChange={handleChange}
                          disabled={loading}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          style={{ backgroundColor: '#ffffff' }}
                        />
                      </div>
                      {errors.old_price && (
                        <div className="invalid-feedback d-block">{errors.old_price}</div>
                      )}
                      {formData.on_sale && !errors.old_price && (
                        <small className="text-muted">Required when product is on sale. Must be greater than current price.</small>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Information (Read-only) */}
                {isEdit && product && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                      <i className="fas fa-info-circle me-2"></i>Product Information
                    </h6>
                    <div className="row g-3">
                      {/* Added By */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Added By
                        </label>
                        <input
                          type="text"
                          className="form-control modal-smooth"
                          value={
                            product.added_by_name || 
                            (product.added_by && (product.added_by.name || product.added_by.username)) ||
                            product.added_by || 
                            product.created_by || 
                            'N/A'
                          }
                          disabled
                          readOnly
                          style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                        />
                      </div>

                      {/* Added Date/Time */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Added Date & Time
                        </label>
                        <input
                          type="text"
                          className="form-control modal-smooth"
                          value={product.created_at ? new Date(product.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : 'N/A'}
                          disabled
                          readOnly
                          style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status & Visibility Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-toggle-on me-2"></i>Status & Visibility
                  </h6>
                  <div className="row g-3">
                    {/* Checkboxes */}
                    <div className="col-md-12">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="on_sale"
                          id="on_sale"
                          checked={formData.on_sale}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="on_sale">
                          On Sale <small className="text-muted">(Shows sale badge and old price)</small>
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_active"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active <small className="text-muted">(Product will be visible on website)</small>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="modal-footer border-top bg-white modal-smooth">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-smooth"
                  onClick={handleCloseButtonClick}
                  disabled={loading}
                  style={{
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn fw-semibold position-relative btn-smooth"
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#6c757d' : 'var(--primary-color)',
                    borderColor: loading ? '#6c757d' : 'var(--primary-color)',
                    color: 'white',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: '140px',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'} me-2`}></i>
                      {isEdit ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProductFormModal;

