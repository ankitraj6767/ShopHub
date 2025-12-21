import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiClock,
  FiAward,
  FiPlusCircle,
  FiMessageSquare,
  FiAlertCircle,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import {
  fetchMyTestimonials,
  submitTestimonial,
  updateTestimonial,
  deleteTestimonial,
  resetSubmitState,
} from '../store/slices/testimonialSlice';

const TestimonialPage = () => {
  const dispatch = useDispatch();
  const { myTestimonials, myLoading, myError, submitting, submitSuccess, submitError } = useSelector(
    (state) => state.testimonials
  );
  const { user } = useSelector((state) => state.auth);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    text: '',
    productName: '',
    orderReference: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    dispatch(fetchMyTestimonials());
  }, [dispatch]);

  useEffect(() => {
    if (submitSuccess) {
      setIsFormOpen(false);
      setEditingId(null);
      resetForm();
      const timer = setTimeout(() => {
        dispatch(resetSubmitState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, dispatch]);

  const resetForm = () => {
    setFormData({
      rating: 5,
      title: '',
      text: '',
      productName: '',
      orderReference: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim() || !formData.title.trim()) return;

    if (editingId) {
      await dispatch(updateTestimonial({ id: editingId, ...formData }));
    } else {
      await dispatch(submitTestimonial(formData));
    }
  };

  const handleEdit = (testimonial) => {
    setFormData({
      rating: testimonial.rating,
      title: testimonial.title,
      text: testimonial.text,
      productName: testimonial.productName || '',
      orderReference: testimonial.orderReference || '',
    });
    setEditingId(testimonial._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    await dispatch(deleteTestimonial(id));
    setDeleteConfirm(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    resetForm();
    dispatch(resetSubmitState());
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <FiClock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <FiCheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
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
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <FiMessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please login to share your shopping experience
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Testimonials
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your shopping experience and help others make informed decisions
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
            >
              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-300">
                {editingId
                  ? 'Your testimonial has been updated and will be reviewed again.'
                  : 'Thank you! Your testimonial has been submitted and is pending review.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Testimonial Button */}
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <FiPlusCircle className="w-5 h-5" />
            <span>Write a New Testimonial</span>
          </button>
        )}

        {/* Testimonial Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingId ? 'Edit Your Testimonial' : 'Share Your Experience'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-800 dark:text-red-300">
                    <FiAlertCircle className="w-5 h-5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Rating */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Overall Rating *
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingClick(star)}
                          className="focus:outline-none"
                        >
                          <FiStar
                            className={`w-8 h-8 transition-colors ${
                              star <= formData.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Summarize your experience"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Review Text */}
                  <div className="mb-4">
                    <label
                      htmlFor="text"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Your Experience *
                    </label>
                    <textarea
                      id="text"
                      name="text"
                      value={formData.text}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Tell us about your shopping experience, product quality, delivery, customer service, etc."
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formData.text.length}/500 characters
                    </p>
                  </div>

                  {/* Product Name (Optional) */}
                  <div className="mb-4">
                    <label
                      htmlFor="productName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Product Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      placeholder="Which product did you purchase?"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Order Reference (Optional) */}
                  <div className="mb-6">
                    <label
                      htmlFor="orderReference"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Order ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="orderReference"
                      name="orderReference"
                      value={formData.orderReference}
                      onChange={handleInputChange}
                      placeholder="Enter your order ID for verified purchase badge"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Adding your order ID helps verify your purchase
                    </p>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting || !formData.text.trim() || !formData.title.trim()}
                      className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <FiLoader className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FiCheck className="w-5 h-5" />
                          {editingId ? 'Update Testimonial' : 'Submit Testimonial'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {myLoading && (
          <div className="flex justify-center items-center py-16">
            <FiLoader className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {myError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-300">{myError}</p>
          </div>
        )}

        {/* My Testimonials List */}
        {!myLoading && myTestimonials.length === 0 && !isFormOpen && (
          <div className="text-center py-16">
            <FiMessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No testimonials yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Share your shopping experience and help other customers
            </p>
          </div>
        )}

        {!myLoading && myTestimonials.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Testimonials ({myTestimonials.length})
            </h2>
            
            {myTestimonials.map((testimonial) => (
              <motion.div
                key={testimonial._id}
                layout
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(testimonial.status)}
                      {testimonial.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          <FiAward className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mb-2">
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
                  
                  {testimonial.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(testimonial)}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(testimonial._id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {testimonial.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "{testimonial.text}"
                </p>

                {testimonial.productName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Product: <span className="font-medium text-gray-700 dark:text-gray-200">{testimonial.productName}</span>
                  </p>
                )}

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Submitted on {formatDate(testimonial.createdAt)}
                </p>

                {/* Rejection reason */}
                {testimonial.status === 'rejected' && testimonial.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      <strong>Reason:</strong> {testimonial.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Delete Confirmation */}
                <AnimatePresence>
                  {deleteConfirm === testimonial._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                        Are you sure you want to delete this testimonial?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(testimonial._id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Guidelines */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Testimonial Guidelines
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 inline-block text-left">
            <li className="flex items-start gap-2">
              <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Be honest and share your genuine experience</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Include details about products, delivery, and customer service</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Keep it respectful and constructive</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Testimonials are reviewed within 24-48 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Approved testimonials may be featured on our homepage</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestimonialPage;
