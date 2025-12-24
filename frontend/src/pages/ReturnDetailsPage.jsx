import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiDollarSign,
  FiRefreshCw,
  FiMapPin,
  FiMessageSquare,
  FiSend,
  FiCalendar,
  FiAlertCircle,
  FiPhone,
} from 'react-icons/fi';
import { fetchReturn, cancelReturn, addReturnMessage, clearSuccess, clearError } from '../store/slices/returnSlice';
import { formatPrice, formatDate, formatDateTime } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  requested: { label: 'Requested', color: 'bg-blue-500', icon: FiClock },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-500', icon: FiClock },
  approved: { label: 'Approved', color: 'bg-green-500', icon: FiCheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: FiXCircle },
  pickup_scheduled: { label: 'Pickup Scheduled', color: 'bg-indigo-500', icon: FiTruck },
  in_transit: { label: 'In Transit', color: 'bg-purple-500', icon: FiTruck },
  received: { label: 'Received', color: 'bg-teal-500', icon: FiPackage },
  inspecting: { label: 'Inspecting', color: 'bg-orange-500', icon: FiRefreshCw },
  inspection_passed: { label: 'Passed', color: 'bg-green-500', icon: FiCheckCircle },
  inspection_failed: { label: 'Failed', color: 'bg-red-500', icon: FiXCircle },
  processing_refund: { label: 'Processing Refund', color: 'bg-blue-500', icon: FiDollarSign },
  refund_completed: { label: 'Refund Complete', color: 'bg-green-500', icon: FiDollarSign },
  completed: { label: 'Completed', color: 'bg-green-500', icon: FiCheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: FiXCircle },
};

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

const ReturnDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentReturn, isLoading, isProcessing, cancelSuccess, error } = useSelector(
    (state) => state.returns
  );
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  
  useEffect(() => {
    dispatch(fetchReturn(id));
  }, [dispatch, id]);
  
  useEffect(() => {
    if (cancelSuccess) {
      toast.success('Return cancelled successfully');
      dispatch(clearSuccess());
      setShowCancelModal(false);
    }
  }, [cancelSuccess, dispatch]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  
  const handleCancelReturn = () => {
    dispatch(cancelReturn({ returnId: id, reason: cancelReason }));
  };
  
  const handleSendMessage = () => {
    if (message.trim().length < 5) {
      toast.error('Message must be at least 5 characters');
      return;
    }
    dispatch(addReturnMessage({ returnId: id, message }));
    setMessage('');
    setShowMessageForm(false);
    toast.success('Message sent');
  };
  
  const canCancel = currentReturn && ['requested', 'pending_approval', 'approved'].includes(currentReturn.status);
  
  if (isLoading || !currentReturn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  const statusConfig = STATUS_CONFIG[currentReturn.status] || STATUS_CONFIG.requested;
  const StatusIcon = statusConfig.icon;
  
  // Timeline steps
  const timelineSteps = [
    { status: 'requested', label: 'Requested' },
    { status: 'approved', label: 'Approved' },
    { status: 'pickup_scheduled', label: 'Pickup' },
    { status: 'received', label: 'Received' },
    { status: 'inspecting', label: 'Inspecting' },
    { status: 'completed', label: 'Completed' },
  ];
  
  const getCurrentStepIndex = () => {
    const statusMap = {
      requested: 0,
      pending_approval: 0,
      approved: 1,
      pickup_scheduled: 2,
      in_transit: 2,
      received: 3,
      inspecting: 4,
      inspection_passed: 4,
      inspection_failed: 4,
      processing_refund: 5,
      refund_completed: 5,
      completed: 5,
    };
    return statusMap[currentReturn.status] ?? 0;
  };
  
  const currentStepIndex = getCurrentStepIndex();
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/returns"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Returns
      </Link>
      
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Return #{currentReturn.returnNumber}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Requested on {formatDateTime(currentReturn.createdAt)}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.color} text-white`}>
          <StatusIcon className="w-5 h-5" />
          <span className="font-medium">{statusConfig.label}</span>
        </div>
      </div>
      
      {/* Progress Timeline */}
      {!['rejected', 'cancelled'].includes(currentReturn.status) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Return Progress</h2>
          <div className="relative">
            <div className="flex justify-between">
              {timelineSteps.map((step, index) => (
                <div key={step.status} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      index < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <FiCheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center ${
                      index <= currentStepIndex
                        ? 'text-primary-600 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Rejection Banner */}
      {currentReturn.status === 'rejected' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <FiXCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                Return Request Rejected
              </h3>
              <p className="text-red-700 dark:text-red-400">
                {currentReturn.rejectionReason || 'Your return request was rejected.'}
              </p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-2">
                Rejected on {formatDateTime(currentReturn.rejectedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Pickup Information */}
      {['pickup_scheduled', 'approved'].includes(currentReturn.status) && currentReturn.shipping && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <FiTruck className="w-8 h-8 text-indigo-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
                Pickup Scheduled
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {currentReturn.shipping.pickupDate && (
                  <div>
                    <span className="text-indigo-600 dark:text-indigo-400">Date:</span>
                    <p className="font-medium text-indigo-900 dark:text-indigo-200">
                      {formatDate(currentReturn.shipping.pickupDate)}
                    </p>
                  </div>
                )}
                {currentReturn.shipping.pickupTimeSlot && (
                  <div>
                    <span className="text-indigo-600 dark:text-indigo-400">Time Slot:</span>
                    <p className="font-medium text-indigo-900 dark:text-indigo-200">
                      {currentReturn.shipping.pickupTimeSlot}
                    </p>
                  </div>
                )}
              </div>
              {currentReturn.shipping.pickupAddress && (
                <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm">Pickup Address:</span>
                  <p className="text-indigo-900 dark:text-indigo-200 text-sm mt-1">
                    {currentReturn.shipping.pickupAddress.fullName}<br />
                    {currentReturn.shipping.pickupAddress.street}<br />
                    {currentReturn.shipping.pickupAddress.city}, {currentReturn.shipping.pickupAddress.state} {currentReturn.shipping.pickupAddress.postalCode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Refund Completed Banner */}
      {currentReturn.refund?.status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <FiDollarSign className="w-8 h-8 text-green-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                Refund Completed! 🎉
              </h3>
              <p className="text-green-700 dark:text-green-400">
                {formatPrice(currentReturn.refund.amount)} has been refunded to your{' '}
                {currentReturn.refund.method === 'wallet' ? 'store wallet' : 'original payment method'}.
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                Processed on {formatDateTime(currentReturn.refund.processedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiPackage />
              Items Being Returned
            </h2>
            <div className="space-y-4">
              {currentReturn.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 pb-4 border-b dark:border-gray-700 last:border-0 last:pb-0"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=Product';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Qty: {item.quantity} • {formatPrice(item.price)} each
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Condition: {ITEM_CONDITIONS[item.itemCondition] || item.itemCondition}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Return Reason */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              Return Reason
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Reason</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {RETURN_REASONS[currentReturn.reason] || currentReturn.reason}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Details</span>
                <p className="text-gray-700 dark:text-gray-300">{currentReturn.reasonDetail}</p>
              </div>
            </div>
          </div>
          
          {/* Status History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiClock />
              Status History
            </h2>
            <div className="space-y-4">
              {currentReturn.statusHistory
                ?.filter(h => h.isCustomerVisible !== false)
                .map((history, index) => {
                  const config = STATUS_CONFIG[history.status] || STATUS_CONFIG.requested;
                  const HistoryIcon = config.icon;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          index === 0 ? config.color + ' text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <HistoryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {config.label}
                        </p>
                        {history.note && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{history.note}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDateTime(history.changedAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiMessageSquare />
                Messages
              </h2>
              {!showMessageForm && (
                <button
                  onClick={() => setShowMessageForm(true)}
                  className="btn btn-sm btn-outline"
                >
                  Send Message
                </button>
              )}
            </div>
            
            {showMessageForm && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="input w-full h-24 resize-none mb-3"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowMessageForm(false)}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isProcessing || message.trim().length < 5}
                    className="btn btn-sm btn-primary"
                  >
                    <FiSend className="mr-1" />
                    Send
                  </button>
                </div>
              </div>
            )}
            
            {currentReturn.customerMessages?.length > 0 ? (
              <div className="space-y-3">
                {currentReturn.customerMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.sender === 'customer'
                        ? 'bg-primary-50 dark:bg-primary-900/20 ml-8'
                        : 'bg-gray-100 dark:bg-gray-700 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        msg.sender === 'customer'
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {msg.sender === 'customer' ? 'You' : 'Support'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(msg.sentAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{msg.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No messages yet. Send a message if you need assistance.
              </p>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Refund Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              Refund Summary
            </h2>
            <div className="space-y-3 text-sm">
              {currentReturn.refund?.breakdown && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Items Total</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(currentReturn.refund.breakdown.itemsTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax Refund</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(currentReturn.refund.breakdown.taxRefund)}
                    </span>
                  </div>
                  {currentReturn.refund.breakdown.restockingFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Restocking Fee</span>
                      <span>-{formatPrice(currentReturn.refund.breakdown.restockingFee)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total Refund</span>
                <span className="text-green-600">{formatPrice(currentReturn.refund?.amount || 0)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Refund Method</span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {currentReturn.refund?.method?.replace(/_/g, ' ') || 'Original Payment'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Refund Status</span>
                <span className={`font-medium capitalize ${
                  currentReturn.refund?.status === 'completed'
                    ? 'text-green-600'
                    : currentReturn.refund?.status === 'failed'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}>
                  {currentReturn.refund?.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Order Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              Order Information
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Order Number</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentReturn.order?.orderNumber || 'N/A'}
                </p>
              </div>
              {currentReturn.order?.createdAt && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Order Date</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(currentReturn.order.createdAt)}
                  </p>
                </div>
              )}
              <Link
                to={`/orders/${currentReturn.order?._id}`}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm"
              >
                View Order Details →
              </Link>
            </div>
          </div>
          
          {/* Actions */}
          {canCancel && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Actions
              </h2>
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-outline btn-error w-full"
              >
                <FiXCircle className="mr-2" />
                Cancel Return
              </button>
            </div>
          )}
          
          {/* Need Help */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Our support team is here to help with your return.
            </p>
            <div className="space-y-2">
              <Link
                to="/help"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
              >
                <FiPhone className="w-4 h-4" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Cancel Return Request
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to cancel this return request?
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="input w-full h-24 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-outline flex-1"
              >
                Keep Return
              </button>
              <button
                onClick={handleCancelReturn}
                disabled={isProcessing}
                className="btn btn-error flex-1"
              >
                {isProcessing ? <Spinner size="sm" /> : 'Cancel Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnDetailsPage;
