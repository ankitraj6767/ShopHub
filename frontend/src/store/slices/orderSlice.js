import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Create order
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);
      // Return the order data (loyalty points are processed in background now)
      return {
        order: response.data.data,
        walletUsed: response.data.walletUsed,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

// Fetch user's orders
export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/orders/myorders?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

// Fetch single order
export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

// Pay order
export const payOrder = createAsyncThunk(
  'orders/payOrder',
  async ({ id, transactionId }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${id}/pay`, { transactionId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment failed');
    }
  }
);

// Admin: Fetch all orders
export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/orders?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

// Admin: Update order status
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order');
    }
  }
);

// Admin: Fetch order stats
export const fetchOrderStats = createAsyncThunk(
  'orders/fetchOrderStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/admin/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

// Request return
export const requestReturn = createAsyncThunk(
  'orders/requestReturn',
  async ({ orderId, reason, items }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/orders/${orderId}/return`, { reason, items });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request return');
    }
  }
);

// Admin: Process return
export const processReturn = createAsyncThunk(
  'orders/processReturn',
  async ({ orderId, action, adminNote, refundAmount }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}/return/process`, {
        action,
        adminNote,
        refundAmount,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process return');
    }
  }
);

// Admin: Update tracking
export const updateTracking = createAsyncThunk(
  'orders/updateTracking',
  async ({ orderId, trackingData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}/tracking`, trackingData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tracking');
    }
  }
);

// Admin: Fetch return requests
export const fetchReturnRequests = createAsyncThunk(
  'orders/fetchReturnRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/orders/admin/returns?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch returns');
    }
  }
);

// Admin: Process refund
export const processRefund = createAsyncThunk(
  'orders/processRefund',
  async ({ orderId, refundMethod, transactionId, note }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}/refund`, {
        refundMethod,
        transactionId,
        note,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process refund');
    }
  }
);

// Fetch buy again items
export const fetchBuyAgainItems = createAsyncThunk(
  'orders/fetchBuyAgain',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/orders/buy-again?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch buy again items');
    }
  }
);

// Reorder from previous order
export const reorderFromOrder = createAsyncThunk(
  'orders/reorder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/orders/${orderId}/reorder`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder');
    }
  }
);

// Alias for admin dashboard
export const fetchAdminStats = fetchOrderStats;

const initialState = {
  orders: [],
  order: null,
  stats: null,
  adminStats: null,
  returnRequests: [],
  buyAgainItems: [],
  buyAgainPage: 1,
  buyAgainPages: 1,
  reorderData: null,
  pagination: null,
  page: 1,
  pages: 1,
  total: 0,
  isLoading: false,
  error: null,
  success: false,
  cancelSuccess: false,
  returnSuccess: false,
  loyaltyPoints: null,
  referralCompleted: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrder: (state) => {
      state.order = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.cancelSuccess = false;
      state.returnSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.order = action.payload.order;
        state.loyaltyPoints = action.payload.loyaltyPoints;
        state.referralCompleted = action.payload.referralCompleted;
        state.success = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Order
      .addCase(fetchOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Pay Order
      .addCase(payOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(payOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.order = action.payload;
      })
      .addCase(payOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch All Orders (Admin)
      .addCase(fetchAllOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
        state.stats = action.payload.stats;
        state.pagination = {
          page: action.payload.page,
          totalPages: action.payload.pages,
          total: action.payload.total,
        };
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Order Status (Admin)
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.order = action.payload;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Order Stats (Admin)
      .addCase(fetchOrderStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.adminStats = action.payload;
      })
      .addCase(fetchOrderStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cancelSuccess = true;
        state.order = action.payload;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Request Return
      .addCase(requestReturn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestReturn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.returnSuccess = true;
        state.order = action.payload;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(requestReturn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Process Return (Admin)
      .addCase(processReturn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processReturn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.order = action.payload;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        const returnIndex = state.returnRequests.findIndex((o) => o._id === action.payload._id);
        if (returnIndex !== -1) {
          state.returnRequests[returnIndex] = action.payload;
        }
      })
      .addCase(processReturn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Tracking (Admin)
      .addCase(updateTracking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTracking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.order = action.payload;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateTracking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Return Requests (Admin)
      .addCase(fetchReturnRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReturnRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.returnRequests = action.payload.data;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchReturnRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Process Refund (Admin)
      .addCase(processRefund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.order = action.payload;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Buy Again Items
      .addCase(fetchBuyAgainItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBuyAgainItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.buyAgainItems = action.payload.data;
        state.buyAgainPage = action.payload.page;
        state.buyAgainPages = action.payload.pages;
      })
      .addCase(fetchBuyAgainItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reorder
      .addCase(reorderFromOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(reorderFromOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reorderData = action.payload;
        state.success = true;
      })
      .addCase(reorderFromOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrder, clearError, clearSuccess } = orderSlice.actions;
export default orderSlice.reducer;
