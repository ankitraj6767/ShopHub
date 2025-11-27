import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiX, FiShoppingCart, FiHeart, FiStar, FiCheck, FiMinus } from 'react-icons/fi';
import { selectCompareItems, removeFromCompare, clearCompare } from '../store/slices/compareSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

const ComparePage = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectCompareItems) || [];

  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart');
  };

  const handleAddToWishlist = (product) => {
    dispatch(addToWishlist({ productId: product._id }));
    toast.success('Added to wishlist');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Compare Products</h1>
        <p className="text-gray-600 mb-8">You haven't added any products to compare yet.</p>
        <Link
          to="/products"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const specs = [
    { key: 'price', label: 'Price', render: (item) => formatPrice(item.price) },
    { key: 'brand', label: 'Brand', render: (item) => item.brand || '-' },
    { key: 'category', label: 'Category', render: (item) => item.category || '-' },
    { key: 'rating', label: 'Rating', render: (item) => (
      <div className="flex items-center gap-1">
        <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
        <span>{item.rating?.toFixed(1) || 'N/A'}</span>
        <span className="text-gray-500 text-sm">({item.numReviews || 0})</span>
      </div>
    )},
    { key: 'stock', label: 'Availability', render: (item) => (
      item.stock > 0 ? (
        <span className="text-green-600 flex items-center gap-1">
          <FiCheck className="w-4 h-4" /> In Stock ({item.stock})
        </span>
      ) : (
        <span className="text-red-600">Out of Stock</span>
      )
    )},
    { key: 'description', label: 'Description', render: (item) => (
      <p className="text-sm text-gray-600 line-clamp-3">{item.description || '-'}</p>
    )},
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Compare Products ({items.length})</h1>
        <div className="flex gap-4">
          <button
            onClick={() => dispatch(clearCompare())}
            className="text-red-600 hover:underline text-sm"
          >
            Clear All
          </button>
          <Link to="/products" className="text-primary-600 hover:underline text-sm">
            Add More Products
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-left bg-gray-50 font-medium text-gray-600 w-40">
                Product
              </th>
              {items.map((item) => (
                <th key={item._id} className="p-4 text-center min-w-[200px] border-l">
                  <div className="relative">
                    <button
                      onClick={() => dispatch(removeFromCompare(item._id))}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow hover:bg-red-50 text-gray-400 hover:text-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                    <Link to={`/products/${item._id}`}>
                      <img
                        src={item.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item.name}
                        className="w-32 h-32 object-contain mx-auto mb-2"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Product';
                        }}
                      />
                      <h3 className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                  </div>
                </th>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                <th key={`empty-${i}`} className="p-4 text-center min-w-[200px] border-l bg-gray-50">
                  <Link
                    to="/products"
                    className="flex flex-col items-center justify-center h-40 text-gray-400 hover:text-primary-600"
                  >
                    <div className="w-12 h-12 border-2 border-dashed border-current rounded-lg flex items-center justify-center mb-2">
                      +
                    </div>
                    <span className="text-sm">Add Product</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Action Row */}
            <tr className="border-t">
              <td className="p-4 bg-gray-50 font-medium text-gray-600">Actions</td>
              {items.map((item) => (
                <td key={item._id} className="p-4 text-center border-l">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock === 0}
                      className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      <FiShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleAddToWishlist(item)}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <FiHeart className="w-4 h-4" />
                      Wishlist
                    </button>
                  </div>
                </td>
              ))}
              {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                <td key={`empty-action-${i}`} className="p-4 border-l bg-gray-50"></td>
              ))}
            </tr>

            {/* Spec Rows */}
            {specs.map((spec) => (
              <tr key={spec.key} className="border-t">
                <td className="p-4 bg-gray-50 font-medium text-gray-600">{spec.label}</td>
                {items.map((item) => (
                  <td key={item._id} className="p-4 text-center border-l">
                    {spec.render(item)}
                  </td>
                ))}
                {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                  <td key={`empty-${spec.key}-${i}`} className="p-4 border-l bg-gray-50">
                    <FiMinus className="w-4 h-4 mx-auto text-gray-300" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
