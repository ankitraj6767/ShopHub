import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiDollarSign,
  FiEye,
  FiAlertCircle,
  FiDownload,
  FiCalendar,
  FiBox,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import {
  fetchAllReturns,
  fetchReturnStats,
  clearError,
  clearSuccess,
} from '../../store/slices/returnSlice';
import { formatPrice, formatDate, formatDateTime, safeToLocaleTimeString } from '../../utils/helpers';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: FiClock },
  pending_approval: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: FiClock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: FiCheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: FiXCircle },
  pickup_scheduled: { label: 'Pickup', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: FiTruck },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: FiTruck },
  received: { label: 'Received', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400', icon: FiPackage },
  inspecting: { label: 'Inspecting', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: FiRefreshCw },
  inspection_passed: { label: 'Passed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: FiCheckCircle },
  inspection_failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: FiXCircle },
  processing_refund: { label: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: FiDollarSign },
  refund_completed: { label: 'Refunded', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: FiDollarSign },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: FiCheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400', icon: FiXCircle },
};

const RETURN_REASONS = {
  wrong_item: 'Wrong item',
  damaged_defective: 'Damaged/Defective',
  not_as_described: 'Not as described',
  quality_not_expected: 'Quality issue',
  wrong_size_fit: 'Wrong size/fit',
  changed_mind: 'Changed mind',
  better_price_elsewhere: 'Better price elsewhere',
  arrived_late: 'Late delivery',
  missing_parts: 'Missing parts',
  other: 'Other',
};

const AdminReturnsPage = () => {
  const dispatch = useDispatch();
  const {
    adminReturns,
    stats,
    statusCounts,
    pagination,
    isLoading,
    error,
    success,
  } = useSelector((state) => state.returns);
  
  const [filters, setFilters] = useState({
    status: '',
    reason: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReturns, setSelectedReturns] = useState([]);
  
  const fetchReturns = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 20,
      ...filters,
    };
    // Remove empty params
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });
    dispatch(fetchAllReturns(params));
  }, [dispatch, currentPage, filters]);
  
  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);
  
  useEffect(() => {
    dispatch(fetchReturnStats());
  }, [dispatch]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (success) {
      toast.success(success);
      dispatch(clearSuccess());
    }
  }, [error, success, dispatch]);
  
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setFilters({
      status: '',
      reason: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReturns(adminReturns.map((r) => r._id));
    } else {
      setSelectedReturns([]);
    }
  };
  
  const handleSelectReturn = (id) => {
    setSelectedReturns((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };
  
  const exportToCSV = () => {
    const headers = ['Return ID', 'Order ID', 'Customer', 'Status', 'Reason', 'Items', 'Refund Amount', 'Created'];
    const rows = adminReturns.map((r) => [
      r.returnNumber,
      r.order?.orderNumber || 'N/A',
      r.user?.name || 'N/A',
      r.status,
      RETURN_REASONS[r.reason] || r.reason,
      r.items?.length || 0,
      r.refund?.amount || 0,
      formatDate(r.createdAt),
    ]);
    
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `returns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const getStatusCounts = () => {
    if (!statusCounts || !Array.isArray(statusCounts)) return {};
    const counts = {};
    statusCounts.forEach((item) => {
      counts[item._id] = item.count;
    });
    return counts;
  };
  
  const statusCountsMap = getStatusCounts();
  
  // Calculate summary stats
  const pendingCount = (statusCountsMap.requested || 0) + (statusCountsMap.pending_approval || 0);
  const processingCount = (statusCountsMap.approved || 0) + (statusCountsMap.pickup_scheduled || 0) + 
    (statusCountsMap.in_transit || 0) + (statusCountsMap.received || 0) + (statusCountsMap.inspecting || 0);
  const completedCount = (statusCountsMap.completed || 0) + (statusCountsMap.refund_completed || 0);
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Returns Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and process customer return requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReturns}
            className="btn btn-outline btn-sm"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-outline btn-sm"
          >
            <FiDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-2 flex items-center">
            <FiClock className="mr-1" />
            Requires action
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{processingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FiRefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 flex items-center">
            <FiTruck className="mr-1" />
            Being processed
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center">
            <FiTrendingUp className="mr-1" />
            Successfully resolved
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(stats?.totalRefundAmount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2 flex items-center">
            <FiTrendingDown className="mr-1" />
            This period
          </p>
        </div>
      </div>
      
      {/* Quick Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleFilterChange('status', '')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filters.status === ''
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All ({pagination?.total || 0})
        </button>
        {Object.entries(STATUS_CONFIG).slice(0, 8).map(([status, config]) => (
          <button
            key={status}
            onClick={() => handleFilterChange('status', status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filters.status === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {config.label} ({statusCountsMap[status] || 0})
          </button>
        ))}
      </div>
      
      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by return ID, order ID, or customer..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline ${showFilters ? 'btn-primary' : ''}`}
          >
            <FiFilter className="mr-2" />
            Filters
            <FiChevronDown className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason
              </label>
              <select
                value={filters.reason}
                onChange={(e) => handleFilterChange('reason', e.target.value)}
                className="input w-full"
              >
                <option value="">All Reasons</option>
                {Object.entries(RETURN_REASONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                }}
                className="input w-full"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="refund.amount_desc">Highest Refund</option>
                <option value="refund.amount_asc">Lowest Refund</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Returns Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : adminReturns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No Returns Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filters.search || filters.status || filters.reason
                ? 'Try adjusting your filters'
                : 'Returns will appear here when customers submit them'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReturns.length === adminReturns.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Return
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Refund
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {adminReturns.map((returnItem) => {
                    const statusConfig = STATUS_CONFIG[returnItem.status] || STATUS_CONFIG.requested;
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr
                        key={returnItem._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedReturns.includes(returnItem._id)}
                            onChange={() => handleSelectReturn(returnItem._id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              #{returnItem.returnNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Order: {returnItem.order?.orderNumber || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {returnItem.user?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {returnItem.user?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {returnItem.user?.email || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {returnItem.items?.slice(0, 2).map((item, idx) => (
                              <img
                                key={idx}
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/40?text=?';
                                }}
                              />
                            ))}
                            {returnItem.items?.length > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{returnItem.items.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {RETURN_REASONS[returnItem.reason] || returnItem.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatPrice(returnItem.refund?.amount || 0)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {returnItem.refund?.method?.replace(/_/g, ' ') || 'Pending'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(returnItem.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {safeToLocaleTimeString(returnItem.createdAt, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/admin/returns/${returnItem._id}`}
                            className="btn btn-sm btn-outline"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * 20 + 1} to{' '}
                  {Math.min(currentPage * 20, pagination.total)} of {pagination.total} returns
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-sm btn-outline disabled:opacity-50"
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
                    disabled={currentPage === pagination.pages}
                    className="btn btn-sm btn-outline disabled:opacity-50"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReturnsPage;
