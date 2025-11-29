import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Get payment config (Stripe + Razorpay)
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

// Create payment intent (Stripe)
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

// Create Razorpay order
export const createRazorpayOrder = createAsyncThunk(
  'payment/createRazorpayOrder',
  async ({ amount, currency = 'INR', orderId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/razorpay/create-order', { amount, currency, orderId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create Razorpay order');
    }
  }
);

// Verify Razorpay payment
export const verifyRazorpayPayment = createAsyncThunk(
  'payment/verifyRazorpay',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/razorpay/verify', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment verification failed');
    }
  }
);

const initialState = {
  publishableKey: null,
  razorpayKeyId: null,
  razorpayEnabled: false,
  stripeEnabled: false,
  clientSecret: null,
  paymentIntentId: null,
  razorpayOrder: null,
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
      state.razorpayOrder = null;
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
        state.razorpayKeyId = action.payload.razorpayKeyId;
        state.razorpayEnabled = action.payload.razorpayEnabled;
        state.stripeEnabled = action.payload.stripeEnabled;
      })
      .addCase(getPaymentConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create intent (Stripe)
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
      })
      // Create Razorpay order
      .addCase(createRazorpayOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.razorpayOrder = action.payload.order;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Verify Razorpay payment
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state) => {
        state.isLoading = false;
        state.razorpayOrder = null;
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
