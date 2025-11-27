import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiPlus, FiX, FiUpload, FiImage } from 'react-icons/fi';
import { fetchProduct, createProduct, updateProduct } from '../../store/slices/productSlice';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, isLoading } = useSelector((state) => state.products);
  const fileInputRef = useRef(null);

  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    stock: '',
    images: ['']
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageInputType, setImageInputType] = useState('upload'); // 'upload' or 'url'
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports & Outdoors',
    'Books',
    'Toys & Games',
    'Health & Beauty',
    'Automotive',
    'Food & Grocery',
    'Other'
  ];

  useEffect(() => {
    if (isEditing) {
      dispatch(fetchProduct(id));
    }
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && product) {
      // Extract URLs from image objects if needed
      let imageUrls = [''];
      if (product.images?.length > 0) {
        imageUrls = product.images.map((img) => 
          typeof img === 'string' ? img : img.url || ''
        );
        setUploadedImages(product.images.map((img) => ({
          url: typeof img === 'string' ? img : img.url,
          alt: img.alt || product.name,
        })));
      }
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        brand: product.brand || '',
        stock: product.stock?.toString() || '',
        images: imageUrls
      });
    }
  }, [product, isEditing]);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (files.length + uploadedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    files.forEach((file) => {
      formDataUpload.append('images', file);
    });

    try {
      const { data } = await api.post('/products/upload-images', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedImages((prev) => [...prev, ...data.data]);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    const validImages = formData.images.filter((img) => img.trim());
    if (validImages.length === 0 && uploadedImages.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData((prev) => ({ ...prev, images: newImages }));
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }));
    }
  };

  const addImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, images: newImages }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Combine uploaded images and URL images
      let allImages = [...uploadedImages];
      const urlImages = formData.images
        .filter((img) => img.trim())
        .map((url) => ({ url, alt: formData.name }));
      allImages = [...allImages, ...urlImages];

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        brand: formData.brand.trim(),
        stock: parseInt(formData.stock),
        images: allImages
      };

      if (isEditing) {
        await dispatch(updateProduct({ id, productData })).unwrap();
        toast.success('Product updated successfully');
      } else {
        await dispatch(createProduct(productData)).unwrap();
        toast.success('Product created successfully');
      }

      navigate('/admin/products');
    } catch (error) {
      toast.error(error || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/products')}
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Products
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`input w-full ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Enter product description"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input w-full ${errors.price ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`input w-full ${errors.stock ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`input w-full ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={`input w-full ${errors.brand ? 'border-red-500' : ''}`}
                placeholder="Enter brand name"
              />
              {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            
            {/* Toggle between upload and URL */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setImageInputType('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  imageInputType === 'upload'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FiUpload /> Upload Images
              </button>
              <button
                type="button"
                onClick={() => setImageInputType('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  imageInputType === 'url'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FiImage /> Add URL
              </button>
            </div>

            {/* File Upload */}
            {imageInputType === 'upload' && (
              <div className="mb-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Spinner size="md" />
                      <p className="mt-2 text-gray-600">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">Click to upload images</p>
                      <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB (max 5 images)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
            )}

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Uploaded Images:</p>
                <div className="flex flex-wrap gap-3">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.alt || `Uploaded ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/96?text=Error';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* URL Input */}
            {imageInputType === 'url' && (
              <>
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        className="input w-full pl-10"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <FiPlus className="mr-1" /> Add Another URL
                </button>
              </>
            )}

            {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          </div>

          {/* Preview */}
          {(uploadedImages.length > 0 || formData.images.some((img) => img.trim())) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                All Images Preview
              </label>
              <div className="flex flex-wrap gap-2">
                {uploadedImages.map((image, index) => (
                  <img
                    key={`uploaded-${index}`}
                    src={image.url}
                    alt={`Uploaded ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border border-green-500"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=Invalid';
                    }}
                  />
                ))}
                {formData.images.filter((img) => img.trim()).map((image, index) => (
                  <img
                    key={`url-${index}`}
                    src={image}
                    alt={`URL ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border border-blue-500"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=Invalid';
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span> Uploaded
                <span className="inline-block w-3 h-3 bg-blue-500 rounded ml-3 mr-1"></span> URL
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center"
          >
            {submitting && <Spinner size="sm" className="mr-2" />}
            {isEditing ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
