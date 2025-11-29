import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Create subscription
export const createSubscription = createAsyncThunk(
  'subscriptions/create',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subscription');
    }
  }
);

// Fetch user's subscriptions
export const fetchMySubscriptions = createAsyncThunk(
  'subscriptions/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/subscriptions');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscriptions');
    }
  }
);

// Fetch single subscription
export const fetchSubscription = createAsyncThunk(
  'subscriptions/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/subscriptions/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }
);

// Update frequency
export const updateFrequency = createAsyncThunk(
  'subscriptions/updateFrequency',
  async ({ id, frequency }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/subscriptions/${id}/frequency`, { frequency });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update frequency');
    }
  }
);

// Pause subscription
export const pauseSubscription = createAsyncThunk(
  'subscriptions/pause',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/subscriptions/${id}/pause`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pause subscription');
    }
  }
);

// Resume subscription
export const resumeSubscription = createAsyncThunk(
  'subscriptions/resume',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/subscriptions/${id}/resume`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resume subscription');
    }
  }
);

// Cancel subscription
export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/subscriptions/${id}/cancel`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }
);

// Skip next delivery
export const skipNextDelivery = createAsyncThunk(
  'subscriptions/skip',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/subscriptions/${id}/skip`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to skip delivery');
    }
  }
);

const initialState = {
  subscriptions: [],
  currentSubscription: null,
  loading: false,
  error: null,
  success: false,
};

const subscriptionSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearSubscriptionError: (state) => {
      state.error = null;
    },
    clearSubscriptionSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create subscription
      .addCase(createSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions.unshift(action.payload);
        state.success = true;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch subscriptions
      .addCase(fetchMySubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMySubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload;
      })
      .addCase(fetchMySubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single subscription
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update frequency
      .addCase(updateFrequency.fulfilled, (state, action) => {
        const index = state.subscriptions.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
        if (state.currentSubscription?._id === action.payload._id) {
          state.currentSubscription = action.payload;
        }
        state.success = true;
      })
      // Pause subscription
      .addCase(pauseSubscription.fulfilled, (state, action) => {
        const index = state.subscriptions.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
        if (state.currentSubscription?._id === action.payload._id) {
          state.currentSubscription = action.payload;
        }
        state.success = true;
      })
      // Resume subscription
      .addCase(resumeSubscription.fulfilled, (state, action) => {
        const index = state.subscriptions.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
        if (state.currentSubscription?._id === action.payload._id) {
          state.currentSubscription = action.payload;
        }
        state.success = true;
      })
      // Cancel subscription
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        const index = state.subscriptions.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
        if (state.currentSubscription?._id === action.payload._id) {
          state.currentSubscription = action.payload;
        }
        state.success = true;
      })
      // Skip delivery
      .addCase(skipNextDelivery.fulfilled, (state, action) => {
        const index = state.subscriptions.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
        if (state.currentSubscription?._id === action.payload._id) {
          state.currentSubscription = action.payload;
        }
        state.success = true;
      });
  },
});

export const { clearSubscriptionError, clearSubscriptionSuccess } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
