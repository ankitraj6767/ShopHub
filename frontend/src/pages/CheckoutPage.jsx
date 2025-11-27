import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCreditCard, FiTruck, FiCheck, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createOrder, clearSuccess } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { getPaymentConfig, createPaymentIntent, confirmPayment, clearPaymentState } from '../store/slices/paymentSlice';
import { formatPrice } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

// Stripe Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Stripe Payment Form Component
const StripePaymentForm = ({ onPaymentSuccess, onBack, isProcessing, setIsProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const { clientSecret, error: paymentError } = useSelector((state) => state.payment);
  const [cardError, setCardError] = useState(null);

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
      <div className="p-4 border rounded-lg bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-3 bg-white border rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
        {cardError && (
          <p className="text-red-500 text-sm mt-2">{cardError}</p>
        )}
      </div>

      <div className="flex items-center text-sm text-gray-500 mt-2">
        <FiLock className="mr-2" />
        Your payment is secured with 256-bit SSL encryption
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="btn-secondary flex-1 py-3"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="btn-primary flex-1 py-3 flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <Spinner size="sm" className="mr-2" /> Processing...
            </>
          ) : (
            <>
              <FiLock className="mr-2" /> Pay Now
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
  const cartState = useSelector((state) => state.cart) || {};
  const { items = [], subtotal = 0, tax = 0, shipping = 0, total = 0 } = cartState;
  const authState = useSelector((state) => state.auth) || {};
  const { user = null } = authState;
  const ordersState = useSelector((state) => state.orders) || {};
  const { isLoading = false, error = null, success = false, order = null } = ordersState;
  const paymentState = useSelector((state) => state.payment) || {};
  const { publishableKey, clientSecret } = paymentState;

  const [stripePromise, setStripePromise] = useState(null);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'USA',
    phone: user?.phone || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  // Load Stripe
  useEffect(() => {
    dispatch(getPaymentConfig()).then((result) => {
      if (getPaymentConfig.fulfilled.match(result) && result.payload.publishableKey) {
        setStripePromise(loadStripe(result.payload.publishableKey));
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (items.length === 0 && !success && !createdOrderId) {
      navigate('/cart');
    }
  }, [items, navigate, success, createdOrderId]);

  useEffect(() => {
    if (success && order) {
      dispatch(clearCart());
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

  const handleShippingChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
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
      })),
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        transactionId: paymentIntentId,
        status: paymentIntentId ? 'paid' : 'pending',
      },
    };

    const result = await dispatch(createOrder(orderData));
    if (createOrder.fulfilled.match(result)) {
      setCreatedOrderId(result.payload._id);
      return result.payload;
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
    dispatch(clearCart());
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
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
              <form onSubmit={handleShippingSubmit} className="space-y-4">
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
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3 mt-6">
                  Continue to Payment
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {[
                  { id: 'Credit Card', label: 'Credit/Debit Card', desc: 'Pay securely with Stripe' },
                  { id: 'Cash on Delivery', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === method.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4"
                    />
                    <div>
                      <span className="font-medium">{method.label}</span>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                    {method.id === 'Credit Card' && (
                      <div className="ml-auto flex gap-1">
                        <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
                        <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
                        <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-6" />
                      </div>
                    )}
                  </label>
                ))}

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
                    />
                  </Elements>
                </div>
              )}

              {/* No Stripe Available */}
              {paymentMethod === 'Credit Card' && !stripePromise && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    Card payment is currently unavailable. Please choose Cash on Delivery or try again later.
                  </p>
                </div>
              )}

              {/* Cash on Delivery */}
              {paymentMethod === 'Cash on Delivery' && (
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
                    className="btn-primary flex-1 py-3"
                  >
                    {isLoading ? <Spinner size="sm" /> : 'Place Order'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
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
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
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
