import React, { useState, useEffect, useRef, useCallback } from 'react';
import Portal from '../../components/Portal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { showAlert } from '../../services/notificationService';

const LandingPageSectionFormModal = ({ section, onClose, onSave, collections: propCollections = [], existingSections = [], defaultSectionType = 'product_grid' }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    section_type: defaultSectionType,
    source_type: 'collection',
    source_value: '',
    product_count: 4,
    display_style: 'grid',
    is_active: true,
    display_order: 1,
    description: '',
    config: {},
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [swalShown, setSwalShown] = useState(false);
  const [collections, setCollections] = useState(propCollections);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [autoplayDelayDisplay, setAutoplayDelayDisplay] = useState('');
  const [uploadingImages, setUploadingImages] = useState({}); // Track which slide is uploading
  const [imagePreviews, setImagePreviews] = useState({}); // Store image previews
  const [deletingSlides, setDeletingSlides] = useState({}); // Track which slides are being deleted
  
  const isEdit = !!section;
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const initialFormState = useRef({});
  const slideTitleRefs = useRef({}); // Refs for title inputs to auto-focus

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch collections when modal opens
  const fetchCollections = useCallback(async () => {
    try {
      setCollectionsLoading(true);
      const response = await fetch(`${apiBaseUrl}/product-collections?per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Collections API response:', data);
        if (data.success && data.collections) {
          console.log('Setting collections:', data.collections);
          setCollections(data.collections);
        } else {
          console.warn('Collections data structure unexpected:', data);
          // Try alternative response structure
          if (data.collections && Array.isArray(data.collections)) {
            console.log('Using alternative data structure');
            setCollections(data.collections);
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch collections:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setCollectionsLoading(false);
    }
  }, [token, apiBaseUrl]);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Update collections state when propCollections changes
  useEffect(() => {
    if (Array.isArray(propCollections) && propCollections.length > 0) {
      setCollections(propCollections);
    }
  }, [propCollections]);

  // Debug: Log collections state
  useEffect(() => {
    console.log('Collections state updated:', {
      collections,
      collectionsLength: collections?.length,
      collectionsLoading,
      isArray: Array.isArray(collections)
    });
  }, [collections, collectionsLoading]);

  useEffect(() => {
    // Ensure collections is an array
    const validCollections = Array.isArray(collections) ? collections : [];
    console.log('Collections in useEffect:', validCollections);
    
    // Helper to get slug or id as fallback
    const getCollectionIdentifier = (collection) => {
      return collection?.slug || collection?.id?.toString() || '';
    };
    
    if (section) {
      const sectionType = section.section_type || defaultSectionType;
      // Handle config - it might be a string (JSON) or already an object
      let defaultConfig = section.config || {};
      if (typeof defaultConfig === 'string') {
        try {
          defaultConfig = JSON.parse(defaultConfig);
        } catch (e) {
          console.error('Failed to parse config JSON:', e);
          defaultConfig = {};
        }
      }
      
      // Initialize hero config if needed
      if (sectionType === 'hero' && (!defaultConfig.slides || !Array.isArray(defaultConfig.slides))) {
        defaultConfig = {
          ...defaultConfig,
          slides: [],
          autoplay: defaultConfig.autoplay !== false,
          // autoplayDelay - no default, will be set on blur if empty
          showNavigation: defaultConfig.showNavigation !== false,
          showPagination: defaultConfig.showPagination !== false,
          backgroundColor: defaultConfig.backgroundColor || '#FFFFFF',
        };
      }
      
      // Initialize FAQ config if needed
      if (sectionType === 'faq') {
        if (!defaultConfig.faqs || !Array.isArray(defaultConfig.faqs)) {
          defaultConfig.faqs = [];
        }
        // Ensure each FAQ has is_active field
        defaultConfig.faqs = defaultConfig.faqs.map((faq, idx) => ({
          id: faq.id || `faq-${Date.now()}-${idx}`,
          question: faq.question || '',
          answer: faq.answer || '',
          is_active: faq.is_active !== undefined ? faq.is_active : true,
        }));
        defaultConfig.backgroundColor = defaultConfig.backgroundColor || '#F3F3F3';
        defaultConfig.layout = defaultConfig.layout || 'accordion';
        defaultConfig.allowMultipleOpen = defaultConfig.allowMultipleOpen || false;
      }
      
      const sectionFormState = {
        title: section.title || '',
        section_type: sectionType,
        source_type: section.source_type || 'collection',
        source_value: section.source_value || (validCollections.length > 0 ? getCollectionIdentifier(validCollections[0]) : ''),
        product_count: section.product_count || 4,
        display_style: section.display_style || 'grid',
        is_active: section.is_active !== undefined ? section.is_active : true,
        display_order: section.display_order || 1,
        description: section.description || '',
        config: defaultConfig,
        status: 'draft',
      };
      setFormData(sectionFormState);
      initialFormState.current = { ...sectionFormState };
      // Initialize autoplayDelay display - show existing value if it exists, otherwise empty (placeholder only)
      if (sectionFormState.config?.autoplayDelay) {
        setAutoplayDelayDisplay((sectionFormState.config.autoplayDelay / 1000).toString());
      } else {
        setAutoplayDelayDisplay('');
      }
      // Initialize image previews for existing slides
      if (sectionType === 'hero' && sectionFormState.config?.slides) {
        const previews = {};
        sectionFormState.config.slides.forEach((slide, idx) => {
          if (slide.image) {
            previews[`slide-${idx}`] = slide.image;
          }
        });
        setImagePreviews(previews);
      }
    } else {
      const sectionType = defaultSectionType;
      let defaultConfig = {};
      
      // Initialize hero config for new hero sections
      if (sectionType === 'hero') {
        defaultConfig = {
          slides: [],
          autoplay: true,
          // autoplayDelay not set by default - will use placeholder
          showNavigation: true,
          showPagination: true,
          backgroundColor: '#FFFFFF',
        };
      }
      
      // Initialize FAQ config for new FAQ sections
      if (sectionType === 'faq') {
        defaultConfig = {
          faqs: [],
          backgroundColor: '#F3F3F3',
          layout: 'accordion',
          allowMultipleOpen: false,
        };
      }
      
      const defaultState = {
        title: '',
        section_type: sectionType,
        source_type: 'collection',
        source_value: validCollections.length > 0 ? getCollectionIdentifier(validCollections[0]) : '',
        product_count: 4,
        display_style: 'grid',
        is_active: true,
        display_order: 1,
        description: '',
        config: defaultConfig,
        status: 'draft',
      };
      setFormData(defaultState);
      initialFormState.current = { ...defaultState };
      // Initialize autoplayDelay display - leave empty (placeholder only)
      setAutoplayDelayDisplay('');
    }
  }, [section, collections]);

  // Check if form has unsaved changes
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormState.current);
    setHasUnsavedChanges(formChanged);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value);
    
    const updatedFormData = {
      ...formData,
      [name]: newValue,
    };
    
    // Reset source_value when source_type changes (though we only support collections now)
    if (name === 'source_type') {
      newValue = value;
      const validCollections = Array.isArray(collections) ? collections : [];
      const getCollectionIdentifier = (collection) => {
        return collection?.slug || collection?.id?.toString() || '';
      };
      updatedFormData[name] = newValue;
      updatedFormData.source_value = validCollections.length > 0 ? getCollectionIdentifier(validCollections[0]) : '';
    }
    
    setFormData(updatedFormData);

    // Real-time validation for duplicates and invalid values
    if (name === 'title' || name === 'display_order' || name === 'source_value' || name === 'product_count') {
      const validationErrors = {};
      
      if (name === 'title' && newValue.trim()) {
        // First clear any existing title error
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.title;
          return newErrors;
        });
        
        // Only check for duplicate title (case-insensitive)
        const duplicateTitle = existingSections.find(
          s => s.id !== (section?.id || null) && 
          s.title.toLowerCase().trim() === newValue.toLowerCase().trim()
        );
        if (duplicateTitle) {
          validationErrors.title = 'A section with this title already exists';
        }
      }
      
      // Clear error when user starts typing (for other fields)
      if (name !== 'title' && errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      
      if (name === 'display_order') {
        if (newValue === null || newValue === undefined || newValue === '' || newValue === 0 || newValue < 1) {
          validationErrors.display_order = 'Display order must be at least 1';
        } else {
          // Check for duplicate display_order
          const duplicateOrder = existingSections.find(
            s => s.id !== (section?.id || null) && 
            s.display_order !== null && 
            s.display_order !== undefined &&
            s.display_order === newValue
          );
          if (duplicateOrder) {
            validationErrors.display_order = `Display order ${newValue} is already used by "${duplicateOrder.title}"`;
          }
        }
      }
      
      if (name === 'product_count') {
        if (newValue === null || newValue === undefined || newValue === '' || newValue === 0 || newValue < 1 || newValue > 50) {
          validationErrors.product_count = 'Product count must be between 1 and 50';
        }
      }
      
      if (name === 'source_value' && newValue) {
        const duplicateCollection = existingSections.find(
          s => s.id !== (section?.id || null) && 
          s.source_value === newValue
        );
        if (duplicateCollection) {
          validationErrors.source_value = `This collection is already used by "${duplicateCollection.title}"`;
        }
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...validationErrors }));
      } else if (name === 'title' || name === 'display_order' || name === 'source_value' || name === 'product_count') {
        // Clear the error if no duplicate found or value is valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateFormWithData = (dataToValidate) => {
    const newErrors = {};

    // Name field removed - using ID as unique identifier only

    // Validate title
    if (!dataToValidate.title || !dataToValidate.title.trim()) {
      newErrors.title = 'Section title is required';
    } else {
      // Check for duplicate title (case-insensitive)
      const duplicateTitle = existingSections.find(
        s => s.id !== (section?.id || null) && 
        s.title && 
        s.title.toLowerCase().trim() === dataToValidate.title.toLowerCase().trim()
      );
      if (duplicateTitle) {
        newErrors.title = 'A section with this title already exists';
      }
    }

    // Validate source_value (Product Collection) - only required for product_grid sections
    if (dataToValidate.section_type === 'product_grid') {
      if (!dataToValidate.source_value || dataToValidate.source_value.trim() === '') {
        newErrors.source_value = 'Product collection is required';
      } else {
        // Check for duplicate collection usage
        const duplicateCollection = existingSections.find(
          s => s.id !== (section?.id || null) && 
          s.source_value && 
          s.source_value === dataToValidate.source_value
        );
        if (duplicateCollection) {
          newErrors.source_value = `This collection is already used by "${duplicateCollection.title}"`;
        }
      }
    }

    // Validate display_order (required, minimum 1) - Skip for hero sections
    if (dataToValidate.section_type !== 'hero') {
      if (dataToValidate.display_order === null || dataToValidate.display_order === undefined || dataToValidate.display_order === '' || dataToValidate.display_order === 0 || dataToValidate.display_order < 1) {
        newErrors.display_order = 'Display order must be at least 1';
      } else {
        // Check for duplicate display_order
        const duplicateOrder = existingSections.find(
          s => s.id !== (section?.id || null) && 
          s.display_order !== null && 
          s.display_order !== undefined &&
          s.display_order === dataToValidate.display_order
        );
        if (duplicateOrder) {
          newErrors.display_order = `Display order ${dataToValidate.display_order} is already used by "${duplicateOrder.title}"`;
        }
      }
    } else {
      // For hero sections, set display_order to 1 automatically
      if (!dataToValidate.display_order) {
        dataToValidate.display_order = 1;
      }
    }

    // Validate product_count - only for product_grid sections
    if (dataToValidate.section_type === 'product_grid') {
      if (dataToValidate.product_count === null || dataToValidate.product_count === undefined || dataToValidate.product_count === '' || dataToValidate.product_count === 0 || dataToValidate.product_count < 1 || dataToValidate.product_count > 50) {
        newErrors.product_count = 'Product count must be between 1 and 50';
      }
    }

    // Validate FAQ config
    if (dataToValidate.section_type === 'faq') {
      const faqs = dataToValidate.config?.faqs || [];
      if (faqs.length === 0) {
        newErrors.config = 'At least one FAQ item is required';
      } else {
        // Validate each FAQ has question and answer
        faqs.forEach((faq, index) => {
          if (!faq.question || !faq.question.trim()) {
            newErrors[`faq_${index}_question`] = 'Question is required';
          }
          if (!faq.answer || !faq.answer.trim()) {
            newErrors[`faq_${index}_answer`] = 'Answer is required';
          }
        });
      }
    }

    // Validate hero slider config
    if (dataToValidate.section_type === 'hero') {
      const slides = dataToValidate.config?.slides || [];
      if (!slides || slides.length === 0) {
        newErrors.config = 'Please add at least one slide to your hero slider. Click the "Add Slide" button to get started.';
      } else {
        // Validate each slide has required fields
        slides.forEach((slide, index) => {
          if (!slide.image || !slide.image.trim()) {
            newErrors[`slide_${index}_image`] = `Slide ${index + 1}: Please upload a background image`;
          }
          if (!slide.title || !slide.title.trim()) {
            newErrors[`slide_${index}_title`] = `Slide ${index + 1}: Title is required`;
          }
          if (!slide.subtitle || !slide.subtitle.trim()) {
            newErrors[`slide_${index}_subtitle`] = `Slide ${index + 1}: Subtitle is required`;
          }
          if (!slide.buttonText || !slide.buttonText.trim()) {
            newErrors[`slide_${index}_buttonText`] = `Slide ${index + 1}: Button text is required`;
          }
          if (!slide.buttonLink || !slide.buttonLink.trim()) {
            newErrors[`slide_${index}_buttonLink`] = `Slide ${index + 1}: Button link is required`;
          }
        });
      }
    }

    setErrors(newErrors);
    // Return both validation result and errors object
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const validateForm = () => {
    const result = validateFormWithData(formData);
    return result.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data (no name validation - using ID only)
    let submitFormData = { ...formData };

    // FAQ is a single permanent section on the landing page:
    // keep the heading static and prevent admin from changing title/description.
    if (submitFormData.section_type === 'faq') {
      submitFormData.title = 'Frequently Asked Questions';
      submitFormData.description = '';
    }
    
    // Validate with the updated formData - get errors directly from validation
    const validationResult = validateFormWithData(submitFormData);
    if (!validationResult.isValid) {
      // Use errors directly from validation result, not from state (which may be stale)
      const validationErrors = validationResult.errors;
      
      // Show specific error messages
      const errorMessages = Object.entries(validationErrors)
        .filter(([_, msg]) => msg && msg.trim() !== '')
        .map(([field, msg]) => {
          // For config errors (like hero slider slides), show message directly without field prefix
          if (field === 'config' && msg.includes('slide')) {
            return msg;
          }
          // For slide-specific errors, the message already includes the slide number, so show it directly
          if (field.startsWith('slide_') && msg.includes('Slide')) {
            return msg;
          }
          // Format field name for display
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return `${fieldName}: ${msg}`;
        })
        .join(', ');
      
      if (errorMessages) {
        toast.error(errorMessages);
      } else {
        toast.error('Please fix the errors in the form');
      }
      
      // Scroll to first error field
      const firstErrorField = Object.keys(validationErrors).find(key => validationErrors[key] && validationErrors[key].trim() !== '');
      if (firstErrorField) {
        setTimeout(() => {
          // Try to find the element by name, id, or class
          let errorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
                             document.querySelector(`#${firstErrorField}`);
          
          // For slide-specific errors, find the first invalid input in the slide
          if (!errorElement && firstErrorField.startsWith('slide_')) {
            const firstInvalid = document.querySelector('.is-invalid');
            if (firstInvalid) {
              errorElement = firstInvalid;
            }
          }
          
          // Fallback to any invalid element
          if (!errorElement) {
            errorElement = document.querySelector('.is-invalid');
          }
          
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (errorElement.focus) {
              errorElement.focus();
            }
          }
        }, 100);
      }
      return;
    }

    setLoading(true);
    showAlert.loading(`Saving section...`);

    try {
      const url = isEdit
        ? `${apiBaseUrl}/landing-page-sections/${section.id}`
        : `${apiBaseUrl}/landing-page-sections`;

      const method = isEdit ? 'PUT' : 'POST';

      // Prepare data for submission
      // Convert config to JSON string for backend validation (Laravel's json rule expects a string)
      let configValue = submitFormData.config || {};
      if (typeof configValue === 'string') {
        // If it's already a string, try to parse and re-stringify to ensure it's valid JSON
        try {
          configValue = JSON.parse(configValue);
        } catch (e) {
          // If parsing fails, use empty object
          configValue = {};
        }
      }
      // Stringify the config object for Laravel's json validation rule
      const submitData = {
        ...submitFormData,
        config: JSON.stringify(configValue),
      };
      
      // Auto-set display_order and status for hero sections (only one hero slider allowed)
      if (submitData.section_type === 'hero') {
        submitData.display_order = 1;
        submitData.status = 'published'; // Auto-publish hero sections
        submitData.published_at = submitData.published_at || new Date().toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert.close();
        // Special message for hero sliders
        if (submitData.section_type === 'hero' && (submitData.status === 'published' || submitData.is_active)) {
          toast.success(`Hero slider ${isEdit ? 'updated' : 'created'} successfully. Other hero sliders have been automatically deactivated.`, {
            autoClose: 5000, // Show for 5 seconds to give user time to read
          });
        } else {
          toast.success(`Section ${isEdit ? 'updated' : 'created'} successfully`);
        }
        onSave();
      } else {
        showAlert.close();
        
        // Handle Laravel validation errors
        if (data.errors) {
          // Laravel validation errors come as arrays, so we need to flatten them
          const flattenedErrors = {};
          Object.keys(data.errors).forEach(key => {
            // If the error is an array, take the first message
            // If it's already a string, use it directly
            const errorValue = Array.isArray(data.errors[key]) 
              ? data.errors[key][0] 
              : data.errors[key];
            
            // Ignore 'name' field errors - we're not using name field anymore, using ID only
            if (key !== 'name') {
              flattenedErrors[key] = errorValue;
            }
          });
          
          setErrors(flattenedErrors);
          
          // Show toast with first error
          const firstErrorKey = Object.keys(flattenedErrors)[0];
          const firstError = flattenedErrors[firstErrorKey];
          if (firstError) {
            toast.error(firstError);
          } else {
            toast.error('Please fix the errors in the form');
          }
        } else {
          const errorMessage = data.message || `Failed to ${isEdit ? 'update' : 'create'} section`;
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      showAlert.close();
      console.error('Error saving section:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} section`);
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
  }, [hasUnsavedChanges, loading]);

  // Name field removed - using title as unique identifier only

  return (
    <Portal>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
            max-height: 1000px;
            margin-bottom: 1rem;
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
            max-height: 0;
            margin-bottom: 0;
            padding-top: 0;
            padding-bottom: 0;
            overflow: hidden;
          }
        }
        .slide-card {
          animation: slideIn 0.3s ease-out forwards;
          transition: all 0.3s ease-out;
        }
        .slide-card.deleting {
          animation: slideOut 0.3s ease-out forwards;
          pointer-events: none;
        }
      `}</style>
      <div
        ref={modalRef}
        className={`modal fade show d-block modal-backdrop-animation ${isClosing ? 'exit' : ''}`}
        style={{ 
          backgroundColor: swalShown ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
          transition: 'background-color 0.2s ease',
          zIndex: 9999,
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
                {isEdit 
                  ? `Edit ${formData.section_type === 'hero' ? 'Hero Slider' : formData.section_type === 'product_grid' ? 'Product Section' : 'Landing Page Section'}`
                  : `Create New ${formData.section_type === 'hero' ? 'Hero Slider' : formData.section_type === 'product_grid' ? 'Product Section' : 'Landing Page Section'}`}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white btn-smooth"
                onClick={handleCloseButtonClick}
                aria-label="Close"
                disabled={loading}
              ></button>
            </div>

            <form onSubmit={handleSubmit} id="sectionForm">
              {/* Modal Body */}
              <div
                className="modal-body modal-smooth"
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  backgroundColor: '#f8f9fa',
                  width: '100%',
                  maxWidth: '100%'
                }}
              >
                {/* Basic Information Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-info-circle me-2"></i>Basic Information
                  </h6>
                  <div className="row g-3">
                    {/* Section Title */}
                    {formData.section_type !== 'faq' && (
                    <div className="col-md-12">
                      <label htmlFor="title" className="form-label small fw-semibold text-dark mb-1">
                        Section Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control modal-smooth ${errors.title ? 'is-invalid' : ''}`}
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="e.g., Our New Arrivals"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                      <small className="text-muted">The title displayed on the landing page. Must be unique.</small>
                    </div>
                    )}

                    {/* Description */}
                    {formData.section_type !== 'faq' && (
                    <div className="col-md-12">
                      <label htmlFor="description" className="form-label small fw-semibold text-dark mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        className="form-control modal-smooth"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        rows="3"
                        placeholder="Optional description for this section"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      <small className="text-muted">Optional description for this section.</small>
                    </div>
                    )}

                    {formData.section_type === 'faq' && (
                      <div className="col-md-12">
                        <div className="alert alert-info mb-0">
                          <i className="fas fa-info-circle me-2"></i>
                          <strong>Frequently Asked Questions</strong> is a permanent landing page section. Only the questions/answers are editable here.
                        </div>
                      </div>
                    )}
                    
                    {/* Section Type - Hidden or Read-only */}
                    <input
                      type="hidden"
                      name="section_type"
                      value={formData.section_type}
                    />
                    
                    {/* Config - Show JSON textarea for sections that need it (testimonials, etc.), but not for hero, product_grid, or faq */}
                    {formData.section_type !== 'hero' && formData.section_type !== 'product_grid' && formData.section_type !== 'faq' && (
                      <div className="col-md-12">
                        <label htmlFor="config" className="form-label small fw-semibold text-dark mb-1">
                          Configuration (JSON)
                        </label>
                        <textarea
                          className="form-control modal-smooth"
                          id="config"
                          name="config"
                          value={typeof formData.config === 'string' ? formData.config : JSON.stringify(formData.config || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setFormData({ ...formData, config: parsed });
                            } catch {
                              setFormData({ ...formData, config: e.target.value });
                            }
                          }}
                          disabled={loading}
                          rows={6}
                          placeholder='{"slides": [], "autoplay": true}'
                          style={{ backgroundColor: '#ffffff', fontFamily: 'monospace', fontSize: '0.875rem' }}
                        />
                        <small className="text-muted">Section-specific configuration in JSON format. Leave empty for default values.</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hero Slider Configuration - Only show for hero */}
                {formData.section_type === 'hero' && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                      <i className="fas fa-images me-2"></i>Hero Slider Configuration
                    </h6>
                    
                    {/* Global Settings */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={formData.config?.backgroundColor || '#FFFFFF'}
                          onChange={(e) => {
                            const newConfig = { ...formData.config, backgroundColor: e.target.value };
                            setFormData({ ...formData, config: newConfig });
                          }}
                          disabled={loading}
                          style={{ height: '38px' }}
                        />
                        <small className="text-muted">Section background color</small>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Autoplay
                        </label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.config?.autoplay !== false}
                            onChange={(e) => {
                              const newConfig = { ...formData.config, autoplay: e.target.checked };
                              setFormData({ ...formData, config: newConfig });
                            }}
                            disabled={loading}
                          />
                          <label className="form-check-label" style={{ fontSize: '0.875rem' }}>
                            Enable autoplay
                          </label>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Autoplay Delay (seconds)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={autoplayDelayDisplay}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Update display value
                            setAutoplayDelayDisplay(inputValue);
                            
                            // Update config based on input
                            if (inputValue === '' || inputValue === null || inputValue === undefined) {
                              // Remove from config when empty
                              const newConfig = { ...formData.config };
                              delete newConfig.autoplayDelay;
                              setFormData({ ...formData, config: newConfig });
                            } else {
                              // Convert seconds to milliseconds for storage
                              const seconds = parseFloat(inputValue);
                              if (!isNaN(seconds) && seconds > 0) {
                                const milliseconds = Math.max(1000, Math.round(seconds * 1000)); // Minimum 1 second (1000ms)
                                const newConfig = { ...formData.config, autoplayDelay: milliseconds };
                                setFormData({ ...formData, config: newConfig });
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // When field loses focus, set default in config if empty (but keep field empty)
                            const inputValue = e.target.value;
                            if (inputValue === '' || inputValue === null || inputValue === undefined || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0) {
                              // Set default 5 seconds (5000ms) in config for backend, but field stays empty
                              const newConfig = { ...formData.config, autoplayDelay: 5000 };
                              setFormData({ ...formData, config: newConfig });
                              // Keep display empty
                              setAutoplayDelayDisplay('');
                            }
                          }}
                          disabled={loading}
                          min="0.5"
                          step="0.5"
                          placeholder="5"
                        />
                        <small className="text-muted">Time between slides in seconds (default: 5)</small>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Show Navigation
                        </label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.config?.showNavigation !== false}
                            onChange={(e) => {
                              const newConfig = { ...formData.config, showNavigation: e.target.checked };
                              setFormData({ ...formData, config: newConfig });
                            }}
                            disabled={loading}
                          />
                          <label className="form-check-label" style={{ fontSize: '0.875rem' }}>
                            Show arrows
                          </label>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Show Pagination
                        </label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.config?.showPagination !== false}
                            onChange={(e) => {
                              const newConfig = { ...formData.config, showPagination: e.target.checked };
                              setFormData({ ...formData, config: newConfig });
                            }}
                            disabled={loading}
                          />
                          <label className="form-check-label" style={{ fontSize: '0.875rem' }}>
                            Show dots
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Slides Management */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-semibold text-dark mb-0">
                          Slides <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            const slides = formData.config?.slides || [];
                            const newSlide = {
                              image: '',
                              title: '',
                              subtitle: '',
                              buttonText: '',
                              buttonLink: '',
                              buttonColor: '#000000',
                              textColor: '#000000',
                            };
                            const newConfig = { ...formData.config, slides: [...slides, newSlide] };
                            setFormData({ ...formData, config: newConfig });
                            
                            // Auto-focus and scroll to the new slide's title field
                            setTimeout(() => {
                              const slideIndex = slides.length;
                              const titleInput = slideTitleRefs.current[`slide-${slideIndex}`];
                              if (titleInput) {
                                titleInput.focus();
                                titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }}
                          disabled={loading}
                          style={{ borderRadius: '2px' }}
                        >
                          <i className="fas fa-plus me-1"></i>Add Slide
                        </button>
                      </div>
                      <small className="text-muted">Add slides to your hero slider. At least one slide is required.</small>
                    </div>

                    {/* Slides List */}
                    <div className="slides-container">
                      {(formData.config?.slides || []).map((slide, index) => (
                        <div 
                          key={index} 
                          className={`card mb-3 slide-card ${deletingSlides[index] ? 'deleting' : ''}`}
                          style={{ 
                            border: '1px solid #dee2e6',
                          }}
                        >
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <span className="fw-semibold">Slide {index + 1}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                // Start delete animation
                                setDeletingSlides(prev => ({ ...prev, [index]: true }));
                                
                                // Wait for animation to complete, then remove slide
                                setTimeout(() => {
                                  const slides = [...(formData.config?.slides || [])];
                                  slides.splice(index, 1);
                                  const newConfig = { ...formData.config, slides };
                                  setFormData({ ...formData, config: newConfig });
                                  
                                  // Rebuild image previews based on new slide order
                                  const newPreviews = {};
                                  slides.forEach((slide, idx) => {
                                    if (slide.image) {
                                      newPreviews[`slide-${idx}`] = slide.image;
                                    }
                                  });
                                  setImagePreviews(newPreviews);
                                  
                                  // Clear deleting state
                                  setDeletingSlides(prev => {
                                    const newState = { ...prev };
                                    delete newState[index];
                                    return newState;
                                  });
                                }, 300); // Match animation duration
                              }}
                              disabled={loading || (formData.config?.slides || []).length === 1 || deletingSlides[index]}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-md-12">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                  Background Image <span className="text-danger">*</span>
                                </label>
                                
                                {/* Image Preview */}
                                {(slide.image || imagePreviews[`slide-${index}`]) && (
                                  <div className="mb-2" style={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                      src={imagePreviews[`slide-${index}`] || slide.image}
                                      alt="Preview"
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        borderRadius: '4px',
                                        border: '1px solid #dee2e6',
                                        objectFit: 'cover',
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger"
                                      onClick={() => {
                                        const slides = [...(formData.config?.slides || [])];
                                        slides[index].image = '';
                                        const newConfig = { ...formData.config, slides };
                                        setFormData({ ...formData, config: newConfig });
                                        setImagePreviews(prev => {
                                          const newPreviews = { ...prev };
                                          delete newPreviews[`slide-${index}`];
                                          return newPreviews;
                                        });
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <i className="fas fa-times" style={{ fontSize: '0.75rem' }}></i>
                                    </button>
                                  </div>
                                )}
                                
                                {/* File Upload Input */}
                                <div className="input-group">
                                  <input
                                    type="file"
                                    className="form-control"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      
                                      // Validate file type
                                      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                                      if (!validTypes.includes(file.type)) {
                                        toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
                                        return;
                                      }
                                      
                                      // Validate file size (5MB max)
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast.error('Image size must be less than 5MB');
                                        return;
                                      }
                                      
                                      // Show preview immediately
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setImagePreviews(prev => ({
                                          ...prev,
                                          [`slide-${index}`]: reader.result
                                        }));
                                      };
                                      reader.readAsDataURL(file);
                                      
                                      // Upload to server
                                      setUploadingImages(prev => ({ ...prev, [index]: true }));
                                      try {
                                        const formDataToSend = new FormData();
                                        formDataToSend.append('image', file);
                                        
                                        const response = await fetch(`${apiBaseUrl}/hero-slider/upload-image`, {
                                          method: 'POST',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Accept': 'application/json',
                                          },
                                          body: formDataToSend,
                                        });
                                        
                                        const data = await response.json();
                                        
                                        if (response.ok && data.success) {
                                          // Update slide with uploaded image URL
                                          const slides = [...(formData.config?.slides || [])];
                                          slides[index].image = data.url;
                                          const newConfig = { ...formData.config, slides };
                                          setFormData({ ...formData, config: newConfig });
                                          toast.success('Image uploaded successfully!');
                                        } else {
                                          throw new Error(data.message || 'Failed to upload image');
                                        }
                                      } catch (error) {
                                        console.error('Image upload error:', error);
                                        toast.error(error.message || 'Failed to upload image');
                                        // Remove preview on error
                                        setImagePreviews(prev => {
                                          const newPreviews = { ...prev };
                                          delete newPreviews[`slide-${index}`];
                                          return newPreviews;
                                        });
                                      } finally {
                                        setUploadingImages(prev => {
                                          const newUploading = { ...prev };
                                          delete newUploading[index];
                                          return newUploading;
                                        });
                                        // Reset file input
                                        e.target.value = '';
                                      }
                                    }}
                                    disabled={loading || uploadingImages[index]}
                                    style={{ borderRadius: '2px' }}
                                  />
                                  {uploadingImages[index] && (
                                    <span className="input-group-text">
                                      <span className="spinner-border spinner-border-sm" role="status"></span>
                                    </span>
                                  )}
                                </div>
                                <small className="text-muted">Upload an image file (JPEG, PNG, WebP, or GIF, max 5MB)</small>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                  Title <span className="text-danger">*</span>
                                </label>
                                <input
                                  ref={(el) => {
                                    if (el) {
                                      slideTitleRefs.current[`slide-${index}`] = el;
                                    }
                                  }}
                                  type="text"
                                  className={`form-control ${errors[`slide_${index}_title`] ? 'is-invalid' : ''}`}
                                  value={slide.title || ''}
                                  onChange={(e) => {
                                    const slides = [...(formData.config?.slides || [])];
                                    slides[index].title = e.target.value;
                                    const newConfig = { ...formData.config, slides };
                                    setFormData({ ...formData, config: newConfig });
                                    // Clear error when user types
                                    if (errors[`slide_${index}_title`]) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[`slide_${index}_title`];
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  disabled={loading}
                                  placeholder="Slide title"
                                />
                                {errors[`slide_${index}_title`] && (
                                  <div className="invalid-feedback">{errors[`slide_${index}_title`]}</div>
                                )}
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                  Subtitle <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${errors[`slide_${index}_subtitle`] ? 'is-invalid' : ''}`}
                                  value={slide.subtitle || ''}
                                  onChange={(e) => {
                                    const slides = [...(formData.config?.slides || [])];
                                    slides[index].subtitle = e.target.value;
                                    const newConfig = { ...formData.config, slides };
                                    setFormData({ ...formData, config: newConfig });
                                    // Clear error when user types
                                    if (errors[`slide_${index}_subtitle`]) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[`slide_${index}_subtitle`];
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  disabled={loading}
                                  placeholder="Slide subtitle"
                                />
                                {errors[`slide_${index}_subtitle`] && (
                                  <div className="invalid-feedback">{errors[`slide_${index}_subtitle`]}</div>
                                )}
                              </div>
                              <div className="col-md-4">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                  Button Text <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${errors[`slide_${index}_buttonText`] ? 'is-invalid' : ''}`}
                                  value={slide.buttonText || ''}
                                  onChange={(e) => {
                                    const slides = [...(formData.config?.slides || [])];
                                    slides[index].buttonText = e.target.value;
                                    const newConfig = { ...formData.config, slides };
                                    setFormData({ ...formData, config: newConfig });
                                    // Clear error when user types
                                    if (errors[`slide_${index}_buttonText`]) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[`slide_${index}_buttonText`];
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  disabled={loading}
                                  placeholder="Shop Now"
                                />
                                {errors[`slide_${index}_buttonText`] && (
                                  <div className="invalid-feedback">{errors[`slide_${index}_buttonText`]}</div>
                                )}
                              </div>
                              <div className="col-md-4">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                  Button Link <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${errors[`slide_${index}_buttonLink`] ? 'is-invalid' : ''}`}
                                  value={slide.buttonLink || ''}
                                  onChange={(e) => {
                                    const slides = [...(formData.config?.slides || [])];
                                    slides[index].buttonLink = e.target.value;
                                    const newConfig = { ...formData.config, slides };
                                    setFormData({ ...formData, config: newConfig });
                                    // Clear error when user types
                                    if (errors[`slide_${index}_buttonLink`]) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[`slide_${index}_buttonLink`];
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  disabled={loading}
                                  placeholder="/products or https://..."
                                />
                                {errors[`slide_${index}_buttonLink`] && (
                                  <div className="invalid-feedback">{errors[`slide_${index}_buttonLink`]}</div>
                                )}
                              </div>
                              <div className="col-md-2">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                  Button Color
                                </label>
                                <input
                                  type="color"
                                  className="form-control form-control-color"
                                  value={slide.buttonColor || '#000000'}
                                  onChange={(e) => {
                                    const slides = [...(formData.config?.slides || [])];
                                    slides[index].buttonColor = e.target.value;
                                    const newConfig = { ...formData.config, slides };
                                    setFormData({ ...formData, config: newConfig });
                                  }}
                                  disabled={loading}
                                  style={{ height: '38px' }}
                                />
                              </div>
                              <div className="col-md-2">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                  Text Color
                                </label>
                                <input
                                  type="color"
                                  className="form-control form-control-color"
                                  value={slide.textColor || '#000000'}
                                  onChange={(e) => {
                                    const slides = [...(formData.config?.slides || [])];
                                    slides[index].textColor = e.target.value;
                                    const newConfig = { ...formData.config, slides };
                                    setFormData({ ...formData, config: newConfig });
                                  }}
                                  disabled={loading}
                                  style={{ height: '38px' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!formData.config?.slides || formData.config.slides.length === 0) && (
                        <div className="alert alert-info">
                          <i className="fas fa-info-circle me-2"></i>
                          No slides added yet. Click "Add Slide" to create your first slide.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* FAQ Configuration - Only show for FAQ */}
                {formData.section_type === 'faq' && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                      <i className="fas fa-question-circle me-2"></i>FAQ Configuration
                    </h6>
                    
                    {/* Background Color */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={formData.config?.backgroundColor || '#F3F3F3'}
                          onChange={(e) => {
                            const newConfig = { ...formData.config, backgroundColor: e.target.value };
                            setFormData({ ...formData, config: newConfig });
                          }}
                          disabled={loading}
                          style={{ height: '38px' }}
                        />
                        <small className="text-muted">Section background color</small>
                      </div>
                    </div>

                    {/* FAQ Items Management (table rows) */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          FAQ Items
                        </h6>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            const newFaq = {
                              id: `faq-${Date.now()}-${Math.random()}`,
                              question: '',
                              answer: '',
                              is_active: true,
                            };
                            const faqs = [...(formData.config?.faqs || []), newFaq];
                            const newConfig = { ...formData.config, faqs };
                            setFormData({ ...formData, config: newConfig });
                          }}
                          disabled={loading}
                        >
                          <i className="fas fa-plus me-1"></i>Add FAQ
                        </button>
                      </div>

                      <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                        <table className="table table-sm align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '32px' }}></th>
                              <th style={{ width: '32px' }}>#</th>
                              <th style={{ minWidth: '200px' }}>Question</th>
                              <th style={{ minWidth: '260px' }}>Answer</th>
                              <th style={{ width: '90px' }}>Active</th>
                              <th style={{ width: '70px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.config?.faqs && formData.config.faqs.length > 0 ? (
                              formData.config.faqs.map((faq, index) => (
                                <tr key={faq.id || index}>
                                  <td style={{ width: '32px' }}>
                                    <i className="fas fa-grip-vertical text-muted"></i>
                                  </td>
                                  <td style={{ width: '32px' }} className="text-muted small">
                                    {index + 1}
                                  </td>
                                  <td style={{ minWidth: '200px' }}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={faq.question || ''}
                                      onChange={(e) => {
                                        const faqs = [...(formData.config?.faqs || [])];
                                        faqs[index].question = e.target.value;
                                        const newConfig = { ...formData.config, faqs };
                                        setFormData({ ...formData, config: newConfig });
                                      }}
                                      disabled={loading}
                                      placeholder="Enter question..."
                                    />
                                  </td>
                                  <td style={{ minWidth: '260px' }}>
                                    <textarea
                                      className="form-control form-control-sm"
                                      value={faq.answer || ''}
                                      onChange={(e) => {
                                        const faqs = [...(formData.config?.faqs || [])];
                                        faqs[index].answer = e.target.value;
                                        const newConfig = { ...formData.config, faqs };
                                        setFormData({ ...formData, config: newConfig });
                                      }}
                                      disabled={loading}
                                      rows="2"
                                      placeholder="Enter answer..."
                                    />
                                  </td>
                                  <td style={{ width: '90px' }} className="text-center">
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={faq.is_active !== false}
                                        onChange={(e) => {
                                          const faqs = [...(formData.config?.faqs || [])];
                                          faqs[index].is_active = e.target.checked;
                                          const newConfig = { ...formData.config, faqs };
                                          setFormData({ ...formData, config: newConfig });
                                        }}
                                        disabled={loading}
                                      />
                                    </div>
                                  </td>
                                  <td style={{ width: '70px' }} className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        const faqs = [...(formData.config?.faqs || [])];
                                        faqs.splice(index, 1);
                                        const newConfig = { ...formData.config, faqs };
                                        setFormData({ ...formData, config: newConfig });
                                      }}
                                      disabled={loading}
                                      title="Delete FAQ"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6">
                                  <div className="alert alert-info mb-0">
                                    <i className="fas fa-info-circle me-2"></i>
                                    No FAQs added yet. Click "Add FAQ" to create your first FAQ item.
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Source Section - Only show for product_grid */}
                {formData.section_type === 'product_grid' && (
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-box me-2"></i>Product Source
                  </h6>
                  <div className="row g-3">
                    {/* Source Value - Collections Only */}
                    <div className="col-md-12">
                      <label htmlFor="source_value" className="form-label small fw-semibold text-dark mb-1">
                        Product Collection <span className="text-danger">*</span>
                        {collectionsLoading && (
                          <span className="ms-2">
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <small className="text-muted ms-1">Loading collections...</small>
                          </span>
                        )}
                      </label>
                      <select
                        className={`form-select modal-smooth ${errors.source_value ? 'is-invalid' : ''}`}
                        id="source_value"
                        name="source_value"
                        value={formData.source_value || ''}
                        onChange={handleChange}
                        disabled={loading || collectionsLoading}
                        style={{ 
                          backgroundColor: '#ffffff',
                          cursor: (loading || collectionsLoading) ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          zIndex: 1
                        }}
                        onClick={(e) => {
                          console.log('Select clicked:', {
                            disabled: e.currentTarget.disabled,
                            value: e.currentTarget.value,
                            collectionsCount: collections?.length,
                            collectionsLoading
                          });
                        }}
                      >
                        {collectionsLoading ? (
                          <option value="">Loading collections...</option>
                        ) : !Array.isArray(collections) || collections.length === 0 ? (
                          <option value="">No collections available. Create a collection first.</option>
                        ) : (
                          <>
                            {!formData.source_value && (
                              <option value="">Select a collection...</option>
                            )}
                            {collections.map(collection => {
                              const identifier = collection?.slug || collection?.id?.toString() || '';
                              return (
                                <option key={collection.id} value={identifier}>
                                  {collection.name || collection.title || `Collection ${collection.id}`}
                                </option>
                              );
                            })}
                          </>
                        )}
                      </select>
                      {errors.source_value && <div className="invalid-feedback">{errors.source_value}</div>}
                      <small className="text-muted">
                        <strong>What is this?</strong> This selects which product collection will be displayed in this section on your landing page. For example, if you select "New Arrivals" collection, this section will show products from that collection. Each collection can only be used by one section. Create collections in <strong>Products → Collections</strong>.
                        {collections.length > 0 && (
                          <span className="ms-2 text-success">
                            ({collections.length} collection{collections.length !== 1 ? 's' : ''} available)
                          </span>
                        )}
                      </small>
                    </div>

                    {/* Product Count */}
                    <div className="col-md-6">
                      <label htmlFor="product_count" className="form-label small fw-semibold text-dark mb-1">
                        Number of Products <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control modal-smooth ${errors.product_count ? 'is-invalid' : ''}`}
                        id="product_count"
                        name="product_count"
                        value={formData.product_count}
                        onChange={handleChange}
                        disabled={loading}
                        min="1"
                        max="50"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      {errors.product_count && <div className="invalid-feedback">{errors.product_count}</div>}
                      <small className="text-muted">Number of products to display (1-50)</small>
                    </div>
                  </div>
                </div>
                )}

                {/* Display Settings Section */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-cog me-2"></i>Display Settings
                  </h6>
                  <div className="row g-3">
                    {/* Display Style - Only for product_grid */}
                    {formData.section_type === 'product_grid' && (
                      <div className="col-md-6">
                        <label htmlFor="display_style" className="form-label small fw-semibold text-dark mb-1">
                          Display Style
                        </label>
                        <select
                          className="form-select modal-smooth"
                          id="display_style"
                          name="display_style"
                          value={formData.display_style}
                          onChange={handleChange}
                          disabled={loading}
                          style={{ backgroundColor: '#ffffff' }}
                        >
                          <option value="grid">Grid</option>
                          <option value="slider">Slider</option>
                        </select>
                        <small className="text-muted">How products are displayed on the landing page.</small>
                      </div>
                    )}

                    {/* Display Order - Hidden for hero sections (only one hero slider allowed) */}
                    {formData.section_type !== 'hero' && (
                      <div className={formData.section_type === 'product_grid' ? 'col-md-6' : 'col-md-12'}>
                        <label htmlFor="display_order" className="form-label small fw-semibold text-dark mb-1">
                          Display Order <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className={`form-control modal-smooth ${errors.display_order ? 'is-invalid' : ''}`}
                          id="display_order"
                          name="display_order"
                          value={formData.display_order}
                          onChange={handleChange}
                          disabled={loading}
                          min="1"
                          required
                          placeholder="1"
                          style={{ backgroundColor: '#ffffff' }}
                        />
                        {errors.display_order && <div className="invalid-feedback">{errors.display_order}</div>}
                        <small className="text-muted">Lower numbers appear first. Each section must have a unique display order. You can also reorder using arrows in the list.</small>
                      </div>
                    )}

                    {/* Active Status */}
                    <div className={formData.section_type === 'hero' ? 'col-md-12' : 'col-md-6'}>
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Active Status
                      </label>
                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_active"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active <small className="text-muted">(Section will be visible on landing page)</small>
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-smooth"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'} me-2`}></i>
                      {isEdit ? 'Update Section' : 'Create Section'}
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

export default LandingPageSectionFormModal;

