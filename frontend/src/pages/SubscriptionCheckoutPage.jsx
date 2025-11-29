import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  RefreshCw,
  MapPin,
  CreditCard,
  Check,
  Calendar,
  Truck,
  ArrowLeft,
  Plus,
  Edit2,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import { formatPrice } from '../utils/helpers';

const SubscriptionCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Subscription data from navigation state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [products, setProducts] = useState([]);

  // Address
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!location.state?.items) {
      navigate('/products');
      toast.error('No subscription items found');
      return;
    }

    setSubscriptionData(location.state);
    fetchProducts(location.state.items);
    fetchAddresses();
  }, [isAuthenticated, location.state, navigate]);

  const fetchProducts = async (items) => {
    try {
      const productPromises = items.map((item) =>
        api.get(`/products/${item.productId}`)
      );
      const responses = await Promise.all(productPromises);
      const fetchedProducts = responses.map((res, idx) => ({
        ...res.data.data,
        quantity: items[idx].quantity,
        variant: items[idx].variant,
      }));
      setProducts(fetchedProducts);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      const addrs = response.data.data || [];
      setAddresses(addrs);
      const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      }
    } catch (error) {
      console.error('Failed to fetch addresses');
    }
  };

  const frequencies = {
    weekly: { label: 'Every Week', discount: 15 },
    biweekly: { label: 'Every 2 Weeks', discount: 12 },
    monthly: { label: 'Every Month', discount: 10 },
    bimonthly: { label: 'Every 2 Months', discount: 7 },
    quarterly: { label: 'Every 3 Months', discount: 5 },
  };

  const selectedFreq = frequencies[subscriptionData?.frequency] || frequencies.monthly;

  const calculateTotals = () => {
    let subtotal = 0;
    products.forEach((product) => {
      const discountedPrice = product.price * (1 - selectedFreq.discount / 100);
      subtotal += discountedPrice * product.quantity;
    });

    const shipping = subtotal > 35 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      discount: selectedFreq.discount,
    };
  };

  const totals = calculateTotals();

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/addresses', {
        ...addressForm,
        addressLine1: addressForm.street,
        addressType: 'home',
        isDefault: addresses.length === 0,
      });
      const newAddr = response.data.data;
      setAddresses([...addresses, newAddr]);
      setSelectedAddressId(newAddr._id);
      setShowAddressForm(false);
      toast.success('Address added');
    } catch (error) {
      toast.error('Failed to add address');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!selectedAddress) {
      toast.error('Invalid address selected');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/subscriptions', {
        items: subscriptionData.items,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          street: selectedAddress.addressLine1,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone,
        },
        frequency: subscriptionData.frequency,
        paymentMethod,
      });

      toast.success('Subscription created successfully!');
      navigate('/subscriptions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Subscribe & Save Checkout
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up your subscription delivery
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Address */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Delivery Address
                </h2>
              </div>

              {addresses.length > 0 && !showAddressForm ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedAddressId === addr._id
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {addr.fullName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {addr.addressLine1}, {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        {addr.phone && (
                          <p className="text-sm text-gray-500">{addr.phone}</p>
                        )}
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add new address
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, fullName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.street}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, street: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, city: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, state: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.postalCode}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, postalCode: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn-primary">
                      Save Address
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                    paymentMethod === 'Credit Card'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'Credit Card'}
                    onChange={() => setPaymentMethod('Credit Card')}
                  />
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Credit/Debit Card
                  </span>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Your card will be charged automatically for each delivery
              </p>
            </div>

            {/* Subscribe Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAddressId}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Start Subscription - {formatPrice(totals.total)}/delivery
                </>
              )}
            </button>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Subscription Summary
              </h2>

              {/* Frequency Badge */}
              <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 p-3 rounded-lg mb-4">
                <Calendar className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-primary-700 dark:text-primary-400">
                    {selectedFreq.label}
                  </p>
                  <p className="text-sm text-primary-600">{selectedFreq.discount}% off every order</p>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3 mb-4 pb-4 border-b dark:border-gray-700">
                {products.map((product) => {
                  const discountedPrice = product.price * (1 - selectedFreq.discount / 100);
                  return (
                    <div key={product._id} className="flex gap-3">
                      <img
                        src={product.images?.[0]?.url || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary-600">
                            {formatPrice(discountedPrice)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Subscription Discount ({totals.discount}%)</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-medium">
                    {totals.shipping === 0 ? 'FREE' : formatPrice(totals.shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium">{formatPrice(totals.tax)}</span>
                </div>
                <div className="border-t dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Per Delivery</span>
                    <span className="text-primary-600">{formatPrice(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Cancel or modify anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Skip deliveries when needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Exclusive subscriber discounts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckoutPage;
