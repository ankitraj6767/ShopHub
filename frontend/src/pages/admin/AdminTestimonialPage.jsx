import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar,
  FiCheck,
  FiX,
  FiClock,
  FiAward,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEye,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiTrendingUp,
  FiUsers,
  FiThumbsUp,
} from 'react-icons/fi';
import {
  fetchAllTestimonialsAdmin,
  fetchTestimonialStats,
  approveTestimonialAdmin,
  rejectTestimonialAdmin,
  toggleFeaturedAdmin,
  deleteTestimonialAdmin,
} from '../../store/slices/testimonialSlice';

const AdminTestimonialPage = () => {
  const dispatch = useDispatch();
  const { adminTestimonials, adminPagination, adminStats, adminLoading, adminError } = useSelector(
    (state) => state.testimonials
  );

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
  });
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [actionModal, setActionModal] = useState({ type: null, testimonial: null });
  const [actionData, setActionData] = useState({
    rejectionReason: '',
    adminNotes: '',
    isFeatured: false,
    displayOrder: 0,
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAllTestimonialsAdmin(filters));
    dispatch(fetchTestimonialStats());
  }, [dispatch, filters.status, filters.page]);

  const handleSearch = () => {
    dispatch(fetchAllTestimonialsAdmin({ ...filters, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const openActionModal = (type, testimonial) => {
    setActionModal({ type, testimonial });
    setActionData({
      rejectionReason: '',
      adminNotes: testimonial?.adminNotes || '',
      isFeatured: testimonial?.isFeatured || false,
      displayOrder: testimonial?.displayOrder || 0,
    });
  };

  const closeActionModal = () => {
    setActionModal({ type: null, testimonial: null });
    setActionData({
      rejectionReason: '',
      adminNotes: '',
      isFeatured: false,
      displayOrder: 0,
    });
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await dispatch(
        approveTestimonialAdmin({
          id: actionModal.testimonial._id,
          isFeatured: actionData.isFeatured,
          displayOrder: actionData.displayOrder,
          adminNotes: actionData.adminNotes,
        })
      ).unwrap();
      closeActionModal();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!actionData.rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await dispatch(
        rejectTestimonialAdmin({
          id: actionModal.testimonial._id,
          rejectionReason: actionData.rejectionReason,
          adminNotes: actionData.adminNotes,
        })
      ).unwrap();
      closeActionModal();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
    setActionLoading(false);
  };

  const handleToggleFeatured = async (id) => {
    await dispatch(toggleFeaturedAdmin(id));
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await dispatch(deleteTestimonialAdmin(actionModal.testimonial._id)).unwrap();
      closeActionModal();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <FiClock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <FiCheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <FiXCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Testimonial Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review, approve, and manage customer testimonials
          </p>
        </div>

        {/* Stats Cards */}
        {adminStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiMessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {adminStats.total || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {adminStats.pending || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {adminStats.approved || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FiAward className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Featured</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {adminStats.featured || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FiTrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {adminStats.averageRating?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, title, or content..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <FiSearch className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Error State */}
        {adminError && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-300">{adminError}</p>
          </div>
        )}

        {/* Loading State */}
        {adminLoading && (
          <div className="flex justify-center items-center py-16">
            <FiLoader className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        )}

        {/* Testimonials List */}
        {!adminLoading && adminTestimonials.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <FiMessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No testimonials found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.status !== 'all' || filters.search
                ? 'Try adjusting your filters'
                : 'No testimonials have been submitted yet'}
            </p>
          </div>
        )}

        {!adminLoading && adminTestimonials.length > 0 && (
          <div className="space-y-4">
            {adminTestimonials.map((testimonial) => (
              <motion.div
                key={testimonial._id}
                layout
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4 lg:w-48 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                      {testimonial.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {testimonial.user?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {getStatusBadge(testimonial.status)}
                      {testimonial.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          <FiAward className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                      {testimonial.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          <FiCheckCircle className="w-3 h-3" />
                          Verified Purchase
                        </span>
                      )}
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {testimonial.title}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {testimonial.text}
                    </p>

                    {testimonial.productName && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Product: <span className="font-medium">{testimonial.productName}</span>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Submitted: {formatDate(testimonial.createdAt)}</span>
                      {testimonial.helpfulCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FiThumbsUp className="w-3 h-3" />
                          {testimonial.helpfulCount} helpful
                        </span>
                      )}
                      {testimonial.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FiEye className="w-3 h-3" />
                          {testimonial.viewCount} views
                        </span>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    {testimonial.status === 'rejected' && testimonial.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-300">
                          <strong>Rejection Reason:</strong> {testimonial.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {testimonial.adminNotes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Admin Notes:</strong> {testimonial.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:w-32 flex-shrink-0">
                    {testimonial.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openActionModal('approve', testimonial)}
                          className="flex-1 lg:flex-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openActionModal('reject', testimonial)}
                          className="flex-1 lg:flex-auto px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiX className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {testimonial.status === 'approved' && (
                      <button
                        onClick={() => handleToggleFeatured(testimonial._id)}
                        className={`flex-1 lg:flex-auto px-4 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          testimonial.isFeatured
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FiAward className="w-4 h-4" />
                        {testimonial.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                    )}
                    <button
                      onClick={() => openActionModal('delete', testimonial)}
                      className="flex-1 lg:flex-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {adminPagination && adminPagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {filters.page} of {adminPagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === adminPagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Action Modal */}
        <AnimatePresence>
          {actionModal.type && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={closeActionModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Approve Modal */}
                {actionModal.type === 'approve' && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Approve Testimonial
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Approve this testimonial from <strong>{actionModal.testimonial?.user?.name}</strong>?
                    </p>

                    <div className="space-y-4 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionData.isFeatured}
                          onChange={(e) =>
                            setActionData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                          }
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          Feature this testimonial on homepage
                        </span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          value={actionData.adminNotes}
                          onChange={(e) =>
                            setActionData((prev) => ({ ...prev, adminNotes: e.target.value }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          placeholder="Internal notes..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? (
                          <FiLoader className="w-5 h-5 animate-spin" />
                        ) : (
                          <FiCheck className="w-5 h-5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={closeActionModal}
                        disabled={actionLoading}
                        className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {/* Reject Modal */}
                {actionModal.type === 'reject' && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Reject Testimonial
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Reject this testimonial from <strong>{actionModal.testimonial?.user?.name}</strong>?
                    </p>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rejection Reason *
                        </label>
                        <textarea
                          value={actionData.rejectionReason}
                          onChange={(e) =>
                            setActionData((prev) => ({ ...prev, rejectionReason: e.target.value }))
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          placeholder="Explain why this testimonial was rejected..."
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          This will be visible to the user
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          value={actionData.adminNotes}
                          onChange={(e) =>
                            setActionData((prev) => ({ ...prev, adminNotes: e.target.value }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          placeholder="Internal notes (not visible to user)..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleReject}
                        disabled={actionLoading || !actionData.rejectionReason.trim()}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? (
                          <FiLoader className="w-5 h-5 animate-spin" />
                        ) : (
                          <FiX className="w-5 h-5" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={closeActionModal}
                        disabled={actionLoading}
                        className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {/* Delete Modal */}
                {actionModal.type === 'delete' && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Delete Testimonial
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Are you sure you want to permanently delete this testimonial from{' '}
                      <strong>{actionModal.testimonial?.user?.name}</strong>? This action cannot be undone.
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? (
                          <FiLoader className="w-5 h-5 animate-spin" />
                        ) : (
                          <FiTrash2 className="w-5 h-5" />
                        )}
                        Delete
                      </button>
                      <button
                        onClick={closeActionModal}
                        disabled={actionLoading}
                        className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminTestimonialPage;
