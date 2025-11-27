import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const checkStockAlert = createAsyncThunk(
  'stockAlert/check',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/stock-alerts/check/${productId}`);
      return { productId, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check alert status');
    }
  }
);

export const subscribeStockAlert = createAsyncThunk(
  'stockAlert/subscribe',
  async ({ productId, preferences }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/stock-alerts/subscribe', { productId, ...preferences });
      return { productId, subscribed: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to subscribe');
    }
  }
);

export const unsubscribeStockAlert = createAsyncThunk(
  'stockAlert/unsubscribe',
  async (productId, { rejectWithValue }) => {
    try {
      await api.delete(`/stock-alerts/unsubscribe/${productId}`);
      return { productId, subscribed: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unsubscribe');
    }
  }
);

export const fetchMyStockAlerts = createAsyncThunk(
  'stockAlert/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/stock-alerts/my');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts');
    }
  }
);

const initialState = {
  myAlerts: [],
  alertStatus: {}, // { productId: { subscribed: true/false, loading: false } }
  loading: false,
  error: null,
};

const stockAlertSlice = createSlice({
  name: 'stockAlert',
  initialState,
  reducers: {
    clearStockAlertError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check stock alert
      .addCase(checkStockAlert.pending, (state, action) => {
        const productId = action.meta.arg;
        state.alertStatus[productId] = { ...state.alertStatus[productId], loading: true };
      })
      .addCase(checkStockAlert.fulfilled, (state, action) => {
        const { productId, subscribed } = action.payload;
        state.alertStatus[productId] = { subscribed, loading: false };
      })
      .addCase(checkStockAlert.rejected, (state, action) => {
        const productId = action.meta.arg;
        state.alertStatus[productId] = { subscribed: false, loading: false };
      })
      // Subscribe
      .addCase(subscribeStockAlert.pending, (state, action) => {
        const { productId } = action.meta.arg;
        state.alertStatus[productId] = { ...state.alertStatus[productId], loading: true };
      })
      .addCase(subscribeStockAlert.fulfilled, (state, action) => {
        const { productId } = action.payload;
        state.alertStatus[productId] = { subscribed: true, loading: false };
      })
      .addCase(subscribeStockAlert.rejected, (state, action) => {
        const { productId } = action.meta.arg;
        state.alertStatus[productId] = { ...state.alertStatus[productId], loading: false };
        state.error = action.payload;
      })
      // Unsubscribe
      .addCase(unsubscribeStockAlert.pending, (state, action) => {
        const productId = action.meta.arg;
        state.alertStatus[productId] = { ...state.alertStatus[productId], loading: true };
      })
      .addCase(unsubscribeStockAlert.fulfilled, (state, action) => {
        const { productId } = action.payload;
        state.alertStatus[productId] = { subscribed: false, loading: false };
        state.myAlerts = state.myAlerts.filter((a) => a.product._id !== productId);
      })
      .addCase(unsubscribeStockAlert.rejected, (state, action) => {
        const productId = action.meta.arg;
        state.alertStatus[productId] = { ...state.alertStatus[productId], loading: false };
        state.error = action.payload;
      })
      // Fetch my alerts
      .addCase(fetchMyStockAlerts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyStockAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.myAlerts = action.payload;
      })
      .addCase(fetchMyStockAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStockAlertError } = stockAlertSlice.actions;
export default stockAlertSlice.reducer;
