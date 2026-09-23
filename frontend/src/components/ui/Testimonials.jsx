import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiStar, FiChevronLeft, FiChevronRight, FiThumbsUp, FiCheckCircle, FiAward, FiLoader, FiEdit3 } from 'react-icons/fi';
import { fetchApprovedTestimonials, markTestimonialHelpful } from '../../store/slices/testimonialSlice';

const Testimonials = () => {
  const dispatch = useDispatch();
  const { testimonials, loading, error } = useSelector((state) => state.testimonials);
  const { user } = useSelector((state) => state.auth);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [helpedIds, setHelpedIds] = useState(new Set());

  useEffect(() => {
    dispatch(fetchApprovedTestimonials({ limit: 10, featured: false }));
  }, [dispatch]);

  useEffect(() => {
    if (!isAutoPlaying || !testimonials || testimonials.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials?.length]);

  const goToPrev = () => {
    if (!testimonials) return;
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    if (!testimonials) return;
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handleMarkHelpful = async (id) => {
    if (helpedIds.has(id)) return;
    try {
      await dispatch(markTestimonialHelpful(id)).unwrap();
      setHelpedIds((prev) => new Set([...prev, id]));
    } catch (err) {
      console.error('Failed to mark helpful:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Customers Say
            </h2>
          </div>
          <div className="flex justify-center items-center h-64">
            <FiLoader className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  // No testimonials state
  if (!loading && (!testimonials || testimonials.length === 0)) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Be the first to share your shopping experience with us!
            </p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <FiAward className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                No testimonials yet. Start shopping and share your experience!
              </p>
              <Link
                to={user ? "/testimonials" : "/login"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <FiEdit3 className="w-5 h-5" />
                Share Your Experience
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Join thousands of satisfied customers who trust ShopHub for their shopping needs
          </p>
          <Link
            to={user ? "/testimonials" : "/login"}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
          >
            <FiEdit3 className="w-4 h-4" />
            Share Your Experience
          </Link>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-0 right-0 text-primary-100 dark:text-primary-900/30 text-[200px] font-serif leading-none -mr-8 -mt-16 select-none">
              "
            </div>
            
            {/* Featured Badge */}
            {currentTestimonial.isFeatured && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <FiAward className="w-3 h-3" />
                Featured
              </div>
            )}
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                {/* Avatar with initials fallback */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center border-4 border-primary-100 dark:border-primary-800 text-white font-bold text-xl">
                  {currentTestimonial.user?.avatar ? (
                    <img
                      src={currentTestimonial.user.avatar}
                      alt={currentTestimonial.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(currentTestimonial.user?.name)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {currentTestimonial.user?.name || 'Anonymous'}
                    </h3>
                    {currentTestimonial.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                        <FiCheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    {formatDate(currentTestimonial.createdAt)}
                  </p>
                </div>
                <div className="ml-auto flex">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < currentTestimonial.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Title */}
              {currentTestimonial.title && (
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {currentTestimonial.title}
                </h4>
              )}
              
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                "{currentTestimonial.text}"
              </p>
              
              {/* Product Info */}
              {currentTestimonial.productName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Purchased: <span className="font-medium text-gray-700 dark:text-gray-200">{currentTestimonial.productName}</span>
                </p>
              )}
              
              {/* Helpful Button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleMarkHelpful(currentTestimonial._id)}
                  disabled={helpedIds.has(currentTestimonial._id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    helpedIds.has(currentTestimonial._id)
                      ? 'text-primary-600 dark:text-primary-400 cursor-default'
                      : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <FiThumbsUp className={`w-4 h-4 ${helpedIds.has(currentTestimonial._id) ? 'fill-current' : ''}`} />
                  <span>
                    {helpedIds.has(currentTestimonial._id) ? 'Thanks!' : 'Helpful'}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">
                    ({currentTestimonial.helpfulCount || 0})
                  </span>
                </button>
                
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {currentIndex + 1} of {testimonials?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          {testimonials?.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-12 h-12 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-12 h-12 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots */}
          {testimonials?.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-primary-600 w-8'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t dark:border-gray-700">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {testimonials?.length > 0 ? `${testimonials?.length}+` : '0'}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Happy Customers</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {testimonials?.length > 0
                ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials?.length).toFixed(1)
                : '0'}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {testimonials?.filter(t => t.rating >= 4).length > 0
                ? Math.round((testimonials.filter(t => t.rating >= 4).length / testimonials?.length) * 100)
                : 0}%
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Satisfaction Rate</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">24/7</p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Customer Support</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
