import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Portal from "../../../components/Portal";
import { useAuth } from "../../../contexts/AuthContext";
import { showAlert } from "../../../services/notificationService";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingPageSectionFormModal from '../LandingPageSectionFormModal';
import LandingPageSectionDetailsModal from '../LandingPageSectionDetailsModal';
import { FaEdit, FaTrash, FaBox, FaArrowUp, FaArrowDown, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import LoadingSpinner from '../../../components/admin/LoadingSpinner';

const sectionTypeConfig = {
  hero: { label: 'Hero Slider', icon: 'fas fa-images', description: 'Manage hero slider sections' },
  product_grid: { label: 'Product Sections', icon: 'fas fa-box', description: 'Manage product grid sections' },
  products: { label: 'Product Sections', icon: 'fas fa-box', description: 'Manage product grid sections' },
  faq: { label: 'FAQ Sections', icon: 'fas fa-question-circle', description: 'Manage FAQ sections' },
  testimonials: { label: 'Testimonials', icon: 'fas fa-star', description: 'Manage testimonial sections' },
  email_subscribe: { label: 'Email Subscribe', icon: 'fas fa-envelope', description: 'Manage email subscribe sections' },
  'email-subscribe': { label: 'Email Subscribe', icon: 'fas fa-envelope', description: 'Manage email subscribe sections' },
};

const SectionTypeAdmin = () => {
  const { token } = useAuth();
  const [allSections, setAllSections] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [stats, setStats] = useState({
    totalSections: 0,
    activeSections: 0,
    publishedSections: 0,
  });
  const [collections, setCollections] = useState([]);
  const [sectionProducts, setSectionProducts] = useState({});
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // FAQ item manager state (for section_type === 'faq')
  const [faqSectionId, setFaqSectionId] = useState(null);
  const [faqItems, setFaqItems] = useState([]);
  const [showFaqItemModal, setShowFaqItemModal] = useState(false);
  const [faqClosing, setFaqClosing] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqDeletingId, setFaqDeletingId] = useState(null);
  const [faqTouched, setFaqTouched] = useState({
    order: false,
    question: false,
    answer: false,
  });
  const [faqSubmitted, setFaqSubmitted] = useState(false);
  const [editingFaqItem, setEditingFaqItem] = useState(null);
  const [faqModalForm, setFaqModalForm] = useState({
    question: '',
    answer: '',
    order: 1,
    is_active: true,
  });
  const [faqPageMeta, setFaqPageMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [faqRows, setFaqRows] = useState([]);
  const faqInitialFormRef = useRef(null);

  // Testimonials item manager state (for section_type === 'testimonials')
  const [testimonialSectionId, setTestimonialSectionId] = useState(null);
  const [testimonialItems, setTestimonialItems] = useState([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialClosing, setTestimonialClosing] = useState(false);
  const [testimonialSaving, setTestimonialSaving] = useState(false);
  const [testimonialDeletingId, setTestimonialDeletingId] = useState(null);
  const [testimonialTouched, setTestimonialTouched] = useState({
    order: false,
    name: false,
    content: false,
    rating: false,
  });
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [editingTestimonialItem, setEditingTestimonialItem] = useState(null);
  const [testimonialModalForm, setTestimonialModalForm] = useState({
    content: '',
    name: '',
    role: '',
    rating: 5,
    order: 1,
    is_active: true,
    image: '',
  });
  const [testimonialPageMeta, setTestimonialPageMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [testimonialRows, setTestimonialRows] = useState([]);
  const testimonialInitialFormRef = useRef(null);

  const isDuplicateOrder = useCallback((ord, excludeId = null) => {
    const normalized = Number(ord || 0);
    if (!Number.isFinite(normalized)) return false;
    return (faqItems || []).some((f) => {
      if (excludeId && f.id === excludeId) return false;
      return Number(f.order || 0) === normalized;
    });
  }, [faqItems]);

  const isDuplicateTestimonialOrder = useCallback((ord, excludeId = null) => {
    const normalized = Number(ord || 0);
    if (!Number.isFinite(normalized)) return false;
    return (testimonialItems || []).some((t) => {
      if (excludeId && t.id === excludeId) return false;
      return Number(t.order || 0) === normalized;
    });
  }, [testimonialItems]);

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Get section type from URL path
  const getSectionTypeFromPath = () => {
    const path = window.location.pathname;
    if (path.includes('/admin/content/hero')) return 'hero';
    if (path.includes('/admin/content/products') || path.includes('/admin/content/product_grid')) return 'product_grid';
    if (path.includes('/admin/content/faq')) return 'faq';
    if (path.includes('/admin/content/testimonials')) return 'testimonials';
    if (path.includes('/admin/content/email-subscribe') || path.includes('/admin/content/email_subscribe')) return 'email_subscribe';
    return 'product_grid';
  };

  const sectionType = getSectionTypeFromPath();
  const config = sectionTypeConfig[sectionType] || sectionTypeConfig['product_grid'];

  const normalizeFaqItems = useCallback((raw) => {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((item, idx) => ({
      id: item?.id || `faq-${Date.now()}-${idx}`,
      question: item?.question || '',
      answer: item?.answer || '',
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : idx + 1,
      is_active: item?.is_active !== false,
    }));
  }, []);

  const normalizeFaqForm = useCallback((form) => ({
    question: (form?.question || '').trim(),
    answer: (form?.answer || '').trim(),
    order: Number(form?.order || 0) || 0,
    is_active: !!form?.is_active,
  }), []);

  const normalizeTestimonialItems = useCallback((raw) => {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((item, idx) => ({
      id: item?.id || `testimonial-${Date.now()}-${idx}`,
      content: item?.content || item?.text || item?.comment || '',
      name: item?.name || item?.author || '',
      role: item?.role || item?.productType || '',
      rating: Number.isFinite(Number(item?.rating)) ? Number(item.rating) : 5,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : idx + 1,
      is_active: item?.is_active !== false,
      image: item?.image || '',
      title: item?.title || '',
    }));
  }, []);

  const normalizeTestimonialForm = useCallback((form) => ({
    content: (form?.content || '').trim(),
    name: (form?.name || '').trim(),
    role: (form?.role || '').trim(),
    rating: Number(form?.rating || 0) || 0,
    order: Number(form?.order || 0) || 0,
    is_active: !!form?.is_active,
    image: (form?.image || '').trim(),
  }), []);

  const isFaqDirty = useMemo(() => {
    if (!showFaqItemModal) return false;
    const initial = faqInitialFormRef.current;
    if (!initial) return false;
    const current = normalizeFaqForm(faqModalForm);
    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [showFaqItemModal, faqModalForm, normalizeFaqForm]);

  const isTestimonialDirty = useMemo(() => {
    if (!showTestimonialModal) return false;
    const initial = testimonialInitialFormRef.current;
    if (!initial) return false;
    const current = normalizeTestimonialForm(testimonialModalForm);
    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [showTestimonialModal, testimonialModalForm, normalizeTestimonialForm]);

  // Fetch all sections of this type
  const fetchAllSections = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/landing-page-sections/type/${sectionType}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: 'no-cache',
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        const text = await response.text();
        console.error("Response text:", text);
        throw new Error(
          `Invalid response from server: ${response.status} ${response.statusText}`
        );
      }

      if (!response.ok) {
        console.error("API Error Response:", data);
        const errorMessage =
          data.message ||
          data.error ||
          `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (data.success && data.sections) {
        const sortedSections = [...data.sections].sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          return new Date(a.created_at) - new Date(b.created_at);
        });
        
        setAllSections(sortedSections);
        
        const activeSections = sortedSections.filter(s => s.is_active === true).length;
        const publishedSections = sortedSections.filter(s => s.status === 'published').length;
        setStats({
          totalSections: sortedSections.length,
          activeSections: activeSections,
          publishedSections: publishedSections,
        });
      } else {
        setAllSections([]);
        setStats({
          totalSections: 0,
          activeSections: 0,
          publishedSections: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      showAlert.error(
        "Sections Error",
        error.message || "Unable to load landing page sections"
      );
      setAllSections([]);
      setStats({
        totalSections: 0,
        activeSections: 0,
        publishedSections: 0,
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, apiBaseUrl, sectionType]);

  // Filter and paginate sections client-side
  const filterAndPaginateSections = useCallback(() => {
    let filtered = [...allSections];

    // For FAQ, show only the single managed FAQ section (hide inactive duplicates)
    if (sectionType === 'faq' && faqSectionId) {
      filtered = filtered.filter((section) => section.id === faqSectionId);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((section) => {
        const titleMatch = section.title?.toLowerCase().includes(search);
        const descMatch = section.description?.toLowerCase().includes(search);
        return titleMatch || descMatch;
      });
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(section => section.is_active === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(section => section.is_active === false);
    }

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    setSections(paginated);
    
    setPaginationMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });
  }, [allSections, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Filter + paginate FAQ items using the same search/status/per-page controls (for consistency)
  useEffect(() => {
    if (sectionType !== 'faq') return;

    let filtered = [...(faqItems || [])];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((f) => {
        const q = (f.question || '').toLowerCase();
        const a = (f.answer || '').toLowerCase();
        return q.includes(search) || a.includes(search);
      });
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((f) => f.is_active === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((f) => f.is_active !== true);
    }

    filtered = filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const safePage = Math.min(currentPage, lastPage);
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    setFaqRows(paginated);
    setFaqPageMeta({
      current_page: safePage,
      last_page: lastPage,
      total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });

    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [sectionType, faqItems, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Filter + paginate testimonial items using the same search/status/per-page controls (for consistency)
  useEffect(() => {
    if (sectionType !== 'testimonials') return;

    let filtered = [...(testimonialItems || [])];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((t) => {
        const content = (t.content || '').toLowerCase();
        const name = (t.name || '').toLowerCase();
        const role = (t.role || '').toLowerCase();
        return content.includes(search) || name.includes(search) || role.includes(search);
      });
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((t) => t.is_active === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((t) => t.is_active !== true);
    }

    filtered = filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
    const safePage = Math.min(currentPage, lastPage);
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    setTestimonialRows(paginated);
    setTestimonialPageMeta({
      current_page: safePage,
      last_page: lastPage,
      total,
      from: total > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, total),
    });

    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [sectionType, testimonialItems, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Keep stats panels accurate for FAQ items (not section count)
  useEffect(() => {
    if (sectionType !== 'faq') return;
    const totalFaqs = (faqItems || []).length;
    const activeFaqs = (faqItems || []).filter((f) => f.is_active === true).length;
    setStats({
      totalSections: totalFaqs,
      activeSections: activeFaqs,
      publishedSections: 0,
    });
  }, [sectionType, faqItems]);

  // Keep stats panels accurate for testimonial items (not section count)
  useEffect(() => {
    if (sectionType !== 'testimonials') return;
    const totalTestimonials = (testimonialItems || []).length;
    const activeTestimonials = (testimonialItems || []).filter((t) => t.is_active === true).length;
    setStats({
      totalSections: totalTestimonials,
      activeSections: activeTestimonials,
      publishedSections: 0,
    });
  }, [sectionType, testimonialItems]);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/product-collections?per_page=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.collections) {
          setCollections(data.collections);
        } else if (data.collections && Array.isArray(data.collections)) {
          setCollections(data.collections);
        }
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  }, [token, apiBaseUrl]);

  useEffect(() => {
    fetchAllSections();
    if (sectionType === 'product_grid') {
      fetchCollections();
    }
  }, [fetchAllSections, fetchCollections, sectionType]);

  // FAQ: keep a single permanent section and manage only FAQ items via a table+modal.
  useEffect(() => {
    const ensureFaqSection = async () => {
      if (sectionType !== 'faq') return;

      try {
        if (!allSections || allSections.length === 0) return;

        // Prefer the canonical FAQ with the fixed title; otherwise use the first FAQ section.
        const primaryFaq =
          allSections.find((s) => s.section_type === 'faq' && s.title === 'Frequently Asked Questions') ||
          allSections.find((s) => s.section_type === 'faq') ||
          null;

        if (primaryFaq) {
          setFaqSectionId(primaryFaq.id);
          const cfg = typeof primaryFaq.config === 'string'
            ? JSON.parse(primaryFaq.config || '{}')
            : (primaryFaq.config || {});
          setFaqItems(normalizeFaqItems(cfg.faqs));
          return;
        }

        // If none exist, create one (should be rare)
        const response = await fetch(`${apiBaseUrl}/landing-page-sections`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            section_type: 'faq',
            is_active: true,
            display_order: 7,
            config: JSON.stringify({ faqs: [], backgroundColor: '#F3F3F3', layout: 'accordion', allowMultipleOpen: false }),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || 'Failed to create FAQ section');
        }

        setFaqSectionId(data.section?.id || null);
        setFaqItems([]);
        fetchAllSections();
      } catch (e) {
        console.error('ensureFaqSection error:', e);
        toast.error(e.message || 'Unable to initialize FAQ section', { style: { zIndex: 100002 } });
      }
    };

    ensureFaqSection();
  }, [sectionType, allSections, apiBaseUrl, token, normalizeFaqItems, fetchAllSections]);

  // Testimonials: keep a single section and manage only testimonial items via a table+modal.
  useEffect(() => {
    const ensureTestimonialsSection = async () => {
      if (sectionType !== 'testimonials') return;

      try {
        if (!allSections || allSections.length === 0) return;

        const primaryTestimonials =
          allSections.find((s) => s.section_type === 'testimonials' && s.title === 'What Our Users Are Saying') ||
          allSections.find((s) => s.section_type === 'testimonials') ||
          null;

        if (primaryTestimonials) {
          setTestimonialSectionId(primaryTestimonials.id);
          const cfg = typeof primaryTestimonials.config === 'string'
            ? JSON.parse(primaryTestimonials.config || '{}')
            : (primaryTestimonials.config || {});
          setTestimonialItems(normalizeTestimonialItems(cfg.testimonials));
          return;
        }

        const response = await fetch(`${apiBaseUrl}/landing-page-sections`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            section_type: 'testimonials',
            is_active: true,
            display_order: 8,
            config: JSON.stringify({ testimonials: [], displayStyle: 'slider', autoRotate: true, backgroundColor: '#FFFFFF' }),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || 'Failed to create testimonials section');
        }

        setTestimonialSectionId(data.section?.id || null);
        setTestimonialItems([]);
        fetchAllSections();
      } catch (e) {
        console.error('ensureTestimonialsSection error:', e);
        toast.error(e.message || 'Unable to initialize testimonials section', { style: { zIndex: 100002 } });
      }
    };

    ensureTestimonialsSection();
  }, [sectionType, allSections, apiBaseUrl, token, normalizeTestimonialItems, fetchAllSections]);

  useEffect(() => {
    if (!initialLoading) {
      filterAndPaginateSections();
    }
  }, [filterAndPaginateSections, initialLoading]);

  const fetchSectionProducts = useCallback(async (sections) => {
    if (!sections || sections.length === 0 || !collections || collections.length === 0 || sectionType !== 'product_grid') {
      return;
    }

    const productsMap = {};
    
    for (const section of sections) {
      try {
        const collection = collections.find(c => 
          c.slug === section.source_value || 
          c.id?.toString() === section.source_value?.toString() ||
          c.id === section.source_value
        );

        if (collection) {
          const response = await fetch(`${apiBaseUrl}/product-collections/${collection.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.collection) {
              const collectionProducts = data.collection.products || [];
              const limitedProducts = collectionProducts.slice(0, section.product_count || 10);
              productsMap[section.id] = limitedProducts;
            } else {
              productsMap[section.id] = [];
            }
          } else {
            productsMap[section.id] = [];
          }
        } else {
          productsMap[section.id] = [];
        }
      } catch (error) {
        console.error(`Error fetching products for section ${section.id}:`, error);
        productsMap[section.id] = [];
      }
    }
    
    setSectionProducts(productsMap);
  }, [token, apiBaseUrl, collections, sectionType]);

  useEffect(() => {
    if (allSections.length > 0 && collections.length > 0 && !initialLoading && sectionType === 'product_grid') {
      fetchSectionProducts(allSections);
    }
  }, [allSections, collections, fetchSectionProducts, initialLoading, sectionType]);

  useEffect(() => {
    const setToastZIndex = () => {
      const toastContainers = document.querySelectorAll('.Toastify__toast-container');
      toastContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.style.setProperty('z-index', '100002', 'important');
          container.style.setProperty('position', 'fixed', 'important');
          const childElements = container.querySelectorAll('*');
          childElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.setProperty('z-index', '100002', 'important');
            }
          });
        }
      });
      
      const toasts = document.querySelectorAll('.Toastify__toast');
      toasts.forEach(toast => {
        if (toast instanceof HTMLElement) {
          toast.style.setProperty('z-index', '100002', 'important');
          if (toast.classList.contains('Toastify__toast--error')) {
            toast.style.setProperty('z-index', '100002', 'important');
            toast.style.setProperty('position', 'relative', 'important');
          }
        }
      });
    };

    setToastZIndex();
    
    const timeouts = [
      setTimeout(setToastZIndex, 10),
      setTimeout(setToastZIndex, 50),
      setTimeout(setToastZIndex, 100),
      setTimeout(setToastZIndex, 200),
      setTimeout(setToastZIndex, 500),
    ];
    
    const observer = new MutationObserver(() => {
      setToastZIndex();
    });
    const body = document.body;
    observer.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      observer.disconnect();
    };
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleNewSection = () => {
    // FAQ is a single permanent landing page block; don't allow creating multiple FAQ sections.
    if (sectionType === 'faq') {
      const initialForm = {
        question: '',
        answer: '',
        order: (faqItems.length || 0) + 1,
        is_active: true,
      };
      setEditingFaqItem(null);
      setFaqModalForm(initialForm);
      faqInitialFormRef.current = normalizeFaqForm(initialForm);
      setFaqTouched({ order: false, question: false, answer: false });
      setFaqSubmitted(false);
      setFaqClosing(false);
      setShowFaqItemModal(true);
      return;
    }

    if (sectionType === 'testimonials') {
      const initialForm = {
        content: '',
        name: '',
        role: '',
        rating: 5,
        order: (testimonialItems.length || 0) + 1,
        is_active: true,
        image: '',
      };
      setEditingTestimonialItem(null);
      setTestimonialModalForm(initialForm);
      testimonialInitialFormRef.current = normalizeTestimonialForm(initialForm);
      setTestimonialTouched({ order: false, name: false, content: false, rating: false });
      setTestimonialSubmitted(false);
      setTestimonialClosing(false);
      setShowTestimonialModal(true);
      return;
    }

    setEditingSection(null);
    setShowSectionForm(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setShowSectionForm(true);
  };

  const handleViewDetails = (section) => {
    setSelectedSection(section);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedSection(null);
  };

  const closeFaqModal = () => {
    setFaqClosing(true);
    setTimeout(() => {
      setShowFaqItemModal(false);
      setFaqClosing(false);
    }, 180);
  };

  const closeTestimonialModal = () => {
    setTestimonialClosing(true);
    setTimeout(() => {
      setShowTestimonialModal(false);
      setTestimonialClosing(false);
    }, 180);
  };

  const handleFaqCloseAttempt = async () => {
    if (faqSaving) return;
    if (isFaqDirty) {
      const result = await showAlert.confirm(
        'Unsaved Changes',
        'You have unsaved FAQ changes. Close without saving?',
        'Yes, Close',
        'Continue Editing'
      );
      if (!result.isConfirmed) return;
    }
    closeFaqModal();
  };

  const handleTestimonialCloseAttempt = async () => {
    if (testimonialSaving) return;
    if (isTestimonialDirty) {
      const result = await showAlert.confirm(
        'Unsaved Changes',
        'You have unsaved testimonial changes. Close without saving?',
        'Yes, Close',
        'Continue Editing'
      );
      if (!result.isConfirmed) return;
    }
    closeTestimonialModal();
  };

  useEffect(() => {
    if (!showFaqItemModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFaqCloseAttempt();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showFaqItemModal, handleFaqCloseAttempt]);

  useEffect(() => {
    if (!showTestimonialModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleTestimonialCloseAttempt();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showTestimonialModal, handleTestimonialCloseAttempt]);

  const handleDeleteSection = async (section) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes", {
        style: { zIndex: 100002 }
      });
      return;
    }

    const confirmation = await showAlert.confirm(
      "Delete Section",
      `Deleting "${section.title}" will remove it from the landing page. Continue?`,
      "Delete",
      "Cancel"
    );

    if (!confirmation.isConfirmed) return;

    setActionLock(true);
    setActionLoading(section.id);
    showAlert.processing("Deleting Section", "Removing section...");

    try {
      const response = await fetch(`${apiBaseUrl}/landing-page-sections/${section.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete section");
      }

      showAlert.close();
      toast.success("Section deleted successfully!", {
        style: { zIndex: 100002 }
      });
      setAllSections(prev => {
        const updatedSections = prev.filter(sec => sec.id !== section.id);
        const activeSections = updatedSections.filter(s => s.is_active === true).length;
        const publishedSections = updatedSections.filter(s => s.status === 'published').length;
        setStats({
          totalSections: updatedSections.length,
          activeSections: activeSections,
          publishedSections: publishedSections,
        });
        return updatedSections;
      });
    } catch (error) {
      console.error("Delete section error:", error);
      showAlert.close();
      requestAnimationFrame(() => {
        toast.error(error.message || "Unable to delete section", {
          style: { zIndex: 100002 }
        });
      });
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  const handlePublish = async (section) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes", {
        style: { zIndex: 100002 }
      });
      return;
    }

    setActionLock(true);
    setActionLoading(section.id);

    try {
      const response = await fetch(`${apiBaseUrl}/landing-page-sections/${section.id}/publish`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to publish section");
      }

      // Special message for hero sliders
      if (section.section_type === 'hero') {
        toast.success("Hero slider published successfully! Other hero sliders have been automatically deactivated.", {
          style: { zIndex: 100002 },
          autoClose: 5000, // Show for 5 seconds
        });
        // Refresh the list to show updated statuses of other hero sliders
        fetchAllSections();
      } else {
        toast.success("Section published successfully!", {
          style: { zIndex: 100002 }
        });
        setAllSections(prev => {
          const updated = prev.map(s => s.id === section.id ? { ...s, status: 'published', published_at: data.section?.published_at } : s);
          const publishedSections = updated.filter(s => s.status === 'published').length;
          setStats(prev => ({ ...prev, publishedSections }));
          return updated;
        });
      }
    } catch (error) {
      console.error("Publish section error:", error);
      toast.error(error.message || "Unable to publish section", {
        style: { zIndex: 100002 }
      });
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (section) => {
    if (actionLock) {
      toast.warning("Please wait until the current action completes", {
        style: { zIndex: 100002 }
      });
      return;
    }

    setActionLock(true);
    setActionLoading(section.id);

    try {
      const response = await fetch(`${apiBaseUrl}/landing-page-sections/${section.id}/unpublish`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to unpublish section");
      }

      toast.success("Section unpublished successfully!", {
        style: { zIndex: 100002 }
      });
      
      setAllSections(prev => {
        const updated = prev.map(s => s.id === section.id ? { ...s, status: 'draft' } : s);
        const publishedSections = updated.filter(s => s.status === 'published').length;
        setStats(prev => ({ ...prev, publishedSections }));
        return updated;
      });
    } catch (error) {
      console.error("Unpublish section error:", error);
      toast.error(error.message || "Unable to unpublish section", {
        style: { zIndex: 100002 }
      });
    } finally {
      setActionLock(false);
      setActionLoading(null);
    }
  };

  const isActionDisabled = (id = null) =>
    actionLock || (actionLoading && actionLoading !== id);

  const handleMoveUp = async (section, index) => {
    if (index === 0 || actionLock) return;

    const newOrder = [...allSections];
    const actualIndex = allSections.findIndex(s => s.id === section.id);
    if (actualIndex === 0) return;
    
    [newOrder[actualIndex], newOrder[actualIndex - 1]] = [newOrder[actualIndex - 1], newOrder[actualIndex]];

    await updateOrder(newOrder);
  };

  const handleMoveDown = async (section, index) => {
    if (index === allSections.length - 1 || actionLock) return;

    const newOrder = [...allSections];
    const actualIndex = allSections.findIndex(s => s.id === section.id);
    if (actualIndex === allSections.length - 1) return;
    
    [newOrder[actualIndex], newOrder[actualIndex + 1]] = [newOrder[actualIndex + 1], newOrder[actualIndex]];

    await updateOrder(newOrder);
  };

  const updateOrder = async (orderedSections) => {
    try {
      setActionLock(true);

      const sectionsData = orderedSections.map((section, index) => ({
        id: section.id,
        display_order: index + 1,
      }));

      const response = await fetch(`${apiBaseUrl}/landing-page-sections/order/update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ sections: sectionsData }),
      });

      if (response.ok) {
        toast.success('Section order updated successfully', {
          style: { zIndex: 100002 }
        });
        fetchAllSections();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update order', {
          style: { zIndex: 100002 }
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(`Error updating order: ${error.message}`, {
        style: { zIndex: 100002 }
      });
    } finally {
      setActionLock(false);
    }
  };

  const saveFaqItems = useCallback(async (nextItems, options = {}) => {
    if (!faqSectionId) return false;

    setActionLock(true);
    setActionLoading(faqSectionId);
    const {
      loadingTitle = 'Saving FAQ',
      loadingText = 'Please wait...',
      successMessage = 'FAQs saved',
    } = options;

    try {
      showAlert.processing(loadingTitle, loadingText, { zIndex: 100000 });
      const section = allSections.find((s) => s.id === faqSectionId) || null;
      const existingConfig = section?.config;
      const cfg = typeof existingConfig === 'string' ? JSON.parse(existingConfig || '{}') : (existingConfig || {});
      const updatedConfig = { ...cfg, faqs: nextItems };

      const response = await fetch(`${apiBaseUrl}/landing-page-sections/${faqSectionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section_type: 'faq',
          is_active: true,
          config: JSON.stringify(updatedConfig),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to save FAQs');
      }

      setFaqItems(nextItems);
      toast.success(successMessage, { style: { zIndex: 100002 } });
      fetchAllSections();
      return true;
    } catch (e) {
      console.error('saveFaqItems error:', e);
      toast.error(e.message || 'Failed to save FAQs', { style: { zIndex: 100002 } });
      return false;
    } finally {
      showAlert.close();
      setActionLock(false);
      setActionLoading(null);
    }
  }, [faqSectionId, allSections, apiBaseUrl, token, fetchAllSections]);

  const saveTestimonialItems = useCallback(async (nextItems, options = {}) => {
    if (!testimonialSectionId) return false;

    setActionLock(true);
    setActionLoading(testimonialSectionId);
    const {
      loadingTitle = 'Saving Testimonials',
      loadingText = 'Please wait...',
      successMessage = 'Testimonials saved',
    } = options;

    try {
      showAlert.processing(loadingTitle, loadingText, { zIndex: 100000 });
      const section = allSections.find((s) => s.id === testimonialSectionId) || null;
      const existingConfig = section?.config;
      const cfg = typeof existingConfig === 'string' ? JSON.parse(existingConfig || '{}') : (existingConfig || {});
      const updatedConfig = { ...cfg, testimonials: nextItems };

      const response = await fetch(`${apiBaseUrl}/landing-page-sections/${testimonialSectionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section_type: 'testimonials',
          is_active: true,
          config: JSON.stringify(updatedConfig),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to save testimonials');
      }

      setTestimonialItems(nextItems);
      toast.success(successMessage, { style: { zIndex: 100002 } });
      fetchAllSections();
      return true;
    } catch (e) {
      console.error('saveTestimonialItems error:', e);
      toast.error(e.message || 'Failed to save testimonials', { style: { zIndex: 100002 } });
      return false;
    } finally {
      showAlert.close();
      setActionLock(false);
      setActionLoading(null);
    }
  }, [testimonialSectionId, allSections, apiBaseUrl, token, fetchAllSections]);

  const handleSave = async () => {
    setShowSectionForm(false);
    setEditingSection(null);
    await fetchAllSections();
    if (sectionType === 'product_grid') {
      await fetchCollections();
    }
  };

  const startIndex = useMemo(() => {
    return (paginationMeta.current_page - 1) * itemsPerPage;
  }, [paginationMeta, itemsPerPage]);

  const getCollectionName = (section) => {
    if (!collections || collections.length === 0 || sectionType !== 'product_grid') {
      return 'N/A';
    }

    if (!section.source_value) {
      return 'No collection';
    }

    const collection = collections.find((c) => {
      if (c.slug === section.source_value) return true;
      if (c.id?.toString() === section.source_value?.toString()) return true;
      if (c.id === parseInt(section.source_value)) return true;
      if (c.name === section.source_value) return true;
      return false;
    });

    if (collection) {
      return collection.name || collection.title || `Collection ${collection.id}`;
    }

    return section.source_value;
  };

  const searchLabel = sectionType === 'faq'
    ? 'Search FAQs'
    : sectionType === 'testimonials'
      ? 'Search Testimonials'
      : 'Search Sections';

  const searchPlaceholder = sectionType === 'faq'
    ? 'Search by question or answer...'
    : sectionType === 'testimonials'
      ? 'Search by comment, author, or role...'
      : 'Search by title or description...';

  return (
    <div className={`container-fluid px-3 pt-0 pb-2 inventory-categories-container ${!loading ? 'fadeIn' : ''}`}>
      {loading ? (
        <LoadingSpinner text={`Loading ${config.label}...`} />
      ) : (
        <>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
        <div className="flex-grow-1 mb-2 mb-md-0">
          <h1
            className="h4 mb-1 fw-bold"
            style={{ color: "var(--text-primary)" }}
          >
            <i className={config.icon + " me-2"}></i>
            {config.label}
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            {config.description}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-primary text-white"
            onClick={handleNewSection}
            disabled={isActionDisabled()}
            style={{
              transition: "all 0.2s ease-in-out",
              borderWidth: "2px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            <i className="fas fa-plus me-1" />
            {sectionType === 'faq' ? 'Add FAQ' : sectionType === 'testimonials' ? 'Add Testimonial' : 'New Section'}
          </button>
          <button
            className="btn btn-sm"
            onClick={fetchAllSections}
            disabled={loading || isActionDisabled()}
            style={{
              transition: "all 0.2s ease-in-out",
              border: "2px solid var(--primary-color)",
              color: "var(--primary-color)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                e.target.style.backgroundColor = "var(--primary-color)";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "var(--primary-color)";
            }}
          >
            <i className="fas fa-sync-alt me-1" />
            Refresh
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div 
            className="card stats-card h-100 shadow-sm"
            style={{ 
              border: '1px solid rgba(0, 0, 0, 0.125)',
              borderRadius: '0.375rem'
            }}
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div
                    className="text-xs fw-semibold text-uppercase mb-1"
                    style={{ color: "var(--primary-color)" }}
                  >
                    Total Sections
                  </div>
                  <div
                    className="h4 mb-0 fw-bold"
                    style={{ color: "var(--primary-color)" }}
                  >
                    {initialLoading ? '...' : stats.totalSections}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className={config.icon + " fa-2x"}
                    style={{
                      color: "var(--primary-light)",
                      opacity: 0.7,
                    }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Hide Active Sections and Published stats for hero slider (only one can be active/published) */}
        {sectionType !== 'hero' && (
          <>
            <div className="col-6 col-md-3">
              <div 
                className="card stats-card h-100 shadow-sm"
                style={{ 
                  border: '1px solid rgba(0, 0, 0, 0.125)',
                  borderRadius: '0.375rem'
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div
                        className="text-xs fw-semibold text-uppercase mb-1"
                        style={{ color: "var(--accent-color)" }}
                      >
                        Active Sections
                      </div>
                      <div
                        className="h4 mb-0 fw-bold"
                        style={{ color: "var(--accent-color)" }}
                      >
                        {initialLoading ? '...' : stats.activeSections}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i
                        className="fas fa-check-circle fa-2x"
                        style={{
                          color: "var(--accent-light)",
                          opacity: 0.7,
                        }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className="card border-0 shadow-sm mb-3"
        style={{ backgroundColor: "var(--background-white)" }}
      >
        <div className="card-body p-3">
          <div className="row g-2 align-items-start">
            <div className="col-md-4">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {searchLabel}
              </label>
              <div className="input-group input-group-sm">
                <span
                  className="input-group-text"
                  style={{
                    backgroundColor: "var(--background-light)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                />
                {searchTerm && (
                  <button
                    className="btn btn-sm clear-search-btn"
                    type="button"
                    onClick={() => setSearchTerm("")}
                    disabled={loading || isActionDisabled()}
                    style={{
                      color: "#6c757d",
                      backgroundColor: "transparent",
                      border: "none",
                      padding: "0.25rem 0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.color = "#495057";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = "#6c757d";
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            {/* Hide status filter for hero slider (only one can be active/published) */}
            {sectionType !== 'hero' && (
              <div className="col-md-3">
                <label
                  className="form-label small fw-semibold mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Filter by Status
                </label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            <div className="col-md-2">
              <label
                className="form-label small fw-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Per Page
              </label>
              <select
                className="form-select form-select-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {sectionType === 'faq' && (
        <div
          className="card border-0 shadow-sm mb-3"
          style={{ backgroundColor: "var(--background-white)" }}
        >
          <div
            className="card-header border-bottom-0 py-2"
            style={{
              background: "var(--topbar-bg)",
              color: "var(--topbar-text)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0 fw-semibold text-white">
                <i className="fas fa-question-circle me-2"></i>
                Frequently Asked Questions
                {!loading && (
                  <small className="opacity-75 ms-2 text-white">
                    ({faqPageMeta.total} total)
                  </small>
                )}
              </h5>
            </div>
          </div>

          <div className="card-body p-0">
            {faqRows.length === 0 ? (
              <div className="p-3 text-muted small">
                No FAQs found. Click <strong>Add FAQ</strong> to create one.
              </div>
            ) : (
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table table-striped table-hover mb-0" style={{ minWidth: '800px', tableLayout: 'fixed', width: '100%' }}>
                  <thead style={{ backgroundColor: "var(--background-light)" }}>
                    <tr>
                      <th className="text-center small fw-semibold" style={{ width: "4%" }}>
                        #
                      </th>
                      <th className="text-center small fw-semibold" style={{ width: "120px", minWidth: "120px" }}>
                        Actions
                      </th>
                      <th className="small fw-semibold" style={{ width: "320px", minWidth: "320px" }}>
                        Question
                      </th>
                      <th className="small fw-semibold" style={{ width: "340px", minWidth: "340px" }}>
                        Answer
                      </th>
                      <th className="small fw-semibold text-center" style={{ width: "100px", minWidth: "100px" }}>
                        Status
                      </th>
                      <th className="text-center small fw-semibold" style={{ width: "90px", minWidth: "90px" }}>
                        Order
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqRows.map((item, index) => (
                      <tr key={item.id} className="align-middle" style={{ height: '48px', whiteSpace: 'nowrap' }}>
                        <td
                          className="text-center fw-bold"
                          style={{ 
                            color: "var(--text-primary)",
                            width: "40px",
                            minWidth: "40px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {(faqPageMeta.current_page - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="text-center" style={{ width: "120px", minWidth: "120px", padding: "0.5rem" }}>
                          <div className="d-flex justify-content-center gap-1" style={{ gap: "0.25rem" }}>
                            <button
                              className="btn btn-success btn-sm text-white"
                              onClick={() => {
                                const initialForm = {
                                  question: item.question || '',
                                  answer: item.answer || '',
                                  order: item.order || 1,
                                  is_active: item.is_active !== false,
                                };
                                setEditingFaqItem(item);
                                setFaqModalForm(initialForm);
                                faqInitialFormRef.current = normalizeFaqForm(initialForm);
                                setFaqTouched({ order: false, question: false, answer: false });
                                setFaqSubmitted(false);
                                setFaqClosing(false);
                                setShowFaqItemModal(true);
                              }}
                              disabled={isActionDisabled() || faqSaving || faqDeletingId === item.id}
                              title="Edit FAQ"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                transition: "all 0.2s ease-in-out",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }
                              }}
                            >
                              <FaEdit style={{ fontSize: "0.875rem" }} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm text-white"
                              onClick={async () => {
                                if (faqSaving || faqDeletingId) return;
                                const confirmation = await showAlert.confirm(
                                  "Delete FAQ",
                                  "Remove this FAQ item?",
                                  "Delete",
                                  "Cancel"
                                );
                                if (!confirmation.isConfirmed) return;
                                setFaqDeletingId(item.id);
                                try {
                                  const ok = await saveFaqItems(faqItems.filter((f) => f.id !== item.id), {
                                    loadingTitle: 'Deleting FAQ',
                                    loadingText: 'Removing FAQ item...',
                                    successMessage: 'FAQ deleted',
                                  });
                                } finally {
                                  setFaqDeletingId(null);
                                }
                              }}
                              disabled={isActionDisabled() || faqSaving || faqDeletingId === item.id}
                              title="Delete FAQ"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                transition: "all 0.2s ease-in-out",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }
                              }}
                            >
                              {faqDeletingId === item.id ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : (
                                <FaTrash style={{ fontSize: "0.875rem" }} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td style={{ overflow: 'hidden' }}>
                          <div className="fw-semibold text-truncate" title={item.question}>
                            {item.question}
                          </div>
                        </td>
                        <td style={{ overflow: 'hidden' }}>
                          <div className="text-muted small text-truncate" title={item.answer}>
                            {item.answer}
                          </div>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-center fw-bold" style={{ color: "var(--text-primary)" }}>
                          {item.order}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && faqPageMeta.total > 0 && (
            <div className="card-footer bg-white border-top px-3 py-2">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <div className="text-center text-md-start">
                  <small style={{ color: "var(--text-muted)" }}>
                    Showing{" "}
                    <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                      {faqPageMeta.from}-{faqPageMeta.to}
                    </span>{" "}
                    of{" "}
                    <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                      {faqPageMeta.total}
                    </span>{" "}
                    FAQs
                  </small>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={faqPageMeta.current_page === 1 || isActionDisabled()}
                    style={{
                      transition: "all 0.2s ease-in-out",
                      border: "2px solid var(--primary-color)",
                      color: "var(--primary-color)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                        e.target.style.backgroundColor = "var(--primary-color)";
                        e.target.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "var(--primary-color)";
                    }}
                  >
                    <i className="fas fa-chevron-left me-1"></i>
                    Previous
                  </button>

                  <div className="d-md-none">
                    <small style={{ color: "var(--text-muted)" }}>
                      Page {faqPageMeta.current_page} of {faqPageMeta.last_page}
                    </small>
                  </div>

                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, faqPageMeta.last_page))}
                    disabled={faqPageMeta.current_page === faqPageMeta.last_page || isActionDisabled()}
                    style={{
                      transition: "all 0.2s ease-in-out",
                      border: "2px solid var(--primary-color)",
                      color: "var(--primary-color)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                        e.target.style.backgroundColor = "var(--primary-color)";
                        e.target.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "var(--primary-color)";
                    }}
                  >
                    Next
                    <i className="fas fa-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {sectionType === 'testimonials' && (
        <div
          className="card border-0 shadow-sm mb-3"
          style={{ backgroundColor: "var(--background-white)" }}
        >
          <div
            className="card-header border-bottom-0 py-2"
            style={{
              background: "var(--topbar-bg)",
              color: "var(--topbar-text)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0 fw-semibold text-white">
                <i className="fas fa-star me-2"></i>
                Testimonials
                {!loading && (
                  <small className="opacity-75 ms-2 text-white">
                    ({testimonialPageMeta.total} total)
                  </small>
                )}
              </h5>
            </div>
          </div>

          <div className="card-body p-0">
            {testimonialRows.length === 0 ? (
              <div className="p-3 text-muted small">
                No testimonials found. Click <strong>Add Testimonial</strong> to create one.
              </div>
            ) : (
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table table-striped table-hover mb-0" style={{ minWidth: '900px', tableLayout: 'fixed', width: '100%' }}>
                  <thead style={{ backgroundColor: "var(--background-light)" }}>
                    <tr>
                      <th className="text-center small fw-semibold" style={{ width: "4%" }}>
                        #
                      </th>
                      <th className="text-center small fw-semibold" style={{ width: "120px", minWidth: "120px" }}>
                        Actions
                      </th>
                      <th className="small fw-semibold" style={{ width: "360px", minWidth: "360px" }}>
                        Comment
                      </th>
                      <th className="small fw-semibold" style={{ width: "220px", minWidth: "220px" }}>
                        Author
                      </th>
                      <th className="small fw-semibold text-center" style={{ width: "90px", minWidth: "90px" }}>
                        Rating
                      </th>
                      <th className="small fw-semibold text-center" style={{ width: "100px", minWidth: "100px" }}>
                        Status
                      </th>
                      <th className="text-center small fw-semibold" style={{ width: "90px", minWidth: "90px" }}>
                        Order
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonialRows.map((item, index) => (
                      <tr key={item.id} className="align-middle" style={{ height: '48px', whiteSpace: 'nowrap' }}>
                        <td
                          className="text-center fw-bold"
                          style={{ 
                            color: "var(--text-primary)",
                            width: "40px",
                            minWidth: "40px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {(testimonialPageMeta.current_page - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="text-center" style={{ width: "120px", minWidth: "120px", padding: "0.5rem" }}>
                          <div className="d-flex justify-content-center gap-1" style={{ gap: "0.25rem" }}>
                            <button
                              className="btn btn-success btn-sm text-white"
                              onClick={() => {
                                const initialForm = {
                                  content: item.content || '',
                                  name: item.name || '',
                                  role: item.role || '',
                                  rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : 5,
                                  order: item.order || 1,
                                  is_active: item.is_active !== false,
                                  image: item.image || '',
                                };
                                setEditingTestimonialItem(item);
                                setTestimonialModalForm(initialForm);
                                testimonialInitialFormRef.current = normalizeTestimonialForm(initialForm);
                                setTestimonialTouched({ order: false, name: false, content: false, rating: false });
                                setTestimonialSubmitted(false);
                                setTestimonialClosing(false);
                                setShowTestimonialModal(true);
                              }}
                              disabled={isActionDisabled() || testimonialSaving || testimonialDeletingId === item.id}
                              title="Edit Testimonial"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                transition: "all 0.2s ease-in-out",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }
                              }}
                            >
                              <FaEdit style={{ fontSize: "0.875rem" }} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm text-white"
                              onClick={async () => {
                                if (testimonialSaving || testimonialDeletingId) return;
                                const confirmation = await showAlert.confirm(
                                  "Delete Testimonial",
                                  "Remove this testimonial?",
                                  "Delete",
                                  "Cancel"
                                );
                                if (!confirmation.isConfirmed) return;
                                setTestimonialDeletingId(item.id);
                                try {
                                  await saveTestimonialItems(testimonialItems.filter((t) => t.id !== item.id), {
                                    loadingTitle: 'Deleting Testimonial',
                                    loadingText: 'Removing testimonial...',
                                    successMessage: 'Testimonial deleted',
                                  });
                                } finally {
                                  setTestimonialDeletingId(null);
                                }
                              }}
                              disabled={isActionDisabled() || testimonialSaving || testimonialDeletingId === item.id}
                              title="Delete Testimonial"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                transition: "all 0.2s ease-in-out",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }
                              }}
                            >
                              {testimonialDeletingId === item.id ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : (
                                <FaTrash style={{ fontSize: "0.875rem" }} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td style={{ overflow: 'hidden' }}>
                          <div className="fw-semibold text-truncate" title={item.content}>
                            {item.content}
                          </div>
                        </td>
                        <td style={{ overflow: 'hidden' }}>
                          <div className="fw-semibold text-truncate" title={item.name}>
                            {item.name}
                          </div>
                          {item.role && (
                            <div className="text-muted small text-truncate" title={item.role}>
                              {item.role}
                            </div>
                          )}
                        </td>
                        <td className="text-center fw-bold" style={{ color: "var(--text-primary)" }}>
                          {Number.isFinite(Number(item.rating)) ? Number(item.rating) : 5}
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-center fw-bold" style={{ color: "var(--text-primary)" }}>
                          {item.order}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && testimonialPageMeta.total > 0 && (
            <div className="card-footer bg-white border-top px-3 py-2">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <div className="text-center text-md-start">
                  <small style={{ color: "var(--text-muted)" }}>
                    Showing{" "}
                    <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                      {testimonialPageMeta.from}-{testimonialPageMeta.to}
                    </span>{" "}
                    of{" "}
                    <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                      {testimonialPageMeta.total}
                    </span>{" "}
                    testimonials
                  </small>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={testimonialPageMeta.current_page === 1 || isActionDisabled()}
                    style={{
                      transition: "all 0.2s ease-in-out",
                      border: "2px solid var(--primary-color)",
                      color: "var(--primary-color)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                        e.target.style.backgroundColor = "var(--primary-color)";
                        e.target.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "var(--primary-color)";
                    }}
                  >
                    <i className="fas fa-chevron-left me-1"></i>
                    Previous
                  </button>

                  <div className="d-md-none">
                    <small style={{ color: "var(--text-muted)" }}>
                      Page {testimonialPageMeta.current_page} of {testimonialPageMeta.last_page}
                    </small>
                  </div>

                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, testimonialPageMeta.last_page))}
                    disabled={testimonialPageMeta.current_page === testimonialPageMeta.last_page || isActionDisabled()}
                    style={{
                      transition: "all 0.2s ease-in-out",
                      border: "2px solid var(--primary-color)",
                      color: "var(--primary-color)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                        e.target.style.backgroundColor = "var(--primary-color)";
                        e.target.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "var(--primary-color)";
                    }}
                  >
                    Next
                    <i className="fas fa-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {sectionType !== 'faq' && sectionType !== 'testimonials' && (
      <div
        className="card border-0 shadow-sm"
        style={{ backgroundColor: "var(--background-white)" }}
      >
        <div
          className="card-header border-bottom-0 py-2"
          style={{
            background: "var(--topbar-bg)",
            color: "var(--topbar-text)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0 fw-semibold text-white">
              <i className={config.icon + " me-2"}></i>
              {config.label} Catalog
              {!loading && (
                <small className="opacity-75 ms-2 text-white">
                  ({paginationMeta.total} total)
                </small>
              )}
            </h5>
          </div>
        </div>
        <div className="card-body p-0">
          {sections.length === 0 ? (
            <EmptyState
              onAddSection={handleNewSection}
              isActionDisabled={isActionDisabled}
              hasFilters={!!(searchTerm || statusFilter)}
              icon={config.icon}
              label={config.label}
            />
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="table table-striped table-hover mb-0" style={{ minWidth: '800px', tableLayout: 'fixed', width: '100%' }}>
                <thead style={{ backgroundColor: "var(--background-light)" }}>
                  <tr>
                    <th
                      className="text-center small fw-semibold"
                      style={{ width: "4%" }}
                    >
                      #
                    </th>
                    <th
                      className="text-center small fw-semibold"
                      style={{ width: "120px", minWidth: "120px" }}
                    >
                      Actions
                    </th>
                    <th className="small fw-semibold" style={{ width: "250px", minWidth: "250px" }}>
                      Title
                    </th>
                    {sectionType === 'product_grid' && (
                      <th className="small fw-semibold text-center" style={{ width: "150px", minWidth: "150px" }}>Collection</th>
                    )}
                    <th className="small fw-semibold text-center" style={{ width: "100px", minWidth: "100px" }}>Status</th>
                    {/* Show Slider Details column for hero slider */}
                    {sectionType === 'hero' && (
                      <th className="small fw-semibold text-center" style={{ width: "250px", minWidth: "250px" }}>Slider Details</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section, index) => {
                    const actualIndex = allSections.findIndex(s => s.id === section.id);
                    return (
                      <tr key={section.id} className="align-middle" style={{ height: '48px', whiteSpace: 'nowrap' }}>
                        <td
                          className="text-center fw-bold"
                          style={{ 
                            color: "var(--text-primary)",
                            width: "40px",
                            minWidth: "40px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {startIndex + index + 1}
                        </td>
                        <td className="text-center" style={{ width: "120px", minWidth: "120px", whiteSpace: "nowrap", padding: "0.5rem" }}>
                          <div className="d-flex justify-content-center gap-1" style={{ gap: "0.25rem" }}>
                            <button
                              className="btn btn-info btn-sm text-white"
                              onClick={() => handleViewDetails(section)}
                              disabled={isActionDisabled(section.id)}
                              title="View Details"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                transition: "all 0.2s ease-in-out",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow =
                                    "0 4px 8px rgba(0,0,0,0.2)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }
                              }}
                            >
                              <FaEye style={{ fontSize: "0.875rem" }} />
                            </button>
                            <button
                              className="btn btn-success btn-sm text-white"
                              onClick={() => handleEditSection(section)}
                              disabled={isActionDisabled(section.id)}
                              title="Edit Section"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                transition: "all 0.2s ease-in-out",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow =
                                    "0 4px 8px rgba(0,0,0,0.2)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!e.target.disabled) {
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }
                              }}
                            >
                              {actionLoading === section.id ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                ></span>
                              ) : (
                                <FaEdit style={{ fontSize: "0.875rem" }} />
                              )}
                            </button>
                            {sectionType !== 'faq' && (
                              <button
                                className="btn btn-danger btn-sm text-white"
                                onClick={() => handleDeleteSection(section)}
                                disabled={isActionDisabled(section.id)}
                                title="Delete Section"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "6px",
                                  transition: "all 0.2s ease-in-out",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onMouseEnter={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = "translateY(-1px)";
                                    e.target.style.boxShadow =
                                      "0 4px 8px rgba(0,0,0,0.2)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!e.target.disabled) {
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "none";
                                  }
                                }}
                              >
                                {actionLoading === section.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <FaTrash style={{ fontSize: "0.875rem" }} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="title-cell" style={{ maxWidth: "250px", overflow: "hidden" }}>
                          <div
                            className="fw-medium title-text"
                            style={{
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={section.title}
                          >
                            {section.title}
                          </div>
                          {section.description && (
                            <div
                              className="small"
                              style={{
                                color: "var(--text-muted)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={section.description}
                            >
                              {section.description}
                            </div>
                          )}
                        </td>
                        {sectionType === 'product_grid' && (
                          <td className="text-center" style={{ width: "150px", minWidth: "150px", overflow: "hidden", whiteSpace: "nowrap" }}>
                            <span 
                              className="badge bg-info"
                              style={{
                                color: '#fff',
                                textDecoration: 'none',
                                fontWeight: '500',
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.5rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "inline-block",
                                maxWidth: "100%"
                              }}
                              title={getCollectionName(section)}
                            >
                              {getCollectionName(section)}
                            </span>
                          </td>
                        )}
                        <td className="text-center" style={{ width: "100px", minWidth: "100px", whiteSpace: "nowrap" }}>
                          <span
                            className={`badge ${section.is_active ? 'bg-success' : 'bg-secondary'}`}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap" }}
                          >
                            {section.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {/* Show Slider Details column for hero slider */}
                        {sectionType === 'hero' && (
                          <td className="text-start slider-details-cell" style={{ 
                            fontSize: '0.875rem',
                            width: "250px",
                            minWidth: "250px",
                            overflow: "hidden",
                            whiteSpace: "nowrap"
                          }}>
                            <div className="d-flex flex-row align-items-center gap-2 slider-details-content" style={{ flexWrap: "nowrap" }}>
                              <div className="slider-slides-info" style={{ whiteSpace: "nowrap" }}>
                                <strong>Slides:</strong>{' '}
                                <span className="badge bg-info" style={{ fontSize: "0.7rem", padding: "0.2rem 0.4rem" }}>
                                  {section.config?.slides?.length || 0}
                                </span>
                              </div>
                              <div className="d-flex flex-wrap gap-1 slider-features" style={{ fontSize: '0.7rem', flexWrap: "nowrap" }}>
                                {section.config?.autoplay !== false && (
                                  <span className="badge bg-success" style={{ fontSize: "0.65rem", padding: "0.15rem 0.3rem" }}>
                                    <i className="fas fa-play" style={{ fontSize: "0.6rem", marginRight: "0.15rem" }}></i>Auto
                                  </span>
                                )}
                                {section.config?.showNavigation !== false && (
                                  <span className="badge bg-primary" style={{ fontSize: "0.65rem", padding: "0.15rem 0.3rem" }}>
                                    <i className="fas fa-arrows-alt" style={{ fontSize: "0.6rem", marginRight: "0.15rem" }}></i>Nav
                                  </span>
                                )}
                                {section.config?.showPagination !== false && (
                                  <span className="badge bg-secondary" style={{ fontSize: "0.65rem", padding: "0.15rem 0.3rem" }}>
                                    <i className="fas fa-circle" style={{ fontSize: "0.6rem", marginRight: "0.15rem" }}></i>Pag
                                  </span>
                                )}
                                {section.config?.autoplayDelay && (
                                  <span className="badge bg-warning text-dark" style={{ fontSize: "0.65rem", padding: "0.15rem 0.3rem" }}>
                                    <i className="fas fa-clock" style={{ fontSize: "0.6rem", marginRight: "0.15rem" }}></i>
                                    {(section.config.autoplayDelay / 1000).toFixed(1)}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!loading && sections.length > 0 && (
          <div className="card-footer bg-white border-top px-3 py-2">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
              <div className="text-center text-md-start">
                <small style={{ color: "var(--text-muted)" }}>
                  Showing{" "}
                  <span
                    className="fw-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {paginationMeta.from || startIndex + 1}-
                    {paginationMeta.to ||
                      Math.min(
                        startIndex + sections.length,
                        paginationMeta.total
                      )}
                  </span>{" "}
                  of{" "}
                  <span
                    className="fw-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {paginationMeta.total}
                  </span>{" "}
                  sections
                </small>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={
                    paginationMeta.current_page === 1 || isActionDisabled()
                  }
                  style={{
                    transition: "all 0.2s ease-in-out",
                    border: "2px solid var(--primary-color)",
                    color: "var(--primary-color)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                      e.target.style.backgroundColor = "var(--primary-color)";
                      e.target.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "var(--primary-color)";
                  }}
                >
                  <i className="fas fa-chevron-left me-1"></i>
                  Previous
                </button>

                <div className="d-none d-md-flex gap-1">
                  {(() => {
                    let pages = [];
                    const maxVisiblePages = 5;
                    const totalPages = paginationMeta.last_page;

                    if (totalPages <= maxVisiblePages) {
                      pages = Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                      );
                    } else {
                      pages.push(1);
                      let start = Math.max(2, paginationMeta.current_page - 1);
                      let end = Math.min(
                        totalPages - 1,
                        paginationMeta.current_page + 1
                      );

                      if (paginationMeta.current_page <= 2) {
                        end = 4;
                      } else if (
                        paginationMeta.current_page >=
                        totalPages - 1
                      ) {
                        start = totalPages - 3;
                      }

                      if (start > 2) {
                        pages.push("...");
                      }

                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      if (end < totalPages - 1) {
                        pages.push("...");
                      }

                      if (totalPages > 1) {
                        pages.push(totalPages);
                      }
                    }

                    return pages.map((page, index) => (
                      <button
                        key={index}
                        className="btn btn-sm"
                        onClick={() => page !== "..." && setCurrentPage(page)}
                        disabled={page === "..." || isActionDisabled()}
                        style={{
                          transition: "all 0.2s ease-in-out",
                          border: `2px solid ${
                            paginationMeta.current_page === page
                              ? "var(--primary-color)"
                              : "var(--input-border)"
                          }`,
                          color:
                            paginationMeta.current_page === page
                              ? "white"
                              : "var(--text-primary)",
                          backgroundColor:
                            paginationMeta.current_page === page
                              ? "var(--primary-color)"
                              : "transparent",
                          minWidth: "40px",
                        }}
                        onMouseEnter={(e) => {
                          if (
                            !e.target.disabled &&
                            paginationMeta.current_page !== page
                          ) {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow =
                              "0 2px 4px rgba(0,0,0,0.1)";
                            e.target.style.backgroundColor =
                              "var(--primary-light)";
                            e.target.style.color = "var(--text-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (
                            !e.target.disabled &&
                            paginationMeta.current_page !== page
                          ) {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "var(--text-primary)";
                          }
                        }}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>

                <div className="d-md-none">
                  <small style={{ color: "var(--text-muted)" }}>
                    Page {paginationMeta.current_page} of{" "}
                    {paginationMeta.last_page}
                  </small>
                </div>

                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, paginationMeta.last_page)
                    )
                  }
                  disabled={
                    paginationMeta.current_page === paginationMeta.last_page ||
                    isActionDisabled()
                  }
                  style={{
                    transition: "all 0.2s ease-in-out",
                    border: "2px solid var(--primary-color)",
                    color: "var(--primary-color)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                      e.target.style.backgroundColor = "var(--primary-color)";
                      e.target.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "var(--primary-color)";
                  }}
                >
                  Next
                  <i className="fas fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {showSectionForm && sectionType !== 'faq' && sectionType !== 'testimonials' && (
        <LandingPageSectionFormModal
          isOpen={showSectionForm}
          onClose={() => {
            setShowSectionForm(false);
            setEditingSection(null);
          }}
          onSave={handleSave}
          section={editingSection}
          collections={collections}
          existingSections={allSections}
          defaultSectionType={sectionType}
        />
      )}

      {showFaqItemModal && sectionType === 'faq' && (
        <Portal>
          <div
            className={`modal fade show d-block modal-backdrop-animation ${faqClosing ? 'exit' : ''}`}
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.6)',
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
            onClick={() => {
              handleFaqCloseAttempt();
            }}
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 10000 }} onClick={(e) => e.stopPropagation()}>
              <div
                className={`modal-content border-0 modal-content-animation ${faqClosing ? 'exit' : ''}`}
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 10000,
                }}
              >
                <div className="modal-header border-0 text-white modal-smooth" style={{ backgroundColor: 'var(--primary-color)' }}>
                  <h5 className="modal-title fw-bold">
                    <i className={`fas ${editingFaqItem ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                    {editingFaqItem ? 'Edit FAQ' : 'Create New FAQ'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white btn-smooth"
                    onClick={() => {
                      handleFaqCloseAttempt();
                    }}
                    aria-label="Close"
                    disabled={faqSaving}
                  />
                </div>
                <div
                  className="modal-body modal-smooth"
                  style={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: '#f8f9fa',
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Order <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control modal-smooth ${((faqSubmitted || faqTouched.order) && ((!Number.isFinite(Number(faqModalForm.order)) || Number(faqModalForm.order) < 1) || (Number.isFinite(Number(faqModalForm.order)) && Number(faqModalForm.order) >= 1 && isDuplicateOrder(faqModalForm.order, editingFaqItem?.id)))) ? 'is-invalid' : ''}`}
                        value={faqModalForm.order}
                        min={1}
                        onChange={(e) => {
                          setFaqTouched((p) => ({ ...p, order: true }));
                          setFaqModalForm((p) => ({ ...p, order: Number(e.target.value || 1) }));
                        }}
                      />
                      {(faqSubmitted || faqTouched.order) && (!Number.isFinite(Number(faqModalForm.order)) || Number(faqModalForm.order) < 1) && (
                        <div className="invalid-feedback">Order must be at least 1.</div>
                      )}
                      {(faqSubmitted || faqTouched.order) && Number.isFinite(Number(faqModalForm.order)) && Number(faqModalForm.order) >= 1 && isDuplicateOrder(faqModalForm.order, editingFaqItem?.id) && (
                        <div className="invalid-feedback">Order is already used.</div>
                      )}
                    </div>
                    <div className="col-md-9 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={faqModalForm.is_active}
                          onChange={(e) => setFaqModalForm((p) => ({ ...p, is_active: e.target.checked }))}
                          id="faqItemActive"
                        />
                        <label className="form-check-label" htmlFor="faqItemActive">
                          Active
                        </label>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Question <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control modal-smooth ${((faqSubmitted || faqTouched.question) && !faqModalForm.question.trim()) ? 'is-invalid' : ''}`}
                        value={faqModalForm.question}
                        onChange={(e) => {
                          setFaqTouched((p) => ({ ...p, question: true }));
                          setFaqModalForm((p) => ({ ...p, question: e.target.value }));
                        }}
                        placeholder="Enter the question..."
                      />
                      {(faqSubmitted || faqTouched.question) && !faqModalForm.question.trim() && (
                        <div className="invalid-feedback">Question is required.</div>
                      )}
                    </div>

                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Answer <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control modal-smooth ${((faqSubmitted || faqTouched.answer) && !faqModalForm.answer.trim()) ? 'is-invalid' : ''}`}
                        rows={4}
                        value={faqModalForm.answer}
                        onChange={(e) => {
                          setFaqTouched((p) => ({ ...p, answer: true }));
                          setFaqModalForm((p) => ({ ...p, answer: e.target.value }));
                        }}
                        placeholder="Enter the answer..."
                      />
                      {(faqSubmitted || faqTouched.answer) && !faqModalForm.answer.trim() && (
                        <div className="invalid-feedback">Answer is required.</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top bg-white modal-smooth">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-smooth"
                    onClick={() => {
                      handleFaqCloseAttempt();
                    }}
                    disabled={faqSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-smooth"
                    onClick={async () => {
                      if (faqSaving) return;
                      setFaqSaving(true);
                      setFaqSubmitted(true);
                      const orderValue = Number(faqModalForm.order || 1);
                      if (!Number.isFinite(orderValue) || orderValue < 1) {
                        toast.error('Order must be a number greater than 0');
                        setFaqSaving(false);
                        return;
                      }
                      if (isDuplicateOrder(orderValue, editingFaqItem?.id)) {
                        toast.error('Order value is already used by another FAQ');
                        setFaqSaving(false);
                        return;
                      }
                      if (!faqModalForm.question.trim() || !faqModalForm.answer.trim()) {
                        toast.error('Question and Answer are required');
                        setFaqSaving(false);
                        return;
                      }

                      const base = {
                        question: faqModalForm.question.trim(),
                        answer: faqModalForm.answer.trim(),
                        order: orderValue,
                        is_active: faqModalForm.is_active,
                      };

                      const next = editingFaqItem
                        ? faqItems.map((f) => (f.id === editingFaqItem.id ? { ...f, ...base } : f))
                        : [...faqItems, { id: `faq-${Date.now()}-${Math.random()}`, ...base }];

                      const ok = await saveFaqItems(next, {
                        loadingTitle: editingFaqItem ? 'Updating FAQ' : 'Saving FAQ',
                        loadingText: 'Please wait...',
                        successMessage: editingFaqItem ? 'FAQ updated' : 'FAQ created',
                      });
                      if (ok) {
                        setFaqClosing(true);
                        setTimeout(() => {
                          setShowFaqItemModal(false);
                          setFaqClosing(false);
                        }, 180);
                        setEditingFaqItem(null);
                      }
                      setFaqSaving(false);
                    }}
                    disabled={faqSaving}
                  >
                    {faqSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>{editingFaqItem ? 'Update FAQ' : 'Save FAQ'}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showTestimonialModal && sectionType === 'testimonials' && (
        <Portal>
          <div
            className={`modal fade show d-block modal-backdrop-animation ${testimonialClosing ? 'exit' : ''}`}
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.6)',
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
            onClick={() => {
              handleTestimonialCloseAttempt();
            }}
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 10000 }} onClick={(e) => e.stopPropagation()}>
              <div
                className={`modal-content border-0 modal-content-animation ${testimonialClosing ? 'exit' : ''}`}
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 10000,
                }}
              >
                <div className="modal-header border-0 text-white modal-smooth" style={{ backgroundColor: 'var(--primary-color)' }}>
                  <h5 className="modal-title fw-bold">
                    <i className={`fas ${editingTestimonialItem ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                    {editingTestimonialItem ? 'Edit Testimonial' : 'Create New Testimonial'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white btn-smooth"
                    onClick={() => {
                      handleTestimonialCloseAttempt();
                    }}
                    aria-label="Close"
                    disabled={testimonialSaving}
                  />
                </div>
                <div
                  className="modal-body modal-smooth"
                  style={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: '#f8f9fa',
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Order <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control modal-smooth ${((testimonialSubmitted || testimonialTouched.order) && ((!Number.isFinite(Number(testimonialModalForm.order)) || Number(testimonialModalForm.order) < 1) || (Number.isFinite(Number(testimonialModalForm.order)) && Number(testimonialModalForm.order) >= 1 && isDuplicateTestimonialOrder(testimonialModalForm.order, editingTestimonialItem?.id)))) ? 'is-invalid' : ''}`}
                        value={testimonialModalForm.order}
                        min={1}
                        onChange={(e) => {
                          setTestimonialTouched((p) => ({ ...p, order: true }));
                          setTestimonialModalForm((p) => ({ ...p, order: Number(e.target.value || 1) }));
                        }}
                      />
                      {(testimonialSubmitted || testimonialTouched.order) && (!Number.isFinite(Number(testimonialModalForm.order)) || Number(testimonialModalForm.order) < 1) && (
                        <div className="invalid-feedback">Order must be at least 1.</div>
                      )}
                      {(testimonialSubmitted || testimonialTouched.order) && Number.isFinite(Number(testimonialModalForm.order)) && Number(testimonialModalForm.order) >= 1 && isDuplicateTestimonialOrder(testimonialModalForm.order, editingTestimonialItem?.id) && (
                        <div className="invalid-feedback">Order is already used.</div>
                      )}
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Rating <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select modal-smooth ${((testimonialSubmitted || testimonialTouched.rating) && (!Number.isFinite(Number(testimonialModalForm.rating)) || Number(testimonialModalForm.rating) < 1 || Number(testimonialModalForm.rating) > 5)) ? 'is-invalid' : ''}`}
                        value={testimonialModalForm.rating}
                        onChange={(e) => {
                          setTestimonialTouched((p) => ({ ...p, rating: true }));
                          setTestimonialModalForm((p) => ({ ...p, rating: Number(e.target.value || 5) }));
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                      {(testimonialSubmitted || testimonialTouched.rating) && (!Number.isFinite(Number(testimonialModalForm.rating)) || Number(testimonialModalForm.rating) < 1 || Number(testimonialModalForm.rating) > 5) && (
                        <div className="invalid-feedback">Rating must be between 1 and 5.</div>
                      )}
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={testimonialModalForm.is_active}
                          onChange={(e) => setTestimonialModalForm((p) => ({ ...p, is_active: e.target.checked }))}
                          id="testimonialItemActive"
                        />
                        <label className="form-check-label" htmlFor="testimonialItemActive">
                          Active
                        </label>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Author Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control modal-smooth ${((testimonialSubmitted || testimonialTouched.name) && !testimonialModalForm.name.trim()) ? 'is-invalid' : ''}`}
                        value={testimonialModalForm.name}
                        onChange={(e) => {
                          setTestimonialTouched((p) => ({ ...p, name: true }));
                          setTestimonialModalForm((p) => ({ ...p, name: e.target.value }));
                        }}
                        placeholder="Enter author name..."
                      />
                      {(testimonialSubmitted || testimonialTouched.name) && !testimonialModalForm.name.trim() && (
                        <div className="invalid-feedback">Author name is required.</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Author Role (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control modal-smooth"
                        value={testimonialModalForm.role}
                        onChange={(e) => setTestimonialModalForm((p) => ({ ...p, role: e.target.value }))}
                        placeholder="e.g. Founder, Creative Director"
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Comment <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control modal-smooth ${((testimonialSubmitted || testimonialTouched.content) && !testimonialModalForm.content.trim()) ? 'is-invalid' : ''}`}
                        rows={4}
                        value={testimonialModalForm.content}
                        onChange={(e) => {
                          setTestimonialTouched((p) => ({ ...p, content: true }));
                          setTestimonialModalForm((p) => ({ ...p, content: e.target.value }));
                        }}
                        placeholder="Write the testimonial comment..."
                      />
                      {(testimonialSubmitted || testimonialTouched.content) && !testimonialModalForm.content.trim() && (
                        <div className="invalid-feedback">Comment is required.</div>
                      )}
                    </div>

                    <div className="col-md-12">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Avatar URL (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control modal-smooth"
                        value={testimonialModalForm.image}
                        onChange={(e) => setTestimonialModalForm((p) => ({ ...p, image: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top bg-white modal-smooth">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-smooth"
                    onClick={() => {
                      handleTestimonialCloseAttempt();
                    }}
                    disabled={testimonialSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-smooth"
                    onClick={async () => {
                      if (testimonialSaving) return;
                      setTestimonialSaving(true);
                      setTestimonialSubmitted(true);
                      const orderValue = Number(testimonialModalForm.order || 1);
                      const ratingValue = Number(testimonialModalForm.rating || 5);
                      if (!Number.isFinite(orderValue) || orderValue < 1) {
                        toast.error('Order must be a number greater than 0');
                        setTestimonialSaving(false);
                        return;
                      }
                      if (isDuplicateTestimonialOrder(orderValue, editingTestimonialItem?.id)) {
                        toast.error('Order value is already used by another testimonial');
                        setTestimonialSaving(false);
                        return;
                      }
                      if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
                        toast.error('Rating must be between 1 and 5');
                        setTestimonialSaving(false);
                        return;
                      }
                      if (!testimonialModalForm.name.trim() || !testimonialModalForm.content.trim()) {
                        toast.error('Author name and comment are required');
                        setTestimonialSaving(false);
                        return;
                      }

                      const base = {
                        content: testimonialModalForm.content.trim(),
                        name: testimonialModalForm.name.trim(),
                        role: testimonialModalForm.role.trim(),
                        rating: ratingValue,
                        order: orderValue,
                        is_active: testimonialModalForm.is_active,
                        image: testimonialModalForm.image.trim(),
                      };

                      const next = editingTestimonialItem
                        ? testimonialItems.map((t) => (t.id === editingTestimonialItem.id ? { ...t, ...base } : t))
                        : [...testimonialItems, { id: `testimonial-${Date.now()}-${Math.random()}`, ...base }];

                      const ok = await saveTestimonialItems(next, {
                        loadingTitle: editingTestimonialItem ? 'Updating Testimonial' : 'Saving Testimonial',
                        loadingText: 'Please wait...',
                        successMessage: editingTestimonialItem ? 'Testimonial updated' : 'Testimonial created',
                      });
                      if (ok) {
                        setTestimonialClosing(true);
                        setTimeout(() => {
                          setShowTestimonialModal(false);
                          setTestimonialClosing(false);
                        }, 180);
                        setEditingTestimonialItem(null);
                      }
                      setTestimonialSaving(false);
                    }}
                    disabled={testimonialSaving}
                  >
                    {testimonialSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>{editingTestimonialItem ? 'Update Testimonial' : 'Save Testimonial'}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showDetailModal && selectedSection && (
        <LandingPageSectionDetailsModal
          section={selectedSection}
          onClose={handleCloseDetail}
          collections={collections}
          products={sectionProducts[selectedSection.id] || []}
        />
      )}

        </>
      )}
    </div>
  );
};

const EmptyState = ({ onAddSection, isActionDisabled, hasFilters, icon, label }) => (
  <div className="text-center py-5">
    <div className="mb-3">
      <i
        className={icon + " fa-3x"}
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      ></i>
    </div>
    <h5 className="mb-2" style={{ color: "var(--text-muted)" }}>
      No Sections Found
    </h5>
    <p className="mb-3 small" style={{ color: "var(--text-muted)" }}>
      {hasFilters
        ? "Try adjusting your filters to see more sections."
        : `Start by adding your first ${label.toLowerCase()} section.`}
    </p>
    {!hasFilters && onAddSection && (
      <button
        className="btn btn-sm btn-primary text-white"
        onClick={onAddSection}
        disabled={isActionDisabled?.()}
        style={{ transition: "all 0.2s ease-in-out", borderWidth: "2px", borderRadius: "4px" }}
        onMouseEnter={(e) => {
          if (!e.target.disabled) {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "none";
        }}
      >
        <i className="fas fa-plus me-1"></i>
        Add Section
      </button>
    )}
  </div>
);

export default SectionTypeAdmin;
