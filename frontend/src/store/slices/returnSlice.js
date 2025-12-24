import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Get return eligibility for an order
export const checkReturnEligibility = createAsyncThunk(
  'returns/checkEligibility',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/returns/eligibility/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check eligibility');
    }
  }
);

// Create return request
export const createReturn = createAsyncThunk(
  'returns/create',
  async (returnData, { rejectWithValue }) => {
    try {
      const response = await api.post('/returns', returnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create return');
    }
  }
);

// Fetch user's returns
export const fetchMyReturns = createAsyncThunk(
  'returns/fetchMyReturns',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/returns/my-returns?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch returns');
    }
  }
);

// Fetch single return
export const fetchReturn = createAsyncThunk(
  'returns/fetchReturn',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/returns/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch return');
    }
  }
);

// Cancel return
export const cancelReturn = createAsyncThunk(
  'returns/cancel',
  async ({ returnId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/returns/${returnId}/cancel`, { reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel return');
    }
  }
);

// Add message to return
export const addReturnMessage = createAsyncThunk(
  'returns/addMessage',
  async ({ returnId, message }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/returns/${returnId}/message`, { message });
      return { returnId, message: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Get return constants (reasons, conditions, etc.)
export const fetchReturnConstants = createAsyncThunk(
  'returns/fetchConstants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/returns/constants');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch constants');
    }
  }
);

// ==================== ADMIN THUNKS ====================

// Fetch all returns (admin)
export const fetchAllReturns = createAsyncThunk(
  'returns/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/returns/admin/all?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch returns');
    }
  }
);

// Fetch return statistics (admin)
export const fetchReturnStats = createAsyncThunk(
  'returns/fetchStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/returns/admin/stats?${queryString}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

// Approve return (admin)
export const approveReturn = createAsyncThunk(
  'returns/approve',
  async ({ returnId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/returns/${returnId}/approve`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve return');
    }
  }
);

// Reject return (admin)
export const rejectReturn = createAsyncThunk(
  'returns/reject',
  async ({ returnId, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/returns/${returnId}/reject`, { rejectionReason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject return');
    }
  }
);

// Update return status (admin)
export const updateReturnStatus = createAsyncThunk(
  'returns/updateStatus',
  async ({ returnId, status, note, trackingNumber, carrier }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/returns/${returnId}/status`, {
        status,
        note,
        trackingNumber,
        carrier,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

// Process refund (admin)
export const processReturnRefund = createAsyncThunk(
  'returns/processRefund',
  async ({ returnId, refundMethod, transactionId, note, adjustedAmount }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/returns/${returnId}/refund`, {
        refundMethod,
        transactionId,
        note,
        adjustedAmount,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process refund');
    }
  }
);

// Add admin note (admin)
export const addAdminNote = createAsyncThunk(
  'returns/addAdminNote',
  async ({ returnId, note }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/returns/${returnId}/admin-note`, { note });
      return { returnId, note: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add note');
    }
  }
);

// Update quality check (admin)
export const updateQualityCheck = createAsyncThunk(
  'returns/updateQualityCheck',
  async ({ returnId, passed, notes, issues }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/returns/${returnId}/quality-check`, {
        passed,
        notes,
        issues,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update quality check');
    }
  }
);

const initialState = {
  // User returns
  returns: [],
  currentReturn: null,
  eligibility: null,
  
  // Admin returns
  adminReturns: [],
  stats: null,
  statusCounts: {},
  
  // Constants
  constants: null,
  
  // Pagination
  page: 1,
  pages: 1,
  total: 0,
  
  // Loading states
  isLoading: false,
  isCheckingEligibility: false,
  isCreating: false,
  isProcessing: false,
  
  // Status
  error: null,
  success: false,
  createSuccess: false,
  cancelSuccess: false,
};

const returnSlice = createSlice({
  name: 'returns',
  initialState,
  reducers: {
    clearReturn: (state) => {
      state.currentReturn = null;
      state.eligibility = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.createSuccess = false;
      state.cancelSuccess = false;
    },
    resetReturns: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Check Eligibility
      .addCase(checkReturnEligibility.pending, (state) => {
        state.isCheckingEligibility = true;
        state.error = null;
      })
      .addCase(checkReturnEligibility.fulfilled, (state, action) => {
        state.isCheckingEligibility = false;
        state.eligibility = action.payload;
      })
      .addCase(checkReturnEligibility.rejected, (state, action) => {
        state.isCheckingEligibility = false;
        state.error = action.payload;
      })
      
      // Create Return
      .addCase(createReturn.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createReturn.fulfilled, (state, action) => {
        state.isCreating = false;
        state.currentReturn = action.payload.data;
        state.createSuccess = true;
      })
      .addCase(createReturn.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      
      // Fetch My Returns
      .addCase(fetchMyReturns.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyReturns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.returns = action.payload.data;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchMyReturns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Single Return
      .addCase(fetchReturn.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReturn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentReturn = action.payload;
      })
      .addCase(fetchReturn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Cancel Return
      .addCase(cancelReturn.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(cancelReturn.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentReturn = action.payload;
        state.cancelSuccess = true;
        const index = state.returns.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.returns[index] = action.payload;
        }
      })
      .addCase(cancelReturn.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Add Message
      .addCase(addReturnMessage.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(addReturnMessage.fulfilled, (state, action) => {
        state.isProcessing = false;
        if (state.currentReturn) {
          state.currentReturn.customerMessages.push(action.payload.message);
        }
      })
      .addCase(addReturnMessage.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Fetch Constants
      .addCase(fetchReturnConstants.fulfilled, (state, action) => {
        state.constants = action.payload;
      })
      
      // ==================== ADMIN CASES ====================
      
      // Fetch All Returns (Admin)
      .addCase(fetchAllReturns.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllReturns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminReturns = action.payload.data;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
        state.statusCounts = action.payload.statusCounts;
      })
      .addCase(fetchAllReturns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Stats (Admin)
      .addCase(fetchReturnStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReturnStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchReturnStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Approve Return (Admin)
      .addCase(approveReturn.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(approveReturn.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentReturn = action.payload;
        state.success = true;
        const index = state.adminReturns.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.adminReturns[index] = action.payload;
        }
      })
      .addCase(approveReturn.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Reject Return (Admin)
      .addCase(rejectReturn.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(rejectReturn.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentReturn = action.payload;
        state.success = true;
        const index = state.adminReturns.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.adminReturns[index] = action.payload;
        }
      })
      .addCase(rejectReturn.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Update Status (Admin)
      .addCase(updateReturnStatus.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(updateReturnStatus.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentReturn = action.payload;
        state.success = true;
        const index = state.adminReturns.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.adminReturns[index] = action.payload;
        }
      })
      .addCase(updateReturnStatus.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Process Refund (Admin)
      .addCase(processReturnRefund.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processReturnRefund.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentReturn = action.payload;
        state.success = true;
        const index = state.adminReturns.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.adminReturns[index] = action.payload;
        }
      })
      .addCase(processReturnRefund.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Add Admin Note
      .addCase(addAdminNote.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(addAdminNote.fulfilled, (state, action) => {
        state.isProcessing = false;
        if (state.currentReturn) {
          state.currentReturn.adminNotes.push(action.payload.note);
        }
      })
      .addCase(addAdminNote.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      
      // Update Quality Check (Admin)
      .addCase(updateQualityCheck.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(updateQualityCheck.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentReturn = action.payload;
        state.success = true;
        const index = state.adminReturns.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.adminReturns[index] = action.payload;
        }
      })
      .addCase(updateQualityCheck.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      });
  },
});

export const { clearReturn, clearError, clearSuccess, resetReturns } = returnSlice.actions;
export default returnSlice.reducer;
