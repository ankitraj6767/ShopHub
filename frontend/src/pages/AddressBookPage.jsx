import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiCheck,
  FiArrowLeft,
  FiHome,
  FiBriefcase,
} from 'react-icons/fi';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const AddressBookPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    addressType: 'home',
    isDefault: false,
    landmark: '',
    deliveryInstructions: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      setAddresses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch addresses');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress._id}`, formData);
        toast.success('Address updated successfully');
      } else {
        await api.post('/addresses', formData);
        toast.success('Address added successfully');
      }
      setShowForm(false);
      setEditingAddress(null);
      resetForm();
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'United States',
      addressType: address.addressType || 'home',
      isDefault: address.isDefault || false,
      landmark: address.landmark || '',
      deliveryInstructions: address.deliveryInstructions || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      addressType: 'home',
      isDefault: false,
      landmark: '',
      deliveryInstructions: '',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/profile" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <FiArrowLeft className="mr-2" /> Back to Profile
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
          <p className="text-gray-600">Manage your shipping addresses</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingAddress(null);
            resetForm();
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Address
        </button>
      </div>

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="input"
                  placeholder="Street address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="input"
                  placeholder="Apartment, suite, unit, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="input"
                  placeholder="Nearby landmark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="India">India</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
                    formData.addressType === 'home' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="addressType"
                      value="home"
                      checked={formData.addressType === 'home'}
                      onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                      className="sr-only"
                    />
                    <FiHome className={formData.addressType === 'home' ? 'text-primary-600' : 'text-gray-400'} />
                    <span className={formData.addressType === 'home' ? 'text-primary-600 font-medium' : 'text-gray-600'}>Home</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
                    formData.addressType === 'work' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="addressType"
                      value="work"
                      checked={formData.addressType === 'work'}
                      onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                      className="sr-only"
                    />
                    <FiBriefcase className={formData.addressType === 'work' ? 'text-primary-600' : 'text-gray-400'} />
                    <span className={formData.addressType === 'work' ? 'text-primary-600 font-medium' : 'text-gray-600'}>Work</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                <textarea
                  value={formData.deliveryInstructions}
                  onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                  className="input"
                  rows="2"
                  placeholder="Any special instructions for delivery"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingAddress ? 'Update' : 'Save'} Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <FiMapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-500 mb-6">Add your first shipping address to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                address.isDefault ? 'border-primary-500' : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {address.addressType === 'home' ? (
                    <FiHome className="text-gray-400" />
                  ) : (
                    <FiBriefcase className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-500 uppercase">
                    {address.addressType}
                  </span>
                  {address.isDefault && (
                    <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-gray-600">
                <p className="font-medium text-gray-900">{address.fullName}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                {address.landmark && <p className="text-sm">Near: {address.landmark}</p>}
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country}</p>
                <p className="mt-2">Phone: {address.phone}</p>
                {address.deliveryInstructions && (
                  <p className="mt-2 text-sm italic">Note: {address.deliveryInstructions}</p>
                )}
              </div>

              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address._id)}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <FiCheck className="w-4 h-4" /> Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressBookPage;
