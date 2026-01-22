import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductForm = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    price: '',
    old_price: '',
    on_sale: false,
    category: '',
    availability: 'In Stock',
    image_type: '',
    color: '',
    accent_color: '',
    description: '',
    is_active: true,
    stock_quantity: 0,
  });

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const categories = ['Business', 'Finance', 'Productivity', 'Personal', 'Bundle'];

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const product = data.product;
        setFormData({
          title: product.title || '',
          subtitle: product.subtitle || '',
          price: product.price || '',
          old_price: product.old_price || '',
          on_sale: product.on_sale || false,
          category: product.category || '',
          availability: product.availability || 'In Stock',
          image_type: product.image_type || '',
          color: product.color || '',
          accent_color: product.accent_color || '',
          description: product.description || '',
          is_active: product.is_active !== undefined ? product.is_active : true,
          stock_quantity: product.stock_quantity || 0,
        });
      } else {
        toast.error('Failed to load product');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Error loading product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const url = isEditMode 
        ? `${apiBaseUrl}/api/products/${id}`
        : `${apiBaseUrl}/api/products`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        subtitle: formData.subtitle || null,
        image_type: formData.image_type || null,
        color: formData.color || null,
        accent_color: formData.accent_color || null,
        description: formData.description || null,
      };

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

      if (response.ok) {
        toast.success(isEditMode ? 'Product updated successfully' : 'Product created successfully');
        navigate('/admin/products');
      } else {
        toast.error(data.message || 'Failed to save product');
        if (data.errors) {
          Object.values(data.errors).flat().forEach(error => {
            toast.error(error);
          });
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-3 py-2 admin-dashboard-container fadeIn">
      {/* Page Header */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 gap-3">
        <div>
          <button
            className="btn btn-link p-0 mb-2"
            onClick={() => navigate('/admin/products')}
            style={{ textDecoration: 'none', color: 'var(--text-primary)' }}
          >
            <FaArrowLeft className="me-2" />
            Back to Products
          </button>
          <h1 className="h4 mb-1 fw-bold" style={{ color: "var(--text-primary)" }}>
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>
            {isEditMode ? 'Update product information' : 'Create a new product for your store'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ borderRadius: "10px" }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Title */}
              <div className="col-md-8">
                <label className="form-label fw-semibold">
                  Product Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Accounts Receivables Tracker"
                />
              </div>

              {/* Category */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Subtitle */}
              <div className="col-md-12">
                <label className="form-label fw-semibold">Subtitle</label>
                <input
                  type="text"
                  className="form-control"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="e.g., Track invoices and payments efficiently"
                />
              </div>

              {/* Description */}
              <div className="col-md-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Product description..."
                />
              </div>

              {/* Price */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Price <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">₱</span>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Old Price */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">Old Price (for sale)</label>
                <div className="input-group">
                  <span className="input-group-text">₱</span>
                  <input
                    type="number"
                    className="form-control"
                    name="old_price"
                    value={formData.old_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">Stock Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              {/* Availability */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Availability <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  required
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Pre-order">Pre-order</option>
                </select>
              </div>

              {/* Image Type */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">Image Type</label>
                <input
                  type="text"
                  className="form-control"
                  name="image_type"
                  value={formData.image_type}
                  onChange={handleChange}
                  placeholder="e.g., receivables, airbnb"
                />
              </div>

              {/* Color */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Primary Color</label>
                <div className="input-group">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    name="color"
                    value={formData.color || '#4CAF50'}
                    onChange={handleChange}
                    title="Choose color"
                  />
                  <input
                    type="text"
                    className="form-control"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="#4CAF50"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Accent Color</label>
                <div className="input-group">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    name="accent_color"
                    value={formData.accent_color || '#2E7D32'}
                    onChange={handleChange}
                    title="Choose accent color"
                  />
                  <input
                    type="text"
                    className="form-control"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleChange}
                    placeholder="#2E7D32"
                  />
                </div>
              </div>

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
                  />
                  <label className="form-check-label" htmlFor="on_sale">
                    On Sale
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="is_active">
                    Active (Product will be visible on website)
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="col-12">
                <hr />
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/admin/products')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {isEditMode ? 'Update Product' : 'Create Product'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
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
    </div>
  );
};

export default ProductForm;

