import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiBookmark, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { updateQuantity, removeFromCart, saveForLater, moveToCart, removeFromSavedForLater } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartState = useSelector((state) => state.cart) || {};
  const { 
    items = [], 
    savedForLater = [],
    itemsCount = 0, 
    subtotal = 0, 
    tax = 0, 
    shipping = 0, 
    total = 0 
  } = cartState;
  const authState = useSelector((state) => state.auth) || {};
  const { isAuthenticated = false } = authState;

  const handleQuantityChange = (productId, quantity, stock) => {
    if (quantity > stock) {
      toast.error(`Only ${stock} items available in stock`);
      return;
    }
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

  if (items.length === 0 && savedForLater.length === 0) {
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

  const handleSaveForLater = (productId) => {
    dispatch(saveForLater(productId));
    toast.success('Item saved for later');
  };

  const handleMoveToCart = (productId) => {
    dispatch(moveToCart(productId));
    toast.success('Item moved to cart');
  };

  const handleRemoveFromSaved = (productId) => {
    dispatch(removeFromSavedForLater(productId));
    toast.success('Item removed');
  };

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
                <div className="mt-1 flex items-center gap-2">
                  <p className={`font-bold ${item.isOnSale ? 'text-red-600' : 'text-primary-600'}`}>
                    {formatPrice(item.price)}
                  </p>
                  {item.isOnSale && item.originalPrice && item.originalPrice > item.price && (
                    <>
                      <p className="text-sm text-gray-400 line-through">
                        {formatPrice(item.originalPrice)}
                      </p>
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        SALE
                      </span>
                    </>
                  )}
                </div>
                {item.stock < 10 && (
                  <p className="text-sm text-orange-500 mt-1">
                    Only {item.stock} left in stock
                  </p>
                )}
                {item.quantity >= item.stock && (
                  <p className="text-sm text-red-500 mt-1">
                    Maximum quantity reached
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.stock)}
                  className="p-2 hover:bg-gray-100 transition"
                  disabled={item.quantity <= 1}
                >
                  <FiMinus className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-medium">{item.quantity}</span>
                <button
                  onClick={() => {
                    if (item.quantity >= item.stock) {
                      toast.error(`Only ${item.stock} items available in stock`);
                    } else {
                      handleQuantityChange(item._id, item.quantity + 1, item.stock);
                    }
                  }}
                  className={`p-2 hover:bg-gray-100 transition ${item.quantity >= item.stock ? 'opacity-50 cursor-not-allowed' : ''}`}
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

              {/* Remove and Save for Later */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSaveForLater(item._id)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition"
                  title="Save for later"
                >
                  <FiBookmark className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleRemove(item._id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  title="Remove"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
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

      {/* Saved for Later Section */}
      {savedForLater.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Saved for Later ({savedForLater.length} {savedForLater.length === 1 ? 'item' : 'items'})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {savedForLater.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm p-4">
                <Link to={`/products/${item._id}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200?text=Product';
                    }}
                  />
                </Link>
                <Link
                  to={`/products/${item._id}`}
                  className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2 text-sm"
                >
                  {item.name}
                </Link>
                <p className="text-primary-600 font-bold mt-2">{formatPrice(item.price)}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleMoveToCart(item._id)}
                    className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1"
                  >
                    <FiShoppingCart className="w-4 h-4" />
                    Move to Cart
                  </button>
                  <button
                    onClick={() => handleRemoveFromSaved(item._id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition border rounded-lg"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty Cart but has Saved Items */}
      {items.length === 0 && savedForLater.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-8">
          <FiShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-4">Move items from your saved list to cart or continue shopping.</p>
          <Link to="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
};

export default CartPage;
