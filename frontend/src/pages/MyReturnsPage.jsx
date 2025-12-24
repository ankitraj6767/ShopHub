import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiDollarSign,
  FiRefreshCw,
  FiFilter,
  FiChevronRight,
  FiAlertCircle,
  FiMessageSquare,
} from 'react-icons/fi';
import { fetchMyReturns } from '../store/slices/returnSlice';
import { formatPrice, formatDate, formatDateTime } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import Pagination from '../components/ui/Pagination';

const STATUS_CONFIG = {
  requested: {
    label: 'Requested',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: FiClock,
    description: 'Your return request is being reviewed',
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: FiClock,
    description: 'Waiting for admin approval',
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: FiCheckCircle,
    description: 'Your return has been approved',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: FiXCircle,
    description: 'Your return request was rejected',
  },
  pickup_scheduled: {
    label: 'Pickup Scheduled',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: FiTruck,
    description: 'Pickup has been scheduled',
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: FiTruck,
    description: 'Your item is on the way back to us',
  },
  received: {
    label: 'Received',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    icon: FiPackage,
    description: 'We have received your returned item',
  },
  inspecting: {
    label: 'Inspecting',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    icon: FiRefreshCw,
    description: 'Your item is being inspected',
  },
  inspection_passed: {
    label: 'Inspection Passed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: FiCheckCircle,
    description: 'Item passed inspection',
  },
  inspection_failed: {
    label: 'Inspection Failed',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: FiXCircle,
    description: 'Item failed inspection',
  },
  processing_refund: {
    label: 'Processing Refund',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: FiDollarSign,
    description: 'Your refund is being processed',
  },
  refund_completed: {
    label: 'Refund Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: FiDollarSign,
    description: 'Refund has been sent',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: FiCheckCircle,
    description: 'Return process complete',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    icon: FiXCircle,
    description: 'Return was cancelled',
  },
};

const MyReturnsPage = () => {
  const dispatch = useDispatch();
  const { returns, isLoading, page, pages, total } = useSelector((state) => state.returns);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = { page: currentPage, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchMyReturns(params));
  }, [dispatch, currentPage, statusFilter]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.requested;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getProgressPercentage = (status) => {
    const statusOrder = [
      'requested', 'pending_approval', 'approved', 'pickup_scheduled', 
      'in_transit', 'received', 'inspecting', 'inspection_passed', 
      'processing_refund', 'refund_completed', 'completed'
    ];
    const index = statusOrder.indexOf(status);
    if (index === -1) return 0;
    return Math.round((index / (statusOrder.length - 1)) * 100);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            My Returns
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and manage your return requests
          </p>
        </div>
        <Link to="/orders" className="btn btn-outline">
          <FiPackage className="mr-2" />
          View Orders
        </Link>
      </div>

      {/* Quick Stats */}
      {returns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Returns</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {returns.filter(r => !['completed', 'rejected', 'cancelled'].includes(r.status)).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {returns.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Refunded</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(
                returns
                  .filter(r => r.refund?.status === 'completed')
                  .reduce((sum, r) => sum + (r.refund?.amount || 0), 0)
              )}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-48"
          >
            <option value="">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="in_transit">In Transit</option>
            <option value="received">Received</option>
            <option value="inspecting">Inspecting</option>
            <option value="processing_refund">Processing Refund</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Returns List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Returns Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {statusFilter
              ? 'No returns match the selected filter.'
              : "You haven't requested any returns yet."}
          </p>
          <Link to="/orders" className="btn btn-primary">
            View Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((returnItem) => (
            <Link
              key={returnItem._id}
              to={`/returns/${returnItem._id}`}
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Return #{returnItem.returnNumber}
                      </span>
                      {getStatusBadge(returnItem.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Requested on {formatDate(returnItem.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Refund Amount</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(returnItem.refund?.amount || 0)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {!['rejected', 'cancelled'].includes(returnItem.status) && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(returnItem.status)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${getProgressPercentage(returnItem.status)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Items Preview */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {returnItem.items?.slice(0, 3).map((item, index) => (
                      <img
                        key={index}
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg border-2 border-white dark:border-gray-800 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/48?text=Item';
                        }}
                      />
                    ))}
                    {returnItem.items?.length > 3 && (
                      <div className="w-12 h-12 rounded-lg border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          +{returnItem.items.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {returnItem.items?.length === 1
                        ? returnItem.items[0].name
                        : `${returnItem.items?.length || 0} items`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Order #{returnItem.order?.orderNumber?.slice(-8) || 'N/A'}
                    </p>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Status Description */}
                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center gap-2">
                  {returnItem.status === 'pickup_scheduled' && returnItem.shipping?.pickupDate && (
                    <>
                      <FiTruck className="w-4 h-4 text-indigo-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Pickup scheduled for {formatDate(returnItem.shipping.pickupDate)}
                      </p>
                    </>
                  )}
                  {returnItem.status === 'rejected' && (
                    <>
                      <FiAlertCircle className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-600 dark:text-red-400 truncate">
                        {returnItem.rejectionReason || 'Return request was rejected'}
                      </p>
                    </>
                  )}
                  {returnItem.status === 'completed' && returnItem.refund?.status === 'completed' && (
                    <>
                      <FiDollarSign className="w-4 h-4 text-green-500" />
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Refund of {formatPrice(returnItem.refund.amount)} completed
                      </p>
                    </>
                  )}
                  {!['rejected', 'completed', 'pickup_scheduled'].includes(returnItem.status) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {STATUS_CONFIG[returnItem.status]?.description || 'Processing your return'}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiMessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Need Help with a Return?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Our support team is available 24/7 to help with any return-related questions.
            </p>
            <Link
              to="/help"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyReturnsPage;
