import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchRecommendations = createAsyncThunk(
  'activity/fetchRecommendations',
  async (limit = 12, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/activity/recommendations?limit=${limit}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch recommendations'
      );
    }
  }
);

export const fetchQuickBuyList = createAsyncThunk(
  'activity/fetchQuickBuyList',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/activity/quick-buy');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch quick buy list'
      );
    }
  }
);

export const fetchSavedCarts = createAsyncThunk(
  'activity/fetchSavedCarts',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/activity/saved-carts');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch saved carts'
      );
    }
  }
);

export const saveCart = createAsyncThunk(
  'activity/saveCart',
  async ({ name, items }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/activity/save-cart', { name, items });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to save cart'
      );
    }
  }
);

export const deleteSavedCart = createAsyncThunk(
  'activity/deleteSavedCart',
  async (cartId, { rejectWithValue }) => {
    try {
      await api.delete(`/activity/saved-carts/${cartId}`);
      return cartId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete saved cart'
      );
    }
  }
);

export const fetchPriceAlerts = createAsyncThunk(
  'activity/fetchPriceAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/activity/price-alerts');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch price alerts'
      );
    }
  }
);

export const createPriceAlert = createAsyncThunk(
  'activity/createPriceAlert',
  async ({ productId, targetPrice }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/activity/price-alert', { productId, targetPrice });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create price alert'
      );
    }
  }
);

export const deletePriceAlert = createAsyncThunk(
  'activity/deletePriceAlert',
  async (alertId, { rejectWithValue }) => {
    try {
      await api.delete(`/activity/price-alert/${alertId}`);
      return alertId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete price alert'
      );
    }
  }
);

export const fetchDashboardSummary = createAsyncThunk(
  'activity/fetchDashboardSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/activity/dashboard');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard summary'
      );
    }
  }
);

export const fetchSearchSuggestions = createAsyncThunk(
  'activity/fetchSearchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/activity/search-suggestions?q=${encodeURIComponent(query)}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch suggestions'
      );
    }
  }
);

export const trackProductView = createAsyncThunk(
  'activity/trackProductView',
  async (productId, { rejectWithValue }) => {
    try {
      await api.post(`/activity/view/${productId}`);
      return productId;
    } catch (error) {
      // Silent fail for tracking
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  recommendations: [],
  quickBuyList: [],
  savedCarts: [],
  priceAlerts: [],
  dashboardSummary: null,
  searchSuggestions: [],
  isLoading: false,
  recommendationsLoading: false,
  quickBuyLoading: false,
  savedCartsLoading: false,
  priceAlertsLoading: false,
  dashboardLoading: false,
  suggestionsLoading: false,
  error: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    clearSearchSuggestions: (state) => {
      state.searchSuggestions = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Recommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.recommendationsLoading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendationsLoading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.recommendationsLoading = false;
        state.error = action.payload;
      })

      // Quick Buy List
      .addCase(fetchQuickBuyList.pending, (state) => {
        state.quickBuyLoading = true;
      })
      .addCase(fetchQuickBuyList.fulfilled, (state, action) => {
        state.quickBuyLoading = false;
        state.quickBuyList = action.payload;
      })
      .addCase(fetchQuickBuyList.rejected, (state, action) => {
        state.quickBuyLoading = false;
        state.error = action.payload;
      })

      // Saved Carts
      .addCase(fetchSavedCarts.pending, (state) => {
        state.savedCartsLoading = true;
      })
      .addCase(fetchSavedCarts.fulfilled, (state, action) => {
        state.savedCartsLoading = false;
        state.savedCarts = action.payload;
      })
      .addCase(fetchSavedCarts.rejected, (state, action) => {
        state.savedCartsLoading = false;
        state.error = action.payload;
      })
      .addCase(saveCart.fulfilled, (state) => {
        // Will refetch after save
      })
      .addCase(deleteSavedCart.fulfilled, (state, action) => {
        state.savedCarts = state.savedCarts.filter(
          (cart) => cart._id !== action.payload
        );
      })

      // Price Alerts
      .addCase(fetchPriceAlerts.pending, (state) => {
        state.priceAlertsLoading = true;
      })
      .addCase(fetchPriceAlerts.fulfilled, (state, action) => {
        state.priceAlertsLoading = false;
        state.priceAlerts = action.payload;
      })
      .addCase(fetchPriceAlerts.rejected, (state, action) => {
        state.priceAlertsLoading = false;
        state.error = action.payload;
      })
      .addCase(deletePriceAlert.fulfilled, (state, action) => {
        state.priceAlerts = state.priceAlerts.filter(
          (alert) => alert._id !== action.payload
        );
      })

      // Dashboard Summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.dashboardLoading = true;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardSummary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      })

      // Search Suggestions
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.searchSuggestions = action.payload;
      })
      .addCase(fetchSearchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.searchSuggestions = [];
      });
  },
});

export const { clearSearchSuggestions, clearError } = activitySlice.actions;

export default activitySlice.reducer;
