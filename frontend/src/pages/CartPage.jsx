import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { updateQuantity, removeFromCart } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartState = useSelector((state) => state.cart) || {};
  const { 
    items = [], 
    itemsCount = 0, 
    subtotal = 0, 
    tax = 0, 
    shipping = 0, 
    total = 0 
  } = cartState;
  const authState = useSelector((state) => state.auth) || {};
  const { isAuthenticated = false } = authState;

  const handleQuantityChange = (productId, quantity) => {
    dispatch(updateQuantity({ productId, quantity }));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <FiShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">
            {isAuthenticated 
              ? "Looks like you haven't added any products to your cart yet."
              : "Please login to add items to your cart and view your saved cart."}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/products" className="btn-primary">
              Start Shopping
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4"
            >
              {/* Image */}
              <Link to={`/products/${item._id}`} className="flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100?text=Product';
                  }}
                />
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item._id}`}
                  className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
                >
                  {item.name}
                </Link>
                <p className="text-primary-600 font-bold mt-1">
                  {formatPrice(item.price)}
                </p>
                {item.stock < 10 && (
                  <p className="text-sm text-orange-500 mt-1">
                    Only {item.stock} left in stock
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  className="p-2 hover:bg-gray-100 transition"
                  disabled={item.quantity <= 1}
                >
                  <FiMinus className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                  className="p-2 hover:bg-gray-100 transition"
                  disabled={item.quantity >= item.stock}
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(item._id)}
                className="p-2 text-gray-400 hover:text-red-500 transition"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8%)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {shipping > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Add {formatPrice(100 - subtotal)} more for free shipping!
              </p>
            )}

            <button onClick={handleCheckout} className="btn-primary w-full mt-6 py-3">
              Proceed to Checkout
            </button>

            <Link
              to="/products"
              className="block text-center text-primary-600 hover:text-primary-700 mt-4"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
