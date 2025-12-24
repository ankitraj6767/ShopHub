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
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiMessageSquare,
  FiSend,
  FiAlertCircle,
  FiCalendar,
  FiFileText,
  FiStar,
  FiEdit,
  FiEye,
  FiClipboard,
} from 'react-icons/fi';
import {
  fetchReturn,
  approveReturn,
  rejectReturn,
  updateReturnStatus,
  processReturnRefund,
  addAdminNote,
  updateQualityCheck,
  clearSuccess,
  clearError,
} from '../../store/slices/returnSlice';
import { formatPrice, formatDate, formatDateTime } from '../../utils/helpers';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  requested: { label: 'Requested', color: 'bg-blue-500', icon: FiClock, next: ['pending_approval', 'approved', 'rejected'] },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-500', icon: FiClock, next: ['approved', 'rejected'] },
  approved: { label: 'Approved', color: 'bg-green-500', icon: FiCheckCircle, next: ['pickup_scheduled'] },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: FiXCircle, next: [] },
  pickup_scheduled: { label: 'Pickup Scheduled', color: 'bg-indigo-500', icon: FiTruck, next: ['in_transit'] },
  in_transit: { label: 'In Transit', color: 'bg-purple-500', icon: FiTruck, next: ['received'] },
  received: { label: 'Received', color: 'bg-teal-500', icon: FiPackage, next: ['inspecting'] },
  inspecting: { label: 'Inspecting', color: 'bg-orange-500', icon: FiRefreshCw, next: ['inspection_passed', 'inspection_failed'] },
  inspection_passed: { label: 'Inspection Passed', color: 'bg-green-500', icon: FiCheckCircle, next: ['processing_refund'] },
  inspection_failed: { label: 'Inspection Failed', color: 'bg-red-500', icon: FiXCircle, next: [] },
  processing_refund: { label: 'Processing Refund', color: 'bg-blue-500', icon: FiDollarSign, next: ['refund_completed'] },
  refund_completed: { label: 'Refund Complete', color: 'bg-green-500', icon: FiDollarSign, next: ['completed'] },
  completed: { label: 'Completed', color: 'bg-green-500', icon: FiCheckCircle, next: [] },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: FiXCircle, next: [] },
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

const QUALITY_OPTIONS = ['good', 'fair', 'poor', 'damaged', 'defective'];

const AdminReturnDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentReturn, isLoading, isProcessing, success, error } = useSelector(
    (state) => state.returns
  );
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  
  // Form states
  const [approveNote, setApproveNote] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [qualityResult, setQualityResult] = useState('good');
  const [qualityNotes, setQualityNotes] = useState('');
  
  useEffect(() => {
    dispatch(fetchReturn(id));
  }, [dispatch, id]);
  
  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearSuccess());
      // Close all modals
      setShowApproveModal(false);
      setShowRejectModal(false);
      setShowStatusModal(false);
      setShowRefundModal(false);
      setShowNoteModal(false);
      setShowQualityModal(false);
      // Refresh data
      dispatch(fetchReturn(id));
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch, id]);
  
  useEffect(() => {
    if (currentReturn?.refund?.amount) {
      setRefundAmount(currentReturn.refund.amount.toString());
    }
    // Pre-fill preferred refund method
    if (currentReturn?.preferredRefundMethod) {
      setRefundMethod(currentReturn.preferredRefundMethod);
    }
  }, [currentReturn]);
  
  const handleApprove = () => {
    dispatch(approveReturn({
      returnId: id,
      note: approveNote,
      pickupDate: pickupDate || undefined,
      pickupTimeSlot: pickupTimeSlot || undefined,
    }));
  };
  
  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    dispatch(rejectReturn({ returnId: id, reason: rejectReason }));
  };
  
  const handleStatusUpdate = () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    dispatch(updateReturnStatus({ returnId: id, status: newStatus, note: statusNote }));
  };
  
  const handleProcessRefund = () => {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    if (!refundMethod) {
      toast.error('Please select a refund method');
      return;
    }
    dispatch(processReturnRefund({ 
      returnId: id, 
      refundMethod,
      adjustedAmount: amount, 
      note: refundNotes 
    }));
  };
  
  const handleAddNote = () => {
    if (!adminNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    dispatch(addAdminNote({ returnId: id, note: adminNote }));
    setAdminNote('');
  };
  
  const handleQualityCheck = () => {
    dispatch(updateQualityCheck({
      returnId: id,
      qualityCheckResult: qualityResult,
      qualityCheckNotes: qualityNotes,
    }));
  };
  
  if (isLoading || !currentReturn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  const statusConfig = STATUS_CONFIG[currentReturn.status] || STATUS_CONFIG.requested;
  const StatusIcon = statusConfig.icon;
  const canApprove = ['requested', 'pending_approval'].includes(currentReturn.status);
  const canReject = ['requested', 'pending_approval'].includes(currentReturn.status);
  const canProcessRefund = currentReturn.status === 'inspection_passed';
  const canUpdateQuality = currentReturn.status === 'inspecting';
  const nextStatuses = statusConfig.next || [];
  
  return (
    <div className="p-6">
      <Link
        to="/admin/returns"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Returns
      </Link>
      
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Return #{currentReturn.returnNumber}
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} text-white`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Created on {formatDateTime(currentReturn.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <button onClick={() => setShowApproveModal(true)} className="btn btn-success">
              <FiCheckCircle className="mr-2" />
              Approve
            </button>
          )}
          {canReject && (
            <button onClick={() => setShowRejectModal(true)} className="btn btn-error btn-outline">
              <FiXCircle className="mr-2" />
              Reject
            </button>
          )}
          {nextStatuses.length > 0 && (
            <button onClick={() => setShowStatusModal(true)} className="btn btn-primary">
              <FiRefreshCw className="mr-2" />
              Update Status
            </button>
          )}
          {canProcessRefund && (
            <button onClick={() => setShowRefundModal(true)} className="btn btn-success">
              <FiDollarSign className="mr-2" />
              Process Refund
            </button>
          )}
          {canUpdateQuality && (
            <button onClick={() => setShowQualityModal(true)} className="btn btn-warning">
              <FiClipboard className="mr-2" />
              Quality Check
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiPackage />
              Return Items ({currentReturn.items?.length || 0})
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <p className="text-gray-500 dark:text-gray-400">
                        Quantity: <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span>
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Price: <span className="font-medium text-gray-700 dark:text-gray-300">{formatPrice(item.price)}</span>
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Condition: <span className="font-medium text-gray-700 dark:text-gray-300">{ITEM_CONDITIONS[item.itemCondition] || item.itemCondition}</span>
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Total: <span className="font-medium text-gray-700 dark:text-gray-300">{formatPrice(item.price * item.quantity)}</span>
                      </p>
                    </div>
                  </div>
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
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium">
                  {RETURN_REASONS[currentReturn.reason] || currentReturn.reason}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{currentReturn.reasonDetail}</p>
              {currentReturn.images && currentReturn.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Customer Images:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentReturn.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Return evidence ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quality Check Results */}
          {currentReturn.qualityCheck?.result && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiClipboard />
                Quality Check Results
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400">Result:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    ['good', 'fair'].includes(currentReturn.qualityCheck.result)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {currentReturn.qualityCheck.result}
                  </span>
                </div>
                {currentReturn.qualityCheck.notes && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{currentReturn.qualityCheck.notes}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Checked on {formatDateTime(currentReturn.qualityCheck.checkedAt)} by {currentReturn.qualityCheck.checkedBy?.name || 'Admin'}
                </p>
              </div>
            </div>
          )}
          
          {/* Status History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiClock />
              Status History
            </h2>
            <div className="space-y-4">
              {currentReturn.statusHistory?.map((history, index) => {
                const config = STATUS_CONFIG[history.status] || STATUS_CONFIG.requested;
                const HistoryIcon = config.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        index === 0 ? config.color + ' text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <HistoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white">{config.label}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          history.isCustomerVisible !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {history.isCustomerVisible !== false ? 'Visible' : 'Internal'}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{history.note}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-500">
                        <span>{formatDateTime(history.changedAt)}</span>
                        {history.changedBy && (
                          <>
                            <span>•</span>
                            <span>by {history.changedBy.name || 'System'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Admin Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiFileText />
                Admin Notes
              </h2>
              <button
                onClick={() => setShowNoteModal(true)}
                className="btn btn-sm btn-outline"
              >
                Add Note
              </button>
            </div>
            {currentReturn.adminNotes?.length > 0 ? (
              <div className="space-y-3">
                {currentReturn.adminNotes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{note.note}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{note.addedBy?.name || 'Admin'}</span>
                      <span>•</span>
                      <span>{formatDateTime(note.addedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No admin notes yet.</p>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiUser />
              Customer
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-600">
                    {currentReturn.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentReturn.user?.name || 'Unknown'}
                  </p>
                  <Link to={`/admin/users/${currentReturn.user?._id}`} className="text-xs text-primary-600">
                    View Profile
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FiMail className="w-4 h-4" />
                {currentReturn.user?.email || 'N/A'}
              </div>
              {currentReturn.user?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FiPhone className="w-4 h-4" />
                  {currentReturn.user.phone}
                </div>
              )}
            </div>
          </div>
          
          {/* Refund Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiDollarSign />
              Refund Details
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
              <div className="flex justify-between text-xs pt-2 border-t dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Method</span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {currentReturn.refund?.method?.replace(/_/g, ' ') || 'Original Payment'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
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
              {currentReturn.refund?.transactionId && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                  <span className="text-gray-700 dark:text-gray-300 font-mono">
                    {currentReturn.refund.transactionId}
                  </span>
                </div>
              )}
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
                to={`/admin/orders/${currentReturn.order?._id}`}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm"
              >
                <FiEye className="mr-1" />
                View Order
              </Link>
            </div>
          </div>
          
          {/* Shipping Info */}
          {currentReturn.shipping && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiTruck />
                Shipping
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Method</span>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {currentReturn.returnShippingMethod?.replace(/_/g, ' ') || 'Pickup'}
                  </p>
                </div>
                {currentReturn.shipping.pickupDate && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Pickup Date</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(currentReturn.shipping.pickupDate)}
                    </p>
                  </div>
                )}
                {currentReturn.shipping.trackingNumber && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tracking</span>
                    <p className="font-medium text-gray-900 dark:text-white font-mono">
                      {currentReturn.shipping.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Approve Return
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pickup Time Slot
                </label>
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Time</option>
                  <option value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</option>
                  <option value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</option>
                  <option value="6:00 PM - 9:00 PM">6:00 PM - 9:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note for Customer
                </label>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Optional note visible to customer..."
                  className="input w-full h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowApproveModal(false)} className="btn btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleApprove} disabled={isProcessing} className="btn btn-success flex-1">
                {isProcessing ? <Spinner size="sm" /> : 'Approve Return'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Return
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="input w-full h-32 resize-none"
                required
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRejectModal(false)} className="btn btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleReject} disabled={isProcessing || !rejectReason.trim()} className="btn btn-error flex-1">
                {isProcessing ? <Spinner size="sm" /> : 'Reject Return'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Update Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Status</option>
                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status]?.label || status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional status update note..."
                  className="input w-full h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowStatusModal(false)} className="btn btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleStatusUpdate} disabled={isProcessing || !newStatus} className="btn btn-primary flex-1">
                {isProcessing ? <Spinner size="sm" /> : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Process Refund
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Refund Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select refund method</option>
                  <option value="wallet">💳 Wallet (Instant)</option>
                  <option value="original_payment">💰 Original Payment Method (5-7 days)</option>
                  <option value="bank_transfer">🏦 Bank Transfer (3-5 days)</option>
                </select>
                {currentReturn?.preferredRefundMethod && (
                  <p className="text-xs text-gray-500 mt-1">
                    Customer preferred: <span className="font-medium capitalize">{currentReturn.preferredRefundMethod.replace(/_/g, ' ')}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Refund Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="input w-full pl-8"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Original amount: {formatPrice(currentReturn?.refund?.amount || 0)}
                </p>
              </div>
              {refundMethod === 'wallet' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <span className="font-medium">Wallet Refund:</span> The amount will be instantly credited to the customer's wallet and can be used for future purchases.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Refund processing notes..."
                  className="input w-full h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRefundModal(false)} className="btn btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleProcessRefund} disabled={isProcessing || !refundMethod} className="btn btn-success flex-1">
                {isProcessing ? <Spinner size="sm" /> : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Quality Check Modal */}
      {showQualityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quality Check
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Result
                </label>
                <select
                  value={qualityResult}
                  onChange={(e) => setQualityResult(e.target.value)}
                  className="input w-full"
                >
                  {QUALITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="capitalize">{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={qualityNotes}
                  onChange={(e) => setQualityNotes(e.target.value)}
                  placeholder="Quality check notes..."
                  className="input w-full h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowQualityModal(false)} className="btn btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleQualityCheck} disabled={isProcessing} className="btn btn-warning flex-1">
                {isProcessing ? <Spinner size="sm" /> : 'Save Check'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add Admin Note
            </h3>
            <div>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter note..."
                className="input w-full h-32 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNoteModal(false)} className="btn btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleAddNote} disabled={isProcessing || !adminNote.trim()} className="btn btn-primary flex-1">
                {isProcessing ? <Spinner size="sm" /> : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnDetailPage;
