import { useState, useEffect } from 'react';
import { FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Verified Buyer',
    avatar: 'https://i.pravatar.cc/100?img=1',
    rating: 5,
    text: "Absolutely love shopping here! The quality of products is outstanding, and the delivery is always on time. The rewards program is a game-changer too!",
    product: 'Premium Wireless Headphones',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Gold Member',
    avatar: 'https://i.pravatar.cc/100?img=2',
    rating: 5,
    text: "Been a loyal customer for 2 years now. The customer service is exceptional, and I've never had any issues with returns or refunds. Highly recommended!",
    product: 'Smart Home Bundle',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Verified Buyer',
    avatar: 'https://i.pravatar.cc/100?img=3',
    rating: 5,
    text: "The flash sales are incredible! I saved over ₹15000 on my last purchase. The app is so easy to use, and tracking my order was seamless.",
    product: 'Designer Handbag',
  },
  {
    id: 4,
    name: 'James Wilson',
    role: 'Diamond Member',
    avatar: 'https://i.pravatar.cc/100?img=4',
    rating: 5,
    text: "As a Diamond member, the perks are fantastic. Free express shipping, exclusive deals, and priority support. ShopHub really values their customers!",
    product: 'Gaming Console',
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    role: 'Verified Buyer',
    avatar: 'https://i.pravatar.cc/100?img=5',
    rating: 4,
    text: "Great selection of products and competitive prices. The AI chat assistant helped me find exactly what I was looking for. Will definitely shop again!",
    product: 'Kitchen Appliance Set',
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust ShopHub for their shopping needs
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-0 right-0 text-primary-100 dark:text-primary-900/30 text-[200px] font-serif leading-none -mr-8 -mt-16 select-none">
              "
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonials[currentIndex].avatar}
                  alt={testimonials[currentIndex].name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-primary-100 dark:border-primary-800"
                />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {testimonials[currentIndex].name}
                  </h3>
                  <p className="text-sm text-primary-600">
                    {testimonials[currentIndex].role}
                  </p>
                </div>
                <div className="ml-auto flex">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonials[currentIndex].rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                "{testimonials[currentIndex].text}"
              </p>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Purchased: <span className="font-medium text-gray-700 dark:text-gray-200">{testimonials[currentIndex].product}</span>
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
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

          {/* Dots */}
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t dark:border-gray-700">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">50K+</p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Happy Customers</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">4.8</p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">99%</p>
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
