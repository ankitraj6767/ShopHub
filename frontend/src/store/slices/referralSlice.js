import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch user's referral info
export const fetchReferralInfo = createAsyncThunk(
  'referral/fetchReferralInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/referrals/my-referrals');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch referral info');
    }
  }
);

// Fetch referral leaderboard
export const fetchReferralLeaderboard = createAsyncThunk(
  'referral/fetchReferralLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/referrals/leaderboard');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }
);

// Apply referral code
export const applyReferralCode = createAsyncThunk(
  'referral/applyReferralCode',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post('/referrals/apply', { code });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply referral code');
    }
  }
);

// Validate referral code
export const validateReferralCode = createAsyncThunk(
  'referral/validateReferralCode',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.get(`/referrals/validate/${code}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid referral code');
    }
  }
);

const initialState = {
  referralData: null,
  leaderboard: [],
  codeValidation: null,
  isLoading: false,
  error: null,
};

const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCodeValidation: (state) => {
      state.codeValidation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch referral info
      .addCase(fetchReferralInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReferralInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.referralData = action.payload;
      })
      .addCase(fetchReferralInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch leaderboard
      .addCase(fetchReferralLeaderboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReferralLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchReferralLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Apply referral code
      .addCase(applyReferralCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyReferralCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.referralData = action.payload;
      })
      .addCase(applyReferralCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Validate referral code
      .addCase(validateReferralCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(validateReferralCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.codeValidation = action.payload;
      })
      .addCase(validateReferralCode.rejected, (state, action) => {
        state.isLoading = false;
        state.codeValidation = { valid: false, message: action.payload };
      });
  },
});

export const { clearError, clearCodeValidation } = referralSlice.actions;
export default referralSlice.reducer;
