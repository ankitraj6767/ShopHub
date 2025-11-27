import { createSlice } from '@reduxjs/toolkit';

const MAX_ITEMS = 12;
const STORAGE_KEY = 'recentlyViewed';

// Load from localStorage
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
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
      
      // Remove if already exists
      state.items = state.items.filter((item) => item._id !== product._id);
      
      // Add to beginning
      state.items.unshift({
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        rating: product.rating,
        numReviews: product.numReviews,
        brand: product.brand,
        viewedAt: new Date().toISOString(),
      });
      
      // Limit to max items
      if (state.items.length > MAX_ITEMS) {
        state.items = state.items.slice(0, MAX_ITEMS);
      }
      
      // Save to localStorage
      saveToStorage(state.items);
    },
    clearRecentlyViewed: (state) => {
      state.items = [];
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { addToRecentlyViewed, clearRecentlyViewed } = recentlyViewedSlice.actions;

export const selectRecentlyViewed = (state) => state.recentlyViewed?.items || [];

export default recentlyViewedSlice.reducer;
