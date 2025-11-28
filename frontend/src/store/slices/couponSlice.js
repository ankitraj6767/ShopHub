import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const applyCoupon = createAsyncThunk(
  'coupon/applyCoupon',
  async ({ code, orderTotal, items }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/coupons/apply', {
        code,
        orderTotal,
        items,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to apply coupon'
      );
    }
  }
);

export const validateCoupon = createAsyncThunk(
  'coupon/validateCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/coupons/validate', { code });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Invalid coupon code'
      );
    }
  }
);

export const fetchActiveCoupons = createAsyncThunk(
  'coupon/fetchActiveCoupons',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/coupons/active');
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch coupons'
      );
    }
  }
);

// Admin thunks
export const fetchAllCoupons = createAsyncThunk(
  'coupon/fetchAllCoupons',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/coupons', { params });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch coupons'
      );
    }
  }
);

export const createCoupon = createAsyncThunk(
  'coupon/createCoupon',
  async (couponData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/coupons', couponData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create coupon'
      );
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'coupon/updateCoupon',
  async ({ id, couponData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/coupons/${id}`, couponData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update coupon'
      );
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  'coupon/deleteCoupon',
  async (couponId, { rejectWithValue }) => {
    try {
      await api.delete(`/coupons/${couponId}`);
      return couponId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete coupon'
      );
    }
  }
);

const initialState = {
  coupons: [],
  activeCoupons: [],
  appliedCoupon: null,
  discount: 0,
  loading: false,
  error: null,
  success: false,
  page: 1,
  pages: 1,
  total: 0,
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },
    clearCouponSuccess: (state) => {
      state.success = false;
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.discount = 0;
    },
    resetCoupons: (state) => {
      state.appliedCoupon = null;
      state.discount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Apply coupon
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.appliedCoupon = action.payload.coupon;
        state.discount = action.payload.discount;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.appliedCoupon = null;
        state.discount = 0;
      })
      // Validate coupon
      .addCase(validateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.appliedCoupon = action.payload;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch active coupons
      .addCase(fetchActiveCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.activeCoupons = action.payload;
      })
      .addCase(fetchActiveCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch all coupons (admin)
      .addCase(fetchAllCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchAllCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create coupon
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.coupons.unshift(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update coupon
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.coupons.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete coupon
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = state.coupons.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCouponError,
  clearCouponSuccess,
  removeCoupon,
  resetCoupons,
} = couponSlice.actions;

// Selectors
export const selectCoupons = (state) => state.coupon.coupons;
export const selectActiveCoupons = (state) => state.coupon.activeCoupons;
export const selectAppliedCoupon = (state) => state.coupon.appliedCoupon;
export const selectDiscount = (state) => state.coupon.discount;
export const selectCouponLoading = (state) => state.coupon.loading;
export const selectCouponError = (state) => state.coupon.error;
export const selectCouponSuccess = (state) => state.coupon.success;

export default couponSlice.reducer;
