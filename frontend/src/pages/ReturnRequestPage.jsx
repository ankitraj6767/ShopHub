import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiArrowLeft,
  FiPackage,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiCamera,
  FiCalendar,
  FiClock,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { checkReturnEligibility, createReturn, clearSuccess, clearError } from '../store/slices/returnSlice';
import { formatPrice, formatDate } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const RETURN_REASONS = {
  wrong_item: 'Wrong item delivered',
  damaged_defective: 'Item damaged or defective',
  not_as_described: 'Not as described',
  quality_not_expected: 'Quality not as expected',
  wrong_size_fit: 'Wrong size/fit',
  changed_mind: 'Changed my mind',
  better_price_elsewhere: 'Found better price elsewhere',
  arrived_late: 'Item arrived late',
  missing_parts: 'Missing parts/accessories',
  other: 'Other reason',
};

const ITEM_CONDITIONS = {
  unopened: 'Unopened/Sealed',
  opened_unused: 'Opened but unused',
  opened_used: 'Opened and used',
  damaged: 'Damaged',
  defective: 'Defective',
};

const ReturnRequestPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { eligibility, isCheckingEligibility, isCreating, createSuccess, error } = useSelector(
    (state) => state.returns
  );
  
  const [step, setStep] = useState(1); // 1: Select Items, 2: Reason, 3: Refund Method, 4: Review
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('10:00 AM - 6:00 PM');
  const [images, setImages] = useState([]);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [showPolicy, setShowPolicy] = useState(false);
  
  useEffect(() => {
    dispatch(checkReturnEligibility(orderId));
  }, [dispatch, orderId]);
  
  // Debug eligibility response
  useEffect(() => {
    if (eligibility) {
      console.log('Return Eligibility Response:', eligibility);
    }
  }, [eligibility]);
  
  useEffect(() => {
    if (createSuccess) {
      toast.success('Return request submitted successfully!');
      dispatch(clearSuccess());
      navigate('/returns');
    }
  }, [createSuccess, dispatch, navigate]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  
  // Set default pickup date to 2 days from now
  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    setPickupDate(date.toISOString().split('T')[0]);
  }, []);
  
  const handleItemToggle = (item) => {
    const exists = selectedItems.find(i => i.productId === item.product.toString());
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.productId !== item.product.toString()));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: item.product.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          returnReason: reason,
          itemCondition: 'unopened',
        },
      ]);
    }
  };
  
  const handleQuantityChange = (productId, quantity) => {
    setSelectedItems(
      selectedItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.quantity)) }
          : item
      )
    );
  };
  
  const handleItemConditionChange = (productId, condition) => {
    setSelectedItems(
      selectedItems.map(item =>
        item.productId === productId ? { ...item, itemCondition: condition } : item
      )
    );
  };
  
  const calculateRefundAmount = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = eligibility?.order?.taxPrice / eligibility?.order?.itemsPrice || 0.08;
    const taxRefund = itemsTotal * taxRate;
    return {
      itemsTotal,
      taxRefund,
      total: itemsTotal + taxRefund,
    };
  };
  
  const handleSubmit = () => {
    const returnData = {
      orderId,
      items: selectedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        returnReason: reason,
        itemCondition: item.itemCondition,
      })),
      reason,
      reasonDetail,
      type: 'return',
      preferredRefundMethod: refundMethod,
      pickupDate,
      pickupTimeSlot,
      images,
    };
    
    dispatch(createReturn(returnData));
  };
  
  const canProceedToStep2 = selectedItems.length > 0;
  const canProceedToStep3 = reason && reasonDetail.length >= 20;
  const canProceedToStep4 = refundMethod;
  
  if (isCheckingEligibility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Checking return eligibility...</p>
        </div>
      </div>
    );
  }
  
  if (!eligibility?.eligible) {
    const orderStatus = eligibility?.order?.status;
    const isNotDelivered = orderStatus && orderStatus !== 'Delivered';
    const hasExistingReturn = eligibility?.existingReturn;
    const isWindowExpired = eligibility?.reason?.includes('expired');
    
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to={`/orders/${orderId}`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <FiArrowLeft className="mr-2" /> Back to Order
        </Link>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
            Return Not Available
          </h1>
          <p className="text-red-600 dark:text-red-300 mb-4">
            {eligibility?.reason || 'This order is not eligible for return.'}
          </p>
          
          {/* Show helpful info based on reason */}
          {isNotDelivered && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4 text-left">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <span className="font-semibold">Current Order Status:</span> {orderStatus}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                You can only request a return after your order has been delivered. 
                Please wait for delivery or track your order for updates.
              </p>
              <Link
                to={`/orders/${orderId}/tracking`}
                className="inline-flex items-center mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Track Order →
              </Link>
            </div>
          )}
          
          {isWindowExpired && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4 text-left">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The 30-day return window has expired. If you have any issues with your order, 
                please contact our support team for assistance.
              </p>
              <Link
                to="/help"
                className="inline-flex items-center mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Contact Support →
              </Link>
            </div>
          )}
          
          {hasExistingReturn && (
            <Link
              to={`/returns/${eligibility.existingReturn._id}`}
              className="btn btn-primary mt-4"
            >
              View Existing Return Request
            </Link>
          )}
          
          {!isNotDelivered && !isWindowExpired && !hasExistingReturn && (
            <Link
              to="/help"
              className="inline-flex items-center mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Need help? Contact Support →
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  const refundAmounts = calculateRefundAmount();
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to={`/orders/${orderId}`}
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Order
      </Link>
      
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Request a Return
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Order #{eligibility.order?.orderNumber?.slice(-8) || orderId.slice(-8).toUpperCase()}
      </p>
      
      {/* Return Window Alert */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiClock className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Return window: {eligibility.daysRemaining} days remaining
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Return deadline: {formatDate(eligibility.returnDeadline)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {['Select Items', 'Reason', 'Refund Method', 'Review'].map((label, index) => (
          <div key={label} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step > index + 1
                  ? 'bg-green-500 text-white'
                  : step === index + 1
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {step > index + 1 ? <FiCheck /> : index + 1}
            </div>
            <span
              className={`ml-2 text-sm whitespace-nowrap ${
                step === index + 1
                  ? 'text-primary-600 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {label}
            </span>
            {index < 3 && (
              <div className="w-8 md:w-16 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        ))}
      </div>
      
      {/* Step 1: Select Items */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select items to return
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose which items from your order you'd like to return
          </p>
          
          <div className="space-y-4">
            {eligibility.eligibleItems?.map((item) => {
              const isSelected = selectedItems.find(i => i.productId === item.product.toString());
              return (
                <div
                  key={item.product}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                  onClick={() => handleItemToggle(item)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                    </div>
                    
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=Product';
                      }}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quantity and condition selector (shown when selected) */}
                  {isSelected && (
                    <div className="mt-4 pl-10 grid grid-cols-1 md:grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantity to return
                        </label>
                        <select
                          value={isSelected.quantity}
                          onChange={(e) => handleQuantityChange(item.product.toString(), parseInt(e.target.value))}
                          className="input w-full"
                        >
                          {[...Array(item.quantity)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Item condition
                        </label>
                        <select
                          value={isSelected.itemCondition}
                          onChange={(e) => handleItemConditionChange(item.product.toString(), e.target.value)}
                          className="input w-full"
                        >
                          {Object.entries(ITEM_CONDITIONS).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {selectedItems.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Selected items</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedItems.length} item(s)
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Estimated refund</span>
                <span className="font-medium text-green-600">{formatPrice(refundAmounts.total)}</span>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="btn btn-primary px-8"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Reason */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Why are you returning?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Let us know the reason for your return
          </p>
          
          <div className="space-y-3 mb-6">
            {Object.entries(RETURN_REASONS).map(([key, value]) => (
              <label
                key={key}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  reason === key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={key}
                  checked={reason === key}
                  onChange={(e) => setReason(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    reason === key
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {reason === key && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-gray-900 dark:text-white">{value}</span>
              </label>
            ))}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Please provide more details (minimum 20 characters)
            </label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="Describe your reason in detail..."
              className="input w-full h-32 resize-none"
              minLength={20}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {reasonDetail.length}/20 characters minimum
            </p>
          </div>
          
          {/* Image Upload (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiCamera className="inline mr-2" />
              Upload photos (optional)
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Photos help us process your return faster, especially for damaged items
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="input w-full"
              onChange={(e) => {
                // Handle image upload
                const files = Array.from(e.target.files);
                // In production, upload to cloud storage
                toast.info('Image upload would be handled here');
              }}
            />
          </div>
          
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn btn-outline">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedToStep3}
              className="btn btn-primary px-8"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Refund Method */}
      {step === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose refund method
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select how you'd like to receive your refund
          </p>
          
          <div className="space-y-3 mb-6">
            {[
              {
                id: 'original_payment',
                title: 'Original Payment Method',
                description: 'Refund to the card/account used for payment',
                time: '5-7 business days',
              },
              {
                id: 'wallet',
                title: 'Store Wallet (Instant)',
                description: 'Get instant credit to use on future purchases',
                time: 'Instant',
                badge: 'Fastest',
              },
              {
                id: 'bank_transfer',
                title: 'Bank Transfer',
                description: 'Direct transfer to your bank account',
                time: '3-5 business days',
              },
            ].map((method) => (
              <label
                key={method.id}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  refundMethod === method.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value={method.id}
                  checked={refundMethod === method.id}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    refundMethod === method.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {refundMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{method.title}</span>
                    {method.badge && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{method.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Processing time: {method.time}
                  </p>
                </div>
              </label>
            ))}
          </div>
          
          {/* Pickup Schedule */}
          <div className="border-t dark:border-gray-700 pt-6 mt-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCalendar />
              Schedule Pickup
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Slot
                </label>
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="input w-full"
                >
                  <option value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</option>
                  <option value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</option>
                  <option value="10:00 AM - 6:00 PM">10:00 AM - 6:00 PM (Flexible)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <FiInfo className="inline mr-1" />
                Free pickup from your address. No need to ship the item yourself.
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(2)} className="btn btn-outline">
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!canProceedToStep4}
              className="btn btn-primary px-8"
            >
              Review Request
            </button>
          </div>
        </div>
      )}
      
      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Review Your Return Request
            </h2>
            
            {/* Items Summary */}
            <div className="border-b dark:border-gray-700 pb-4 mb-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Items to Return</h3>
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity} • {ITEM_CONDITIONS[item.itemCondition]}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Return Details */}
            <div className="border-b dark:border-gray-700 pb-4 mb-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Return Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Reason:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{RETURN_REASONS[reason]}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Refund Method:</span>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {refundMethod.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Pickup Date:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(pickupDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Time Slot:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{pickupTimeSlot}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Description:</span>
                <p className="text-gray-900 dark:text-white text-sm mt-1">{reasonDetail}</p>
              </div>
            </div>
            
            {/* Refund Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Refund Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Items Total</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(refundAmounts.itemsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax Refund</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(refundAmounts.taxRefund)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-gray-600">
                  <span className="text-gray-900 dark:text-white">Total Refund</span>
                  <span className="text-green-600">{formatPrice(refundAmounts.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Return Policy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <button
              onClick={() => setShowPolicy(!showPolicy)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <FiInfo /> Return Policy
              </span>
              {showPolicy ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {showPolicy && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>• Returns must be requested within 30 days of delivery</p>
                <p>• Items must be in original condition with tags attached</p>
                <p>• Refunds are processed within 5-7 business days after item inspection</p>
                <p>• Some items may not be eligible for return (final sale items)</p>
                <p>• Free pickup is available for all returns</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="btn btn-outline">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="btn btn-primary px-8"
            >
              {isCreating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Return Request'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRequestPage;
