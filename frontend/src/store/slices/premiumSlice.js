import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Get premium plans
export const getPremiumPlans = createAsyncThunk(
  'premium/getPlans',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/premium/plans');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch plans'
      );
    }
  }
);

// Get subscription status
export const getPremiumStatus = createAsyncThunk(
  'premium/getStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/premium/status');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch status'
      );
    }
  }
);

// Subscribe to premium
export const subscribeToPremium = createAsyncThunk(
  'premium/subscribe',
  async (plan, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/premium/subscribe', { plan });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to subscribe'
      );
    }
  }
);

// Cancel subscription
export const cancelPremium = createAsyncThunk(
  'premium/cancel',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/premium/cancel');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel'
      );
    }
  }
);

// Toggle auto-renewal
export const toggleAutoRenew = createAsyncThunk(
  'premium/toggleAutoRenew',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/premium/auto-renew');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update auto-renew'
      );
    }
  }
);

// Get benefits
export const getPremiumBenefits = createAsyncThunk(
  'premium/getBenefits',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/premium/benefits');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch benefits'
      );
    }
  }
);

const initialState = {
  plans: [],
  subscription: null,
  isPremium: false,
  benefits: null,
  loading: false,
  error: null,
  subscribing: false,
  cancelling: false,
};

const premiumSlice = createSlice({
  name: 'premium',
  initialState,
  reducers: {
    clearPremiumError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Plans
      .addCase(getPremiumPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPremiumPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload.plans;
      })
      .addCase(getPremiumPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Status
      .addCase(getPremiumStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPremiumStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isPremium = action.payload.isPremium;
        state.subscription = action.payload.subscription;
      })
      .addCase(getPremiumStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Subscribe
      .addCase(subscribeToPremium.pending, (state) => {
        state.subscribing = true;
        state.error = null;
      })
      .addCase(subscribeToPremium.fulfilled, (state, action) => {
        state.subscribing = false;
        state.isPremium = true;
        state.subscription = action.payload.subscription;
      })
      .addCase(subscribeToPremium.rejected, (state, action) => {
        state.subscribing = false;
        state.error = action.payload;
      })
      // Cancel
      .addCase(cancelPremium.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })
      .addCase(cancelPremium.fulfilled, (state, action) => {
        state.cancelling = false;
        if (state.subscription) {
          state.subscription.status = action.payload.subscription.status;
        }
      })
      .addCase(cancelPremium.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload;
      })
      // Toggle Auto-Renew
      .addCase(toggleAutoRenew.fulfilled, (state, action) => {
        if (state.subscription) {
          state.subscription.autoRenew = action.payload.autoRenew;
        }
      })
      // Get Benefits
      .addCase(getPremiumBenefits.fulfilled, (state, action) => {
        state.isPremium = action.payload.isPremium;
        state.benefits = action.payload.benefits;
      });
  },
});

export const { clearPremiumError } = premiumSlice.actions;
export default premiumSlice.reducer;
