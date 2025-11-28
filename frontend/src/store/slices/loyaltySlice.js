import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch user's loyalty points
export const fetchLoyaltyPoints = createAsyncThunk(
  'loyalty/fetchLoyaltyPoints',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/loyalty/my-points');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch loyalty points');
    }
  }
);

// Fetch loyalty leaderboard
export const fetchLeaderboard = createAsyncThunk(
  'loyalty/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/loyalty/leaderboard');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }
);

// Redeem points
export const redeemPoints = createAsyncThunk(
  'loyalty/redeemPoints',
  async (pointsToRedeem, { rejectWithValue }) => {
    try {
      const response = await api.post('/loyalty/redeem', { points: pointsToRedeem });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to redeem points');
    }
  }
);

// Get tier info
export const fetchTierInfo = createAsyncThunk(
  'loyalty/fetchTierInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/loyalty/tier-info');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tier info');
    }
  }
);

const initialState = {
  loyaltyData: null,
  leaderboard: [],
  tierInfo: null,
  isLoading: false,
  error: null,
};

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch loyalty points
      .addCase(fetchLoyaltyPoints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLoyaltyPoints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loyaltyData = action.payload;
      })
      .addCase(fetchLoyaltyPoints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Redeem points
      .addCase(redeemPoints.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(redeemPoints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loyaltyData = action.payload;
      })
      .addCase(redeemPoints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch tier info
      .addCase(fetchTierInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTierInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tierInfo = action.payload;
      })
      .addCase(fetchTierInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = loyaltySlice.actions;
export default loyaltySlice.reducer;
