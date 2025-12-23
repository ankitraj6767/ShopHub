import { createSlice } from '@reduxjs/toolkit';

const MAX_ITEMS = 12;
const STORAGE_KEY = 'recentlyViewed';

// Load from localStorage
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored);
    // Validate items have required fields
    return items.filter(item => item && item._id && item.name);
  } catch {
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

// Save to localStorage
const saveToStorage = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save recently viewed:', error);
  }
};

const initialState = {
  items: loadFromStorage(),
};

const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState,
  reducers: {
    addToRecentlyViewed: (state, action) => {
      const product = action.payload;
      
      // Validate product has required fields
      if (!product || !product._id || !product.name) {
        console.warn('Invalid product data for recently viewed:', product);
        return;
      }
      
      // Remove if already exists
      state.items = state.items.filter((item) => item._id !== product._id);
      
      // Add to beginning with all required data
      state.items.unshift({
        _id: product._id,
        name: product.name,
        price: product.price || 0,
        images: product.images || [],
        rating: product.rating || 0,
        numReviews: product.numReviews || 0,
        brand: product.brand || '',
        viewedAt: new Date().toISOString(),
      });
      
      // Limit to max items
      if (state.items.length > MAX_ITEMS) {
        state.items = state.items.slice(0, MAX_ITEMS);
      }
      
      // Save to localStorage
      saveToStorage(state.items);
    },
    removeFromRecentlyViewed: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item._id !== productId);
      saveToStorage(state.items);
    },
    clearRecentlyViewed: (state) => {
      state.items = [];
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { addToRecentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed } = recentlyViewedSlice.actions;

export const selectRecentlyViewed = (state) => state.recentlyViewed?.items || [];

export default recentlyViewedSlice.reducer;
