import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCreditCard, FiTruck, FiCheck, FiLock, FiTag, FiX, FiMapPin, FiPlus, FiEdit2, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createOrder, clearSuccess } from '../store/slices/orderSlice';
import { clearCart, clearBuyNowItem } from '../store/slices/cartSlice';
import { getPaymentConfig, createPaymentIntent, confirmPayment, clearPaymentState } from '../store/slices/paymentSlice';
import { fetchWallet } from '../store/slices/userSlice';
import { formatPrice } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import api from '../utils/api';

// Stripe Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#6366f1',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

// Stripe Payment Form Component
const StripePaymentForm = ({ onPaymentSuccess, onBack, isProcessing, setIsProcessing, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const { clientSecret, error: paymentError } = useSelector((state) => state.payment);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast.error('Payment not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      setCardError(error.message);
      setIsProcessing(false);
      toast.error(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      toast.success('Payment successful!');
      onPaymentSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-4">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <p className="text-indigo-100 text-sm">Payment Amount</p>
            <p className="text-3xl font-bold">{amount}</p>
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-5 bg-white/20 rounded" />
            <div className="w-8 h-5 bg-white/20 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6 opacity-80" />
          <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6 opacity-80" />
          <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-6 opacity-80" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className={`p-4 border-2 rounded-lg transition-colors ${
            cardError ? 'border-red-300 bg-red-50' : cardComplete ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
          }`}>
            <CardElement 
              options={cardElementOptions} 
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setCardError(e.error.message);
                } else {
                  setCardError(null);
                }
              }}
            />
          </div>
          {cardError && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {cardError}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2 border-t border-b">
        <FiLock className="text-green-500" />
        <span>Secured by</span>
        <svg className="h-5" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
          <path fill="#635bff" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.9 10.9 0 0 1-4.56 1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.58zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-5.13L32.37 0v3.77l-4.13.88V.44zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.45-3.32.43zm-8.55 4.72c0 1.94 2.31 1.27 2.77 1.06v3.57c-.48.23-1.53.5-2.84.5-2.63 0-4.13-1.36-4.13-4.09l.02-13.71 4.12-.87v3.92h2.8v3.57h-2.8l.06 6.05zM4.58 8.31c-.96 0-1.6.43-1.6 1.14 0 .76.65 1.03 1.72 1.4l.69.23c2.82.9 4.27 2.2 4.27 4.68 0 3.1-2.53 4.54-5.95 4.54a11.9 11.9 0 0 1-3.71-.6V16.08a9.53 9.53 0 0 0 3.47.77c1.05 0 1.76-.34 1.76-1.14 0-.68-.64-1-1.85-1.42l-.57-.18c-2.37-.77-4.12-1.9-4.12-4.6 0-2.94 2.33-4.66 5.61-4.66 1.28 0 2.51.17 3.54.53v3.58a9.64 9.64 0 0 0-3.26-.65z"/>
        </svg>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="btn-secondary flex-1 py-3"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing || !cardComplete}
          className="btn-primary flex-1 py-3 flex items-center justify-center disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Spinner size="sm" className="mr-2" /> Processing...
            </>
          ) : (
            <>
              <FiLock className="mr-2" /> Pay {amount}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuyNowMode = searchParams.get('buyNow') === 'true';
  
  const cartState = useSelector((state) => state.cart) || {};
  const { 
    items: cartItems = [], 
    buyNowItem = null, 
    buyNowItems = [],
    subtotal: cartSubtotal = 0, 
    tax: cartTax = 0, 
    shipping: cartShipping = 0, 
    total: cartTotal = 0 
  } = cartState;
  
  // Determine which items to use for checkout
  const checkoutItems = useMemo(() => {
    if (isBuyNowMode) {
      if (buyNowItems.length > 0) {
        return buyNowItems;
      } else if (buyNowItem) {
        return [buyNowItem];
      }
    }
    return cartItems;
  }, [isBuyNowMode, buyNowItem, buyNowItems, cartItems]);

  // Calculate totals for checkout items
  const { items, subtotal, tax, shipping, total } = useMemo(() => {
    if (isBuyNowMode && checkoutItems.length > 0) {
      const itemsCount = checkoutItems.reduce((total, item) => total + item.quantity, 0);
      const calcSubtotal = checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);
      const calcTax = calcSubtotal * 0.08;
      const calcShipping = calcSubtotal > 100 ? 0 : 10;
      const calcTotal = calcSubtotal + calcTax + calcShipping;
      
      return {
        items: checkoutItems,
        subtotal: Math.round(calcSubtotal * 100) / 100,
        tax: Math.round(calcTax * 100) / 100,
        shipping: Math.round(calcShipping * 100) / 100,
        total: Math.round(calcTotal * 100) / 100,
      };
    }
    return {
      items: cartItems,
      subtotal: cartSubtotal,
      tax: cartTax,
      shipping: cartShipping,
      total: cartTotal,
    };
  }, [isBuyNowMode, checkoutItems, cartItems, cartSubtotal, cartTax, cartShipping, cartTotal]);

  const authState = useSelector((state) => state.auth) || {};
  const { user = null } = authState;
  const ordersState = useSelector((state) => state.orders) || {};
  const { isLoading = false, error = null, success = false, order = null } = ordersState;
  const paymentState = useSelector((state) => state.payment) || {};
  const { publishableKey, clientSecret, isLoading: paymentLoading } = paymentState;

  const [stripePromise, setStripePromise] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  
  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Wallet state
  const { wallet } = useSelector((state) => state.users);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);

  // Fetch wallet balance on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchWallet());
    }
  }, [dispatch, user]);

  // Fetch saved addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressLoading(true);
        const response = await api.get('/addresses');
        if (response.data.success) {
          const addresses = response.data.data || [];
          setSavedAddresses(addresses);
          
          // Auto-select default address or first address
          const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress._id);
            setShippingAddress({
              fullName: defaultAddress.fullName || '',
              street: defaultAddress.addressLine1 || '',
              city: defaultAddress.city || '',
              state: defaultAddress.state || '',
              postalCode: defaultAddress.postalCode || '',
              country: defaultAddress.country || 'United States',
              phone: defaultAddress.phone || '',
            });
          } else {
            // No saved addresses, show form
            setShowAddressForm(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
        // If no addresses, show the form
        setShowAddressForm(true);
      } finally {
        setAddressLoading(false);
      }
    };

    if (user) {
      fetchAddresses();
    } else {
      setAddressLoading(false);
      setShowAddressForm(true);
    }
  }, [user]);

  // Handle selecting a saved address
  const handleSelectAddress = (address) => {
    setSelectedAddressId(address._id);
    setShippingAddress({
      fullName: address.fullName || '',
      street: address.addressLine1 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'United States',
      phone: address.phone || '',
    });
    setShowAddressForm(false);
    setIsEditingAddress(false);
  };

  // Handle adding new address
  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setShippingAddress({
      fullName: user?.name || '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      phone: user?.phone || '',
    });
    setShowAddressForm(true);
    setIsEditingAddress(false);
  };

  // Handle editing selected address
  const handleEditAddress = () => {
    setShowAddressForm(true);
    setIsEditingAddress(true);
  };

  // Save address to address book
  const saveAddressToBook = async () => {
    try {
      const addressData = {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        addressType: 'home',
        isDefault: savedAddresses.length === 0, // Make default if first address
      };

      let response;
      if (isEditingAddress && selectedAddressId) {
        // Update existing address
        response = await api.put(`/addresses/${selectedAddressId}`, addressData);
        toast.success('Address updated successfully');
      } else {
        // Create new address
        response = await api.post('/addresses', addressData);
        toast.success('Address saved to your address book');
      }

      if (response.data.success) {
        // Refresh addresses
        const addressesResponse = await api.get('/addresses');
        if (addressesResponse.data.success) {
          setSavedAddresses(addressesResponse.data.data || []);
          const savedAddr = response.data.data;
          setSelectedAddressId(savedAddr._id);
        }
      }
      
      setShowAddressForm(false);
      setIsEditingAddress(false);
      return true;
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(error.response?.data?.message || 'Failed to save address');
      return false;
    }
  };

  // Load Stripe
  useEffect(() => {
    setStripeLoading(true);
    dispatch(getPaymentConfig()).then((result) => {
      console.log('Payment config result:', result);
      if (getPaymentConfig.fulfilled.match(result) && result.payload.publishableKey) {
        console.log('Loading Stripe with key:', result.payload.publishableKey.substring(0, 20) + '...');
        setStripePromise(loadStripe(result.payload.publishableKey));
      } else {
        console.error('Failed to get Stripe key:', result);
      }
      setStripeLoading(false);
    }).catch((err) => {
      console.error('Payment config error:', err);
      setStripeLoading(false);
    });
  }, [dispatch]);

  useEffect(() => {
    // Redirect to cart if no items (and not in buyNow mode with items)
    if (items.length === 0 && !success && !createdOrderId) {
      navigate('/cart');
    }
  }, [items, navigate, success, createdOrderId]);

  useEffect(() => {
    if (success && order) {
      // Clear appropriate items based on mode
      if (isBuyNowMode) {
        dispatch(clearBuyNowItem());
      } else {
        dispatch(clearCart());
      }
      dispatch(clearSuccess());
      dispatch(clearPaymentState());
      navigate(`/order-success/${order._id}`);
    }
  }, [success, order, dispatch, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const response = await api.post('/coupons/apply', {
        code: couponCode,
        orderTotal: subtotal,
        cartTotal: subtotal,
        items: items.map((item) => ({
          product: item._id,
          quantity: item.quantity,
        })),
      });

      if (response.data.success) {
        const couponData = response.data.data;
        setAppliedCoupon(couponData);
        setDiscount(couponData.discount);
        toast.success(`Coupon applied! You saved ${formatPrice(couponData.discount)}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscount(0);
    toast.success('Coupon removed');
  };

  // Calculate final total with discount and wallet
  const totalAfterDiscount = Math.max(0, total - discount);
  const maxWalletUsable = Math.min(wallet?.balance || 0, totalAfterDiscount);
  const actualWalletUsed = useWalletBalance ? Math.min(walletAmountToUse, maxWalletUsable) : 0;
  const finalTotal = Math.max(0, totalAfterDiscount - actualWalletUsed);

  // Update wallet amount when toggle changes
  useEffect(() => {
    if (useWalletBalance) {
      setWalletAmountToUse(maxWalletUsable);
    } else {
      setWalletAmountToUse(0);
    }
  }, [useWalletBalance, maxWalletUsable]);

  const handleShippingChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    
    // Check if we need to save the address
    if (showAddressForm) {
      const saveCheckbox = document.getElementById('saveAddress');
      const shouldSave = saveCheckbox ? saveCheckbox.checked : true;
      
      if (shouldSave || isEditingAddress) {
        const saved = await saveAddressToBook();
        if (!saved && isEditingAddress) {
          // If editing failed, don't proceed
          return;
        }
      }
    }
    
    setStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePlaceOrder = async (paymentIntentId = null) => {
    const orderData = {
      orderItems: items.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price, // Pass the cart price (includes bundle/sale discounts)
      })),
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        transactionId: paymentIntentId,
        status: paymentIntentId ? 'paid' : 'pending',
      },
      couponCode: appliedCoupon?.code || null,
      discountAmount: discount,
      walletAmount: actualWalletUsed, // Add wallet amount to order
    };

    const result = await dispatch(createOrder(orderData));
    if (createOrder.fulfilled.match(result)) {
      const { order: createdOrder, walletUsed } = result.payload;
      setCreatedOrderId(createdOrder._id);
      
      // Show wallet notification
      if (walletUsed && walletUsed.amount > 0) {
        toast.success(`💰 Used ${formatPrice(walletUsed.amount)} from wallet!`, {
          duration: 4000,
        });
        // Refresh wallet balance
        dispatch(fetchWallet());
      }
      
      return createdOrder;
    }
    return null;
  };

  const handleStripePayment = async () => {
    setIsProcessing(true);
    
    // First create the order
    const newOrder = await handlePlaceOrder();
    if (!newOrder) {
      setIsProcessing(false);
      return;
    }

    // Create payment intent
    const result = await dispatch(createPaymentIntent(newOrder._id));
    if (!createPaymentIntent.fulfilled.match(result)) {
      toast.error('Failed to initialize payment');
      setIsProcessing(false);
    }
    // Payment form will handle the rest
    setIsProcessing(false);
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    // Confirm payment on backend
    await dispatch(confirmPayment({ orderId: createdOrderId, paymentIntentId }));
    // Clear appropriate items based on mode
    if (isBuyNowMode) {
      dispatch(clearBuyNowItem());
    } else {
      dispatch(clearCart());
    }
    dispatch(clearPaymentState());
    navigate(`/order-success/${createdOrderId}`);
  };

  const handleCODPayment = () => {
    toast.loading('Placing order...', { id: 'order' });
    handlePlaceOrder().then((order) => {
      if (order) {
        toast.success('Order placed successfully!', { id: 'order' });
      } else {
        toast.error('Failed to place order', { id: 'order' });
      }
    });
  };

  const steps = [
    { number: 1, title: 'Shipping', icon: FiTruck },
    { number: 2, title: 'Payment', icon: FiCreditCard },
    { number: 3, title: 'Review', icon: FiCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-12">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s.number
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s.number ? <FiCheck /> : <s.icon />}
            </div>
            <span
              className={`ml-2 font-medium hidden sm:block ${
                step >= s.number ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              {s.title}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-16 md:w-32 h-1 mx-2 sm:mx-4 ${
                  step > s.number ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Debug Section - Remove in production */}
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
              
              {addressLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && !showAddressForm && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-sm font-medium text-gray-700">Select a delivery address</h3>
                      <div className="grid gap-3">
                        {savedAddresses.map((address) => (
                          <div
                            key={address._id}
                            onClick={() => handleSelectAddress(address)}
                            className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedAddressId === address._id
                                ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedAddressId === address._id
                                    ? 'border-primary-600'
                                    : 'border-gray-300'
                                }`}>
                                  {selectedAddressId === address._id && (
                                    <div className="w-3 h-3 rounded-full bg-primary-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{address.fullName}</span>
                                    {address.isDefault && (
                                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                        Default
                                      </span>
                                    )}
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                      {address.addressType || 'home'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {address.addressLine1}
                                    {address.addressLine2 && `, ${address.addressLine2}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {address.city}, {address.state} {address.postalCode}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.country}</p>
                                  {address.phone && (
                                    <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                                  )}
                                </div>
                              </div>
                              {selectedAddressId === address._id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAddress();
                                  }}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <FiEdit2 size={14} />
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add New Address Button */}
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm mt-4"
                      >
                        <FiPlus size={18} />
                        Add a new address
                      </button>
                    </div>
                  )}

                  {/* Address Form */}
                  {(showAddressForm || savedAddresses.length === 0) && (
                    <form onSubmit={handleShippingSubmit} className="space-y-4">
                      {savedAddresses.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-700">
                            {isEditingAddress ? 'Edit Address' : 'Add New Address'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setIsEditingAddress(false);
                              // Reselect the previous address
                              if (selectedAddressId) {
                                const addr = savedAddresses.find(a => a._id === selectedAddressId);
                                if (addr) handleSelectAddress(addr);
                              }
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={shippingAddress.fullName}
                          onChange={handleShippingChange}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="street"
                          value={shippingAddress.street}
                          onChange={handleShippingChange}
                          className="input"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={shippingAddress.city}
                            onChange={handleShippingChange}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={shippingAddress.state}
                            onChange={handleShippingChange}
                            className="input"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={shippingAddress.postalCode}
                            onChange={handleShippingChange}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={shippingAddress.country}
                            onChange={handleShippingChange}
                            className="input"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={shippingAddress.phone}
                          onChange={handleShippingChange}
                          className="input"
                          required
                        />
                      </div>
                      
                      {/* Save to address book checkbox for new addresses */}
                      {!isEditingAddress && savedAddresses.length >= 0 && (
                        <div className="flex items-center gap-2 mt-4">
                          <input
                            type="checkbox"
                            id="saveAddress"
                            defaultChecked={true}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label htmlFor="saveAddress" className="text-sm text-gray-600">
                            Save this address to my address book
                          </label>
                        </div>
                      )}
                      
                      <button type="submit" className="btn-primary w-full py-3 mt-6">
                        {showAddressForm && savedAddresses.length > 0 
                          ? (isEditingAddress ? 'Update & Continue to Payment' : 'Save & Continue to Payment')
                          : 'Continue to Payment'
                        }
                      </button>
                    </form>
                  )}

                  {/* Continue button when address is selected */}
                  {!showAddressForm && selectedAddressId && (
                    <button
                      onClick={() => setStep(2)}
                      className="btn-primary w-full py-3 mt-6"
                    >
                      Deliver to this address
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Credit/Debit Card Option */}
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'Credit Card'
                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Credit Card"
                    checked={paymentMethod === 'Credit Card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-4 w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FiCreditCard className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">Credit/Debit Card</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Pay securely with Visa, Mastercard, or Amex</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-8" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-8" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-8" />
                  </div>
                </label>

                {/* UPI Option */}
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-4 w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span className="font-medium">UPI</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Pay using Google Pay, PhonePe, Paytm, or any UPI app</p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <div className="bg-white border rounded p-1">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path fill="#5F6368" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                      </svg>
                    </div>
                    <div className="bg-white border rounded p-1">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path fill="#5f259f" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/>
                      </svg>
                    </div>
                  </div>
                </label>

                {/* Cash on Delivery Option */}
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on Delivery"
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-4 w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Cash on Delivery</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Pay when you receive your order</p>
                  </div>
                  <div className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                    No Extra Charge
                  </div>
                </label>

                {/* Powered by Stripe badge */}
                <div className="flex items-center justify-center pt-4 border-t mt-4">
                  <span className="text-xs text-gray-400 mr-2">Secured by</span>
                  <svg className="h-5" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#635bff" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.9 10.9 0 0 1-4.56 1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.58zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-5.13L32.37 0v3.77l-4.13.88V.44zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.45-3.32.43zm-8.55 4.72c0 1.94 2.31 1.27 2.77 1.06v3.57c-.48.23-1.53.5-2.84.5-2.63 0-4.13-1.36-4.13-4.09l.02-13.71 4.12-.87v3.92h2.8v3.57h-2.8l.06 6.05zM4.58 8.31c-.96 0-1.6.43-1.6 1.14 0 .76.65 1.03 1.72 1.4l.69.23c2.82.9 4.27 2.2 4.27 4.68 0 3.1-2.53 4.54-5.95 4.54a11.9 11.9 0 0 1-3.71-.6V16.08a9.53 9.53 0 0 0 3.47.77c1.05 0 1.76-.34 1.76-1.14 0-.68-.64-1-1.85-1.42l-.57-.18c-2.37-.77-4.12-1.9-4.12-4.6 0-2.94 2.33-4.66 5.61-4.66 1.28 0 2.51.17 3.54.53v3.58a9.64 9.64 0 0 0-3.26-.65z"/>
                  </svg>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Back
                  </button>
                  <button type="submit" className="btn-primary flex-1 py-3">
                    Review Order
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
                <p className="text-gray-600">
                  {shippingAddress.fullName}<br />
                  {shippingAddress.street}<br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                  {shippingAddress.country}
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="text-primary-600 hover:text-primary-700 mt-2"
                >
                  Edit
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
                <p className="text-gray-600">{paymentMethod}</p>
                <button
                  onClick={() => setStep(2)}
                  className="text-primary-600 hover:text-primary-700 mt-2"
                >
                  Edit
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item._id} className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Section */}
              {paymentMethod === 'Credit Card' && stripePromise && !clientSecret && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Payment</h2>
                  <p className="text-gray-600 mb-4">
                    Click below to securely pay with your card.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      disabled={isProcessing}
                      className="btn-secondary flex-1 py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStripePayment}
                      disabled={isLoading || isProcessing}
                      className="btn-primary flex-1 py-3 flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <Spinner size="sm" className="mr-2" /> Processing...
                        </>
                      ) : (
                        <>
                          <FiCreditCard className="mr-2" /> Proceed to Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Stripe Card Form */}
              {paymentMethod === 'Credit Card' && stripePromise && clientSecret && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Card Details</h2>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm
                      onPaymentSuccess={handlePaymentSuccess}
                      onBack={() => {
                        dispatch(clearPaymentState());
                        setStep(2);
                      }}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                      amount={finalTotal}
                    />
                  </Elements>
                </div>
              )}

              {/* No Stripe Available */}
              {paymentMethod === 'Credit Card' && !stripePromise && !stripeLoading && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="font-medium text-yellow-800">Payment system unavailable</p>
                        <p className="text-sm text-yellow-700">Please try refreshing or choose another payment method.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="btn-secondary flex-1 py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        setStripeLoading(true);
                        dispatch(getPaymentConfig()).then((result) => {
                          if (getPaymentConfig.fulfilled.match(result) && result.payload.publishableKey) {
                            setStripePromise(loadStripe(result.payload.publishableKey));
                          } else {
                            toast.error('Failed to load payment system. Please try another payment method.');
                          }
                          setStripeLoading(false);
                        });
                      }}
                      className="btn-primary flex-1 py-3"
                    >
                      Retry Loading
                    </button>
                  </div>
                </div>
              )}

              {/* Stripe Loading */}
              {paymentMethod === 'Credit Card' && stripeLoading && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spinner size="lg" className="mb-4" />
                    <p className="text-gray-600">Loading payment system...</p>
                  </div>
                </div>
              )}

              {/* UPI Payment */}
              {paymentMethod === 'UPI' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Pay with UPI</h2>
                  {!clientSecret ? (
                    <>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900">UPI Payment</p>
                            <p className="text-sm text-purple-700">You'll be redirected to complete payment</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4 text-sm">
                        After clicking "Pay Now", you'll receive a payment request on your UPI app. 
                        Complete the payment within 5 minutes.
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep(2)}
                          disabled={isProcessing}
                          className="btn-secondary flex-1 py-3"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleStripePayment}
                          disabled={isLoading || isProcessing}
                          className="btn-primary flex-1 py-3 flex items-center justify-center bg-purple-600 hover:bg-purple-700"
                        >
                          {isProcessing ? (
                            <>
                              <Spinner size="sm" className="mr-2" /> Processing...
                            </>
                          ) : (
                            <>
                              Pay {formatPrice(finalTotal)} with UPI
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-purple-600 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                        <p className="font-medium text-gray-900 mb-2">Complete Payment in UPI App</p>
                        <p className="text-sm text-gray-500">Check your UPI app for the payment request</p>
                        <p className="text-2xl font-bold text-purple-600 mt-4">{formatPrice(finalTotal)}</p>
                      </div>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <StripePaymentForm
                          onPaymentSuccess={handlePaymentSuccess}
                          onBack={() => {
                            dispatch(clearPaymentState());
                            setStep(2);
                          }}
                          isProcessing={isProcessing}
                          setIsProcessing={setIsProcessing}
                          amount={finalTotal}
                        />
                      </Elements>
                    </div>
                  )}
                </div>
              )}

              {/* Cash on Delivery */}
              {paymentMethod === 'Cash on Delivery' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Cash on Delivery</h2>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FiDollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Pay on Delivery</p>
                        <p className="text-sm text-green-700">Pay {formatPrice(finalTotal)} when your order arrives</p>
                      </div>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-green-500" /> No additional charges
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-green-500" /> Pay with cash or card at delivery
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-green-500" /> Inspect before you pay
                    </li>
                  </ul>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="btn-secondary flex-1 py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCODPayment}
                      disabled={isLoading}
                      className="btn-primary flex-1 py-3 bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? <Spinner size="sm" /> : 'Confirm Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
            {/* Coupon Code Input */}
            <div className="mb-4 pb-4 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiTag className="inline mr-1" /> Promo Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-green-700">{appliedCoupon.code}</span>
                    <p className="text-xs text-green-600">
                      {appliedCoupon.discountType === 'percentage' 
                        ? `${appliedCoupon.discountValue}% off`
                        : `${formatPrice(appliedCoupon.discountValue)} off`}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-secondary text-sm px-3"
                  >
                    {couponLoading ? <Spinner size="sm" /> : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Wallet Balance Section */}
            <div className="mb-4 pb-4 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiDollarSign className="inline mr-1" /> Wallet Balance
              </label>
              {wallet?.balance > 0 ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-700 font-medium">
                      Available: {formatPrice(wallet.balance)}
                    </span>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useWalletBalance}
                        onChange={(e) => setUseWalletBalance(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Use wallet</span>
                    </label>
                  </div>
                  {useWalletBalance && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max={maxWalletUsable}
                          step="0.01"
                          value={walletAmountToUse}
                          onChange={(e) => setWalletAmountToUse(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Using: {formatPrice(actualWalletUsed)}
                        </span>
                        <button
                          onClick={() => setWalletAmountToUse(maxWalletUsable)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-sm">No wallet balance</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Redeem loyalty points to add funds to your wallet
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({items.length})</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span className="font-medium">-{formatPrice(discount)}</span>
                </div>
              )}
              {actualWalletUsed > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Wallet Payment</span>
                  <span className="font-medium">-{formatPrice(actualWalletUsed)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(finalTotal)}</span>
                </div>
                {(discount > 0 || actualWalletUsed > 0) && (
                  <p className="text-xs text-green-600 mt-1">You're saving {formatPrice(discount + actualWalletUsed)}!</p>
                )}
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center text-sm text-gray-500">
                <FiLock className="mr-2 text-green-600" />
                Secure checkout powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
