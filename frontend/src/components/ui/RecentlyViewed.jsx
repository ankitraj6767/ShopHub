import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiClock } from 'react-icons/fi';
import { selectRecentlyViewed } from '../../store/slices/recentlyViewedSlice';
import { formatPrice } from '../../utils/helpers';

const RecentlyViewed = ({ excludeId }) => {
  const items = useSelector(selectRecentlyViewed) || [];
  
  // Filter out current product if provided and ensure items have valid IDs
  const filteredItems = items.filter((item) => {
    // Must have a valid _id
    if (!item || !item._id) return false;
    // Exclude current product if specified
    if (excludeId && item._id === excludeId) return false;
    return true;
  });

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Viewed</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredItems.slice(0, 6).map((item) => (
          <Link
            key={item._id}
            to={`/products/${item._id}`}
            className="group"
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
              <img
                src={item.images?.[0]?.url || 'https://via.placeholder.com/200?text=Product'}
                alt={item.name || 'Product'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200?text=Product';
                }}
              />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {item.name || 'Unknown Product'}
            </h3>
            <p className="text-sm font-bold text-primary-600">
              {formatPrice(item.price || 0)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
