import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiX, FiStar, FiLoader } from 'react-icons/fi';
import api from '../../utils/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';

const AdminBundles = () => {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: 10,
    validFrom: '',
    validUntil: '',
    isFeatured: false,
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await api.get('/bundles');
      setBundles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await api.get('/products/admin/all?limit=200');
      const productsList = response.data.data || response.data.products || [];
      setProducts(productsList);
      if (productsList.length === 0) {
        toast.error('No products found. Please add products first.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length < 2) {
      toast.error('Please add at least 2 products');
      return;
    }

    const bundleData = {
      ...formData,
      products: selectedProducts.map(p => ({
        product: p.product,
        quantity: p.quantity,
      })),
    };

    try {
      if (editingBundle) {
        await api.put(`/bundles/${editingBundle._id}`, bundleData);
        toast.success('Bundle updated');
      } else {
        await api.post('/bundles', bundleData);
        toast.success('Bundle created');
      }
      setShowModal(false);
      setEditingBundle(null);
      resetForm();
      fetchBundles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/bundles/${id}`);
      toast.success('Bundle deleted');
      fetchBundles();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleFeatured = async (bundle) => {
    try {
      await api.put(`/bundles/${bundle._id}`, { ...bundle, isFeatured: !bundle.isFeatured });
      toast.success(bundle.isFeatured ? 'Removed from featured' : 'Added to featured');
      fetchBundles();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleEdit = (bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      discountPercentage: bundle.discountPercentage,
      validFrom: bundle.validFrom ? new Date(bundle.validFrom).toISOString().slice(0, 16) : '',
      validUntil: bundle.validUntil ? new Date(bundle.validUntil).toISOString().slice(0, 16) : '',
      isFeatured: bundle.isFeatured || false,
    });
    setSelectedProducts(bundle.products.map(p => ({
      product: p.product._id || p.product,
      name: p.product.name || 'Product',
      quantity: p.quantity,
      price: p.product.price || 0,
    })));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountPercentage: 10,
      validFrom: '',
      validUntil: '',
      isFeatured: false,
    });
    setSelectedProducts([]);
    setEditingBundle(null);
  };

  const addProduct = (productId) => {
    if (!productId) return;
    
    const product = products.find(p => p._id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    if (selectedProducts.find(p => p.product === productId)) {
      toast.error('Product already added');
      return;
    }
    
    setSelectedProducts(prev => [...prev, {
      product: productId,
      name: product.name,
      quantity: 1,
      price: product.price,
    }]);
    toast.success(`${product.name} added to bundle`);
  };

  const updateQuantity = (index, quantity) => {
    const updated = [...selectedProducts];
    updated[index].quantity = Math.max(1, Number(quantity));
    setSelectedProducts(updated);
  };

  const removeProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const calculateBundlePrice = () => {
    const totalPrice = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const discount = (totalPrice * formData.discountPercentage) / 100;
    return { totalPrice, discount, bundlePrice: totalPrice - discount };
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  const prices = calculateBundlePrice();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Bundles</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Create Bundle
        </button>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
            No bundles created yet
          </div>
        ) : (
          bundles.map((bundle) => {
            const totalOriginal = bundle.products?.reduce((sum, p) => 
              sum + ((p.product?.price || 0) * p.quantity), 0) || 0;
            const bundlePrice = totalOriginal * (1 - bundle.discountPercentage / 100);
            
            return (
              <div key={bundle._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-primary-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{bundle.name}</h3>
                      <p className="text-white/80 text-sm">
                        {bundle.products?.length || 0} products
                      </p>
                    </div>
                    {bundle.isFeatured && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <FiStar className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    {bundle.products?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 py-1">
                        <FiPackage className="text-gray-400" />
                        {item.product?.name || 'Product'} x{item.quantity}
                      </div>
                    ))}
                    {bundle.products?.length > 3 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        +{bundle.products.length - 3} more items
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(bundlePrice)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(totalOriginal)}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Save {bundle.discountPercentage}%
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFeatured(bundle)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        bundle.isFeatured 
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <FiStar className="inline mr-1" />
                      {bundle.isFeatured ? 'Featured' : 'Feature'}
                    </button>
                    <button
                      onClick={() => handleEdit(bundle)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(bundle._id)}
                      className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">
                  {editingBundle ? 'Edit Bundle' : 'Create Bundle'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="dark:text-gray-400">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bundle Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Gaming Starter Kit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="2"
                  placeholder="Describe what's included..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                    className="input"
                    min="1"
                    max="90"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid From</label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid Until</label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="isFeatured" className="text-sm text-gray-700 dark:text-gray-300">
                  Featured on homepage
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Products (minimum 2)</label>
                {isLoadingProducts ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <FiLoader className="w-5 h-5 animate-spin text-primary-600" />
                    <span className="text-gray-600 dark:text-gray-300">Loading products...</span>
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <p className="text-red-600 font-medium">No products available</p>
                    <p className="text-sm text-red-500 mt-1">Please add products to your store first</p>
                  </div>
                ) : (
                  <>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addProduct(e.target.value);
                        }
                      }}
                      className="input"
                      disabled={products.filter(p => !selectedProducts.find(sp => sp.product === p._id)).length === 0}
                    >
                      <option value="">Select a product to add...</option>
                      {products
                        .filter(p => !selectedProducts.find(sp => sp.product === p._id))
                        .map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - {formatPrice(product.price)}
                          </option>
                        ))
                      }
                    </select>
                    <div className="flex justify-between mt-2">
                      <p className="text-sm text-gray-500">
                        {products.length} products available
                      </p>
                      {products.filter(p => !selectedProducts.find(sp => sp.product === p._id)).length === 0 && (
                        <p className="text-sm text-amber-600">All products have been added</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {selectedProducts.length > 0 && (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedProducts.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatPrice(item.price)}</td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(index, e.target.value)}
                                className="input w-16 py-1"
                                min="1"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm">{formatPrice(item.price * item.quantity)}</td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeProduct(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiX />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Original Total:</span>
                      <span className="text-gray-900">{formatPrice(prices.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Discount ({formData.discountPercentage}%):</span>
                      <span className="text-green-600">-{formatPrice(prices.discount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Bundle Price:</span>
                      <span className="text-primary-600">{formatPrice(prices.bundlePrice)}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBundles;
