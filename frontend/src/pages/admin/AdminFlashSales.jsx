import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiZap, FiClock, FiX, FiLoader } from 'react-icons/fi';
import api from '../../utils/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';

const AdminFlashSales = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    products: [],
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchFlashSales();
    fetchProducts();
  }, []);

  const fetchFlashSales = async () => {
    try {
      const response = await api.get('/flash-sales?all=true');
      setFlashSales(response.data.data || []);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      toast.error('Failed to load flash sales');
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
    
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product to the flash sale');
      return;
    }

    // Validate sale prices
    const invalidProducts = selectedProducts.filter(p => p.salePrice <= 0 || p.salePrice >= p.originalPrice);
    if (invalidProducts.length > 0) {
      toast.error('Sale prices must be greater than 0 and less than original prices');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    if (endDate <= startDate) {
      toast.error('End time must be after start time');
      return;
    }

    const flashSaleData = {
      ...formData,
      products: selectedProducts.map(p => ({
        product: p.product,
        salePrice: p.salePrice,
        quantityLimit: p.quantityLimit,
      })),
    };

    try {
      if (editingSale) {
        await api.put(`/flash-sales/${editingSale._id}`, flashSaleData);
        toast.success('Flash sale updated successfully!');
      } else {
        await api.post('/flash-sales', flashSaleData);
        toast.success('Flash sale created successfully!');
      }
      setShowModal(false);
      setEditingSale(null);
      resetForm();
      fetchFlashSales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this flash sale?')) return;
    try {
      await api.delete(`/flash-sales/${id}`);
      toast.success('Flash sale deleted successfully');
      fetchFlashSales();
    } catch (error) {
      toast.error('Failed to delete flash sale');
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      name: sale.name,
      startTime: new Date(sale.startTime).toISOString().slice(0, 16),
      endTime: new Date(sale.endTime).toISOString().slice(0, 16),
      products: [],
    });
    setSelectedProducts(sale.products.map(p => {
      const productData = p.product || {};
      return {
        product: productData._id || p.product,
        name: productData.name || 'Product',
        salePrice: p.salePrice || 0,
        quantityLimit: p.quantity || p.quantityLimit || 50,
        originalPrice: p.originalPrice || productData.price || 0,
      };
    }));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', startTime: '', endTime: '', products: [] });
    setSelectedProducts([]);
    setEditingSale(null);
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
    
    const discountedPrice = Math.round(product.price * 0.7); // 30% off by default
    
    setSelectedProducts(prev => [...prev, {
      product: productId,
      name: product.name,
      salePrice: discountedPrice,
      quantityLimit: 50,
      originalPrice: product.price,
    }]);
    
    toast.success(`${product.name} added to flash sale`);
  };

  const updateProductField = (index, field, value) => {
    const updated = [...selectedProducts];
    const numValue = Number(value);
    updated[index][field] = isNaN(numValue) ? 0 : numValue;
    setSelectedProducts(updated);
  };

  const removeProduct = (index) => {
    const productName = selectedProducts[index]?.name || 'Product';
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
    toast.success(`${productName} removed`);
  };

  const getSaleStatus = (sale) => {
    const now = new Date();
    const start = new Date(sale.startTime);
    const end = new Date(sale.endTime);
    if (now < start) return { text: 'Upcoming', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' };
    if (now > end) return { text: 'Ended', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
    return { text: 'Live', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' };
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flash Sales</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Create Flash Sale
        </button>
      </div>

      {/* Flash Sales List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Scrollable table container for mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Actions</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {flashSales.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No flash sales created yet
                </td>
              </tr>
            ) : (
              flashSales.map((sale) => {
                const status = getSaleStatus(sale);
                return (
                  <tr key={sale._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiZap className="text-yellow-500" />
                        <span className="font-medium dark:text-white">{sale.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FiClock className="text-gray-400" />
                        {new Date(sale.startTime).toLocaleDateString()} - {new Date(sale.endTime).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-gray-300">{sale.products?.length || 0} products</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(sale._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">
                  {editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="dark:text-gray-400">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sale Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Weekend Flash Sale"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Products</label>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Original</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Sale Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Qty Limit</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedProducts.map((item, index) => {
                        const discount = item.originalPrice > 0 
                          ? Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100)
                          : 0;
                        return (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                              {formatPrice(item.originalPrice)}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={item.salePrice}
                                  onChange={(e) => updateProductField(index, 'salePrice', e.target.value)}
                                  className="input w-24 py-1"
                                  min="0"
                                  max={item.originalPrice}
                                />
                                {discount > 0 && (
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded">
                                    -{discount}%
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={item.quantityLimit}
                                onChange={(e) => updateProductField(index, 'quantityLimit', e.target.value)}
                                className="input w-20 py-1"
                                min="1"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeProduct(index)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Remove product"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t dark:border-gray-600">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        <strong>{selectedProducts.length}</strong> product{selectedProducts.length !== 1 ? 's' : ''} selected
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        Total quantity: <strong>{selectedProducts.reduce((sum, p) => sum + p.quantityLimit, 0)}</strong> items
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedProducts.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <FiZap className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No products added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Select products from the dropdown above to add them to this flash sale</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex items-center gap-2"
                  disabled={selectedProducts.length === 0}
                >
                  <FiZap className="w-4 h-4" />
                  {editingSale ? 'Update Flash Sale' : 'Create Flash Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFlashSales;
