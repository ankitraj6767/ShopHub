import { createSlice } from '@reduxjs/toolkit';

const CART_STORAGE_KEY = 'shophub_cart';
const SAVED_FOR_LATER_KEY = 'shophub_saved_for_later';

// Helper functions - now user-specific
const getCartStorageKey = (userId) => {
  return userId ? `${CART_STORAGE_KEY}_${userId}` : null;
};

const getSavedForLaterKey = (userId) => {
  return userId ? `${SAVED_FOR_LATER_KEY}_${userId}` : null;
};

const saveCartToStorage = (cartItems, userId) => {
  if (!userId) return; // Don't save cart for guest users
  const key = getCartStorageKey(userId);
  if (key) {
    localStorage.setItem(key, JSON.stringify(cartItems));
  }
};

const saveSavedForLaterToStorage = (items, userId) => {
  if (!userId) return;
  const key = getSavedForLaterKey(userId);
  if (key) {
    localStorage.setItem(key, JSON.stringify(items));
  }
};

const loadCartFromLocalStorage = (userId) => {
  if (!userId) return []; // Guest users have empty cart
  try {
    const key = getCartStorageKey(userId);
    const cart = key ? localStorage.getItem(key) : null;
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

const loadSavedForLaterFromStorage = (userId) => {
  if (!userId) return [];
  try {
    const key = getSavedForLaterKey(userId);
    const saved = key ? localStorage.getItem(key) : null;
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const clearCartFromStorage = (userId) => {
  if (!userId) return;
  const key = getCartStorageKey(userId);
  if (key) {
    localStorage.removeItem(key);
  }
};

const calculateTotals = (items) => {
  const itemsCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  return {
    itemsCount,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

const initialState = {
  items: [],
  savedForLater: [],
  buyNowItem: null, // Single item for "Buy Now" direct checkout
  buyNowItems: [], // Multiple items for bundle "Buy Now" direct checkout
  itemsCount: 0,
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  currentUserId: null, // Track current user
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Load cart for a specific user
    loadUserCart: (state, action) => {
      const userId = action.payload;
      state.currentUserId = userId;
      const items = loadCartFromLocalStorage(userId);
      const savedForLater = loadSavedForLaterFromStorage(userId);
      state.items = items;
      state.savedForLater = savedForLater;
      const totals = calculateTotals(items);
      Object.assign(state, totals);
    },
    // Clear cart when user logs out
    clearUserCart: (state) => {
      state.items = [];
      state.savedForLater = [];
      state.itemsCount = 0;
      state.subtotal = 0;
      state.tax = 0;
      state.shipping = 0;
      state.total = 0;
      state.currentUserId = null;
    },
    addToCart: (state, action) => {
      const { product, quantity = 1, salePrice } = action.payload;
      const existingItem = state.items.find((item) => item._id === product._id);
      
      // Use sale price if provided, otherwise use regular price
      const itemPrice = salePrice || product.salePrice || product.price;

      if (existingItem) {
        existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
        // Update price in case it changed (e.g., sale started/ended)
        existingItem.price = itemPrice;
        existingItem.originalPrice = product.price;
      } else {
        state.items.push({
          _id: product._id,
          name: product.name,
          price: itemPrice,
          originalPrice: product.price,
          image: product.images?.[0]?.url || '/placeholder.jpg',
          stock: product.stock,
          quantity: Math.min(quantity, product.stock),
          isOnSale: salePrice ? true : false,
        });
      }

      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      saveCartToStorage(state.items, state.currentUserId);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((item) => item._id === productId);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item._id !== productId);
        } else {
          item.quantity = Math.min(quantity, item.stock);
        }
      }

      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      saveCartToStorage(state.items, state.currentUserId);
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item._id !== productId);

      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      saveCartToStorage(state.items, state.currentUserId);
    },
    clearCart: (state) => {
      // Clear cart but keep for user in storage (used after checkout)
      clearCartFromStorage(state.currentUserId);
      state.items = [];
      state.itemsCount = 0;
      state.subtotal = 0;
      state.tax = 0;
      state.shipping = 0;
      state.total = 0;
    },
    saveForLater: (state, action) => {
      const productId = action.payload;
      const item = state.items.find((item) => item._id === productId);
      
      if (item) {
        // Remove from cart
        state.items = state.items.filter((item) => item._id !== productId);
        
        // Add to saved for later (if not already there)
        if (!state.savedForLater.find((i) => i._id === productId)) {
          state.savedForLater.push(item);
        }
        
        const totals = calculateTotals(state.items);
        Object.assign(state, totals);
        saveCartToStorage(state.items, state.currentUserId);
        saveSavedForLaterToStorage(state.savedForLater, state.currentUserId);
      }
    },
    moveToCart: (state, action) => {
      const productId = action.payload;
      const item = state.savedForLater.find((item) => item._id === productId);
      
      if (item) {
        // Remove from saved for later
        state.savedForLater = state.savedForLater.filter((item) => item._id !== productId);
        
        // Add to cart (if not already there)
        const existingItem = state.items.find((i) => i._id === productId);
        if (existingItem) {
          existingItem.quantity = Math.min(existingItem.quantity + item.quantity, item.stock);
        } else {
          state.items.push(item);
        }
        
        const totals = calculateTotals(state.items);
        Object.assign(state, totals);
        saveCartToStorage(state.items, state.currentUserId);
        saveSavedForLaterToStorage(state.savedForLater, state.currentUserId);
      }
    },
    removeFromSavedForLater: (state, action) => {
      const productId = action.payload;
      state.savedForLater = state.savedForLater.filter((item) => item._id !== productId);
      saveSavedForLaterToStorage(state.savedForLater, state.currentUserId);
    },
    // Set item for direct "Buy Now" checkout (bypasses cart)
    setBuyNowItem: (state, action) => {
      const { product, quantity = 1, salePrice } = action.payload;
      const itemPrice = salePrice || product.salePrice || product.price;
      
      state.buyNowItem = {
        _id: product._id,
        name: product.name,
        price: itemPrice,
        originalPrice: product.price,
        image: product.images?.[0]?.url || '/placeholder.jpg',
        stock: product.stock,
        quantity: Math.min(quantity, product.stock),
        isOnSale: salePrice ? true : false,
      };
      state.buyNowItems = []; // Clear bundle items when setting single item
    },
    // Set multiple items for bundle "Buy Now" checkout
    setBuyNowItems: (state, action) => {
      const items = action.payload;
      state.buyNowItems = items.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice || item.price,
        image: item.image || '/placeholder.jpg',
        stock: item.stock,
        quantity: item.quantity || 1,
        isOnSale: item.isOnSale || false,
      }));
      state.buyNowItem = null; // Clear single item when setting bundle items
    },
    // Clear "Buy Now" item after checkout or cancellation
    clearBuyNowItem: (state) => {
      state.buyNowItem = null;
      state.buyNowItems = [];
    },
  },
});

export const {
  loadUserCart,
  clearUserCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  saveForLater,
  moveToCart,
  removeFromSavedForLater,
  setBuyNowItem,
  setBuyNowItems,
  clearBuyNowItem,
} = cartSlice.actions;

export default cartSlice.reducer;
