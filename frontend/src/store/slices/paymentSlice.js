import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Get Stripe publishable key
export const getPaymentConfig = createAsyncThunk(
  'payment/getConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/config');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get payment config');
    }
  }
);

// Create payment intent
export const createPaymentIntent = createAsyncThunk(
  'payment/createIntent',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/create-intent', { orderId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment intent');
    }
  }
);

// Confirm payment
export const confirmPayment = createAsyncThunk(
  'payment/confirm',
  async ({ orderId, paymentIntentId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/confirm', { orderId, paymentIntentId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to confirm payment');
    }
  }
);

const initialState = {
  publishableKey: null,
  clientSecret: null,
  paymentIntentId: null,
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.clientSecret = null;
      state.paymentIntentId = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get config
      .addCase(getPaymentConfig.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPaymentConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publishableKey = action.payload.publishableKey;
      })
      .addCase(getPaymentConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clientSecret = action.payload.clientSecret;
        state.paymentIntentId = action.payload.paymentIntentId;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Confirm payment
      .addCase(confirmPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state) => {
        state.isLoading = false;
        state.clientSecret = null;
        state.paymentIntentId = null;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
