import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiX, FiChevronUp, FiChevronDown, FiTrash2 } from 'react-icons/fi';
import {
  selectCompareItems,
  selectCompareOpen,
  removeFromCompare,
  clearCompare,
  toggleComparePanel,
} from '../../store/slices/compareSlice';
import { formatPrice } from '../../utils/helpers';

const CompareBar = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectCompareItems) || [];
  const isOpen = useSelector(selectCompareOpen) || false;

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Toggle Bar */}
      <div
        className="bg-primary-600 text-white py-2 px-4 flex items-center justify-between cursor-pointer hover:bg-primary-700"
        onClick={() => dispatch(toggleComparePanel())}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Compare Products ({products.length}/4)</span>
        </div>
        <div className="flex items-center gap-4">
          {products.length >= 2 && (
            <Link
              to="/compare"
              className="bg-white text-primary-600 px-4 py-1 rounded-lg text-sm font-medium hover:bg-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              Compare Now
            </Link>
          )}
          <button>
            {isOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="bg-white border-t shadow-lg p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Products to Compare</h3>
              <button
                onClick={() => dispatch(clearCompare())}
                className="text-red-600 text-sm hover:underline flex items-center gap-1"
              >
                <FiTrash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {products.map((item) => (
                <div key={item._id} className="relative bg-gray-50 rounded-lg p-3">
                  <button
                    onClick={() => dispatch(removeFromCompare(item._id))}
                    className="absolute top-1 right-1 p-1 bg-white rounded-full shadow hover:bg-red-50 text-gray-500 hover:text-red-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <Link to={`/products/${item._id}`} className="block">
                    <img
                      src={item.images?.[0]?.url || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-20 object-contain mb-2"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=Product';
                      }}
                    />
                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-sm font-bold text-primary-600">{formatPrice(item.price)}</p>
                  </Link>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: 4 - products.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center h-32"
                >
                  <span className="text-gray-400 text-sm">Add product</span>
                </div>
              ))}
            </div>

            {products.length >= 2 && (
              <div className="mt-4 text-center">
                <Link
                  to="/compare"
                  className="inline-block bg-primary-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-primary-700"
                >
                  Compare {products.length} Products
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareBar;
