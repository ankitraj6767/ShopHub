import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiZap,
  FiRefreshCw,
  FiSearch,
  FiCalendar,
  FiPercent
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/helpers';

const AdminDeals = () => {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    product: '',
    originalPrice: '',
    salePrice: '',
    discountPercent: '',
    startDate: '',
    endDate: '',
    purchaseLimit: '',
    dealType: 'daily',
    isActive: true
  });

  useEffect(() => {
    fetchDeals();
    fetchProducts();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data } = await api.get('/deals');
      setDeals(data.data || []);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=100');
      setProducts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate discount percent when prices change
    if (name === 'originalPrice' || name === 'salePrice') {
      const original = name === 'originalPrice' ? parseFloat(value) : parseFloat(formData.originalPrice);
      const sale = name === 'salePrice' ? parseFloat(value) : parseFloat(formData.salePrice);
      if (original && sale) {
        const discount = Math.round(((original - sale) / original) * 100);
        setFormData(prev => ({ ...prev, discountPercent: discount }));
      }
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p._id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        product: productId,
        originalPrice: product.price,
        salePrice: Math.round(product.price * 0.8) // Default 20% off
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      product: '',
      originalPrice: '',
      salePrice: '',
      discountPercent: '',
      startDate: '',
      endDate: '',
      purchaseLimit: '',
      dealType: 'daily',
      isActive: true
    });
    setEditingDeal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingDeal) {
        await api.put(`/deals/${editingDeal._id}`, formData);
        toast.success('Deal updated successfully');
      } else {
        await api.post('/deals', formData);
        toast.success('Deal created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchDeals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save deal');
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      product: deal.product?._id || '',
      originalPrice: deal.originalPrice,
      salePrice: deal.salePrice,
      discountPercent: deal.discountPercent,
      startDate: deal.startDate ? new Date(deal.startDate).toISOString().slice(0, 16) : '',
      endDate: deal.endDate ? new Date(deal.endDate).toISOString().slice(0, 16) : '',
      purchaseLimit: deal.purchaseLimit || '',
      dealType: deal.dealType || 'daily',
      isActive: deal.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (dealId) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await api.delete(`/deals/${dealId}`);
      toast.success('Deal deleted successfully');
      fetchDeals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete deal');
    }
  };

  const handleGenerateAutoDeals = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/deals/generate');
      toast.success(`Generated ${data.count} deals automatically`);
      fetchDeals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate deals');
    } finally {
      setGenerating(false);
    }
  };

  const filteredDeals = deals.filter(deal => 
    deal.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FiZap className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deals Management</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAutoDeals}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Auto Generate
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <FiPlus className="w-4 h-4" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search deals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Deals Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No deals found. Create your first deal!
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => {
                  const isLive = deal.isActive && 
                    new Date(deal.startDate) <= new Date() && 
                    new Date(deal.endDate) >= new Date();
                  
                  return (
                    <tr key={deal._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={deal.product?.images?.[0]?.url || 'https://via.placeholder.com/50'}
                            alt={deal.product?.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                              {deal.product?.name || 'Unknown Product'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {deal.dealType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-red-600">{formatPrice(deal.salePrice)}</p>
                          <p className="text-sm text-gray-400 line-through">{formatPrice(deal.originalPrice)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                          <FiPercent className="w-3 h-3" />
                          {deal.discountPercent}% OFF
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">
                            {new Date(deal.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            to {new Date(deal.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Live
                          </span>
                        ) : deal.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full text-sm font-medium">
                            Scheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white font-medium">
                            {deal.soldCount || 0} sold
                          </p>
                          {deal.purchaseLimit > 0 && (
                            <p className="text-gray-500 dark:text-gray-400">
                              of {deal.purchaseLimit}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(deal)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(deal._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product
                </label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleProductChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} - {formatPrice(product.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Original Price
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deal Type
                  </label>
                  <select
                    name="dealType"
                    value={formData.dealType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily Deal</option>
                    <option value="weekly">Weekly Deal</option>
                    <option value="flash">Flash Sale</option>
                    <option value="clearance">Clearance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Limit
                  </label>
                  <input
                    type="number"
                    name="purchaseLimit"
                    value={formData.purchaseLimit}
                    onChange={handleInputChange}
                    placeholder="0 for unlimited"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              {formData.discountPercent > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Discount: {formData.discountPercent}% OFF
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeals;
