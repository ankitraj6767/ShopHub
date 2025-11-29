import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiBookmark, FiShoppingCart, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { updateQuantity, removeFromCart, saveForLater, moveToCart, removeFromSavedForLater } from '../store/slices/cartSlice';
import { saveCart } from '../store/slices/activitySlice';
import { formatPrice } from '../utils/helpers';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [cartName, setCartName] = useState('');
  const [saving, setSaving] = useState(false);
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
          <FiShoppingBag className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
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

  const handleSaveCart = async () => {
    if (!cartName.trim()) {
      toast.error('Please enter a name for your cart');
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        saveCart({
          name: cartName.trim(),
          items: items.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
          })),
        })
      ).unwrap();
      toast.success('Cart saved successfully!');
      setShowSaveModal(false);
      setCartName('');
    } catch (error) {
      toast.error(error || 'Failed to save cart');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Shopping Cart ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center gap-4"
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
                  className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 line-clamp-2"
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
              <div className="flex items-center border dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.stock)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  disabled={item.quantity <= 1}
                >
                  <FiMinus className="w-4 h-4 dark:text-white" />
                </button>
                <span className="px-3 py-1 font-medium dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => {
                    if (item.quantity >= item.stock) {
                      toast.error(`Only ${item.stock} items available in stock`);
                    } else {
                      handleQuantityChange(item._id, item.quantity + 1, item.stock);
                    }
                  }}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${item.quantity >= item.stock ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiPlus className="w-4 h-4 dark:text-white" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-medium dark:text-white">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax (8%)</span>
                <span className="font-medium dark:text-white">{formatPrice(tax)}</span>
              </div>
              <div className="border-t dark:border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="dark:text-white">Total</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {shipping > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Add {formatPrice(100 - subtotal)} more for free shipping!
              </p>
            )}

            <button onClick={handleCheckout} className="btn-primary w-full mt-6 py-3">
              Proceed to Checkout
            </button>

            {isAuthenticated && items.length > 0 && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="w-full mt-3 py-2.5 border border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <FiSave className="w-4 h-4" />
                Save Cart for Later
              </button>
            )}

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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Saved for Later ({savedForLater.length} {savedForLater.length === 1 ? 'item' : 'items'})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {savedForLater.map((item) => (
              <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
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
                  className="font-medium text-gray-900 dark:text-white hover:text-primary-600 line-clamp-2 text-sm"
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
                    className="p-2 text-gray-400 hover:text-red-500 transition border dark:border-gray-600 rounded-lg"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center mb-8">
          <FiShoppingBag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Move items from your saved list to cart or continue shopping.</p>
          <Link to="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      )}

      {/* Save Cart Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Save Cart for Later
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Give your cart a name to easily find it later
            </p>
            <input
              type="text"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              placeholder="e.g., Monthly Groceries, Birthday Gifts"
              className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCart}
                disabled={saving || !cartName.trim()}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save Cart
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              You can access saved carts from your account menu
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
