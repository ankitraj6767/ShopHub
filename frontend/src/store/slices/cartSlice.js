import { createSlice } from '@reduxjs/toolkit';

const CART_STORAGE_KEY = 'shophub_cart';

// Helper functions - now user-specific
const getCartStorageKey = (userId) => {
  return userId ? `${CART_STORAGE_KEY}_${userId}` : null;
};

const saveCartToStorage = (cartItems, userId) => {
  if (!userId) return; // Don't save cart for guest users
  const key = getCartStorageKey(userId);
  if (key) {
    localStorage.setItem(key, JSON.stringify(cartItems));
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
      state.items = items;
      const totals = calculateTotals(items);
      Object.assign(state, totals);
    },
    // Clear cart when user logs out
    clearUserCart: (state) => {
      state.items = [];
      state.itemsCount = 0;
      state.subtotal = 0;
      state.tax = 0;
      state.shipping = 0;
      state.total = 0;
      state.currentUserId = null;
    },
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find((item) => item._id === product._id);

      if (existingItem) {
        existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
      } else {
        state.items.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || '/placeholder.jpg',
          stock: product.stock,
          quantity: Math.min(quantity, product.stock),
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
  },
});

export const {
  loadUserCart,
  clearUserCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
