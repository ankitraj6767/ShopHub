import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/wishlist');
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wishlist'
      );
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async ({ productId, notes, priority, notifyOnSale }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/wishlist', {
        productId,
        notes,
        priority,
        notifyOnSale,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add to wishlist'
      );
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      return productId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove from wishlist'
      );
    }
  }
);

export const updateWishlistItem = createAsyncThunk(
  'wishlist/updateWishlistItem',
  async ({ productId, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/wishlist/${productId}`, updates);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update wishlist item'
      );
    }
  }
);

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/wishlist');
      return [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to clear wishlist'
      );
    }
  }
);

export const moveToCart = createAsyncThunk(
  'wishlist/moveToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.post(`/wishlist/${productId}/move-to-cart`, {
        quantity,
      });
      return { productId, cartItem: data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to move to cart'
      );
    }
  }
);

export const checkWishlist = createAsyncThunk(
  'wishlist/checkWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/wishlist/check/${productId}`);
      return { productId, inWishlist: data.inWishlist };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check wishlist'
      );
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  checkStatus: {}, // { productId: boolean }
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
    resetWishlist: (state) => {
      state.items = [];
      state.checkStatus = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items || [];
        // Update check status for all items
        state.checkStatus = {};
        state.items.forEach((item) => {
          if (item.product?._id) {
            state.checkStatus[item.product._id] = true;
          }
        });
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items || [];
        // Update check status
        state.items.forEach((item) => {
          if (item.product?._id) {
            state.checkStatus[item.product._id] = true;
          }
        });
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.product?._id !== action.payload
        );
        delete state.checkStatus[action.payload];
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update wishlist item
      .addCase(updateWishlistItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWishlistItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items || [];
      })
      .addCase(updateWishlistItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.checkStatus = {};
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Move to cart
      .addCase(moveToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moveToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.product?._id !== action.payload.productId
        );
        delete state.checkStatus[action.payload.productId];
      })
      .addCase(moveToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check wishlist
      .addCase(checkWishlist.fulfilled, (state, action) => {
        state.checkStatus[action.payload.productId] = action.payload.inWishlist;
      });
  },
});

export const { clearWishlistError, resetWishlist } = wishlistSlice.actions;

// Selectors
export const selectWishlistItems = (state) => state.wishlist?.items || [];
export const selectWishlistLoading = (state) => state.wishlist?.loading || false;
export const selectWishlistError = (state) => state.wishlist?.error || null;
export const selectIsInWishlist = (productId) => (state) =>
  state.wishlist?.checkStatus?.[productId] || false;
export const selectWishlistCount = (state) => state.wishlist?.items?.length || 0;

export default wishlistSlice.reducer;
