import { createSlice } from '@reduxjs/toolkit';

const MAX_COMPARE = 4;
const STORAGE_KEY = 'compareProducts';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save compare list:', error);
  }
};

const initialState = {
  products: loadFromStorage(),
  isOpen: false,
};

const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      
      // Check if already in compare
      if (state.products.find((item) => item._id === product._id)) {
        return;
      }
      
      // Check max limit
      if (state.products.length >= MAX_COMPARE) {
        return;
      }
      
      state.products.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        rating: product.rating,
        numReviews: product.numReviews,
        brand: product.brand,
        category: product.category,
        description: product.description,
        stock: product.stock,
      });
      
      saveToStorage(state.products);
    },
    removeFromCompare: (state, action) => {
      state.products = state.products.filter((item) => item._id !== action.payload);
      saveToStorage(state.products);
    },
    clearCompare: (state) => {
      state.products = [];
      localStorage.removeItem(STORAGE_KEY);
    },
    toggleComparePanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    openComparePanel: (state) => {
      state.isOpen = true;
    },
    closeComparePanel: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  addToCompare,
  removeFromCompare,
  clearCompare,
  toggleComparePanel,
  openComparePanel,
  closeComparePanel,
} = compareSlice.actions;

export const selectCompareItems = (state) => state.compare?.products || [];
export const selectCompareOpen = (state) => state.compare?.isOpen || false;
export const selectIsInCompare = (productId) => (state) =>
  (state.compare?.products || []).some((item) => item._id === productId);

export default compareSlice.reducer;
