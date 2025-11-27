import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/addresses');
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch addresses'
      );
    }
  }
);

export const fetchAddressById = createAsyncThunk(
  'address/fetchAddressById',
  async (addressId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/addresses/${addressId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch address'
      );
    }
  }
);

export const addAddress = createAsyncThunk(
  'address/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/addresses', addressData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add address'
      );
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/addresses/${addressId}`, addressData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update address'
      );
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/deleteAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      await api.delete(`/addresses/${addressId}`);
      return addressId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete address'
      );
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'address/setDefaultAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/addresses/${addressId}/default`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to set default address'
      );
    }
  }
);

const initialState = {
  addresses: [],
  selectedAddress: null,
  defaultAddress: null,
  loading: false,
  error: null,
  success: false,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearAddressError: (state) => {
      state.error = null;
    },
    clearAddressSuccess: (state) => {
      state.success = false;
    },
    selectAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    resetAddresses: (state) => {
      state.addresses = [];
      state.selectedAddress = null;
      state.defaultAddress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        state.defaultAddress = action.payload.find((addr) => addr.isDefault) || null;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch address by ID
      .addCase(fetchAddressById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddressById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAddress = action.payload;
      })
      .addCase(fetchAddressById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add address
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.addresses.push(action.payload);
        if (action.payload.isDefault) {
          // Unset previous default
          state.addresses = state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr._id === action.payload._id,
          }));
          state.defaultAddress = action.payload;
        }
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update address
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.addresses.findIndex(
          (addr) => addr._id === action.payload._id
        );
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
        if (action.payload.isDefault) {
          state.addresses = state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr._id === action.payload._id,
          }));
          state.defaultAddress = action.payload;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete address
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.filter(
          (addr) => addr._id !== action.payload
        );
        if (state.defaultAddress?._id === action.payload) {
          state.defaultAddress = null;
        }
        if (state.selectedAddress?._id === action.payload) {
          state.selectedAddress = null;
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Set default address
      .addCase(setDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === action.payload._id,
        }));
        state.defaultAddress = action.payload;
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearAddressError,
  clearAddressSuccess,
  selectAddress,
  resetAddresses,
} = addressSlice.actions;

// Selectors
export const selectAllAddresses = (state) => state.address.addresses;
export const selectDefaultAddress = (state) => state.address.defaultAddress;
export const selectSelectedAddress = (state) => state.address.selectedAddress;
export const selectAddressLoading = (state) => state.address.loading;
export const selectAddressError = (state) => state.address.error;
export const selectAddressSuccess = (state) => state.address.success;

export default addressSlice.reducer;
