import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSave,
  FiShoppingBag,
  FiTrash2,
  FiShoppingCart,
  FiPlus,
  FiEdit3,
  FiPackage,
} from 'react-icons/fi';
import {
  fetchSavedCarts,
  deleteSavedCart,
  saveCart,
} from '../store/slices/activitySlice';
import { addToCart } from '../store/slices/cartSlice';
import { formatPrice, safeToLocaleDateString } from '../utils/helpers';
import toast from 'react-hot-toast';

const SavedCartsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { savedCarts, savedCartsLoading } = useSelector((state) => state.activity);
  const { items: cartItems } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [cartName, setCartName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchSavedCarts());
    }
  }, [dispatch, isAuthenticated]);

  const handleSaveCurrentCart = async () => {
    if (!cartName.trim()) {
      toast.error('Please enter a name for your cart');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      await dispatch(
        saveCart({
          name: cartName.trim(),
          items: cartItems.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
          })),
        })
      ).unwrap();
      toast.success('Cart saved successfully!');
      setShowSaveModal(false);
      setCartName('');
      dispatch(fetchSavedCarts());
    } catch (error) {
      toast.error(error || 'Failed to save cart');
    }
  };

  const handleDeleteCart = async (cartId) => {
    try {
      await dispatch(deleteSavedCart(cartId)).unwrap();
      toast.success('Cart deleted');
    } catch (error) {
      toast.error(error || 'Failed to delete cart');
    }
  };

  const handleLoadCart = (cart) => {
    let addedCount = 0;
    cart.items.forEach((item) => {
      if (item.product && item.product.stock > 0) {
        dispatch(
          addToCart({
            ...item.product,
            quantity: Math.min(item.quantity, item.product.stock),
          })
        );
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`${addedCount} items added to cart!`);
      navigate('/cart');
    } else {
      toast.error('No available items to add');
    }
  };

  const calculateCartTotal = (items) => {
    return items.reduce((sum, item) => {
      if (item.product) {
        return sum + item.product.price * item.quantity;
      }
      return sum;
    }, 0);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <FiSave className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view your saved carts
          </h2>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiSave className="text-primary-500" />
            Saved Carts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Save your cart for later and reorder with one click
          </p>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Save Current Cart
          </button>
        )}
      </div>

      {/* Saved Carts List */}
      {savedCartsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : savedCarts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <FiShoppingBag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No saved carts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add items to your cart and save it for quick reordering later
          </p>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {savedCarts.map((cart) => (
              <motion.div
                key={cart._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Cart Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{cart.name}</h3>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm">
                      {cart.items.length} items
                    </span>
                  </div>
                  <p className="text-primary-100 text-sm mt-1">
                    Saved on {safeToLocaleDateString(cart.createdAt)}
                  </p>
                </div>

                {/* Cart Items Preview */}
                <div className="p-4 max-h-60 overflow-y-auto">
                  {cart.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 py-2 ${
                        index !== cart.items.length - 1
                          ? 'border-b dark:border-gray-700'
                          : ''
                      }`}
                    >
                      {item.product ? (
                        <>
                          <img
                            src={item.product.images?.[0]?.url || '/placeholder.jpg'}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity} × {formatPrice(item.product.price)}
                            </p>
                          </div>
                          {item.product.stock === 0 && (
                            <span className="text-xs text-red-500">Out of stock</span>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <FiPackage className="w-5 h-5" />
                          <span className="text-sm">Product unavailable</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Cart Footer */}
                <div className="border-t dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 dark:text-gray-400">Total:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(calculateCartTotal(cart.items))}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadCart(cart)}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      <FiShoppingCart className="w-4 h-4" />
                      Load Cart
                    </button>
                    <button
                      onClick={() => handleDeleteCart(cart._id)}
                      className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Save Cart Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Save Current Cart
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Give your cart a name so you can easily find it later
              </p>
              <input
                type="text"
                value={cartName}
                onChange={(e) => setCartName(e.target.value)}
                placeholder="e.g., Monthly Groceries, Office Supplies"
                className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCurrentCart}
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedCartsPage;
