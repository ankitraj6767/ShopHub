import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchApprovedTestimonials = createAsyncThunk(
  'testimonials/fetchApproved',
  async ({ limit = 10, page = 1, featured = false } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit, page });
      if (featured) params.append('featured', 'true');
      const { data } = await api.get(`/testimonials?${params}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch testimonials');
    }
  }
);

export const fetchMyTestimonials = createAsyncThunk(
  'testimonials/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/testimonials/my');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your testimonials');
    }
  }
);

export const submitTestimonial = createAsyncThunk(
  'testimonials/submit',
  async (testimonialData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/testimonials', testimonialData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit testimonial');
    }
  }
);

export const updateTestimonial = createAsyncThunk(
  'testimonials/update',
  async ({ id, ...testimonialData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/testimonials/${id}`, testimonialData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update testimonial');
    }
  }
);

export const deleteTestimonial = createAsyncThunk(
  'testimonials/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/testimonials/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete testimonial');
    }
  }
);

export const markTestimonialHelpful = createAsyncThunk(
  'testimonials/markHelpful',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/testimonials/${id}/helpful`);
      return { id, helpfulCount: data.helpfulCount };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark helpful');
    }
  }
);

// Admin thunks
export const fetchAllTestimonialsAdmin = createAsyncThunk(
  'testimonials/fetchAllAdmin',
  async ({ status = 'all', page = 1, limit = 20, search = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ status, page, limit });
      if (search) params.append('search', search);
      const { data } = await api.get(`/testimonials/admin/all?${params}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch testimonials');
    }
  }
);

export const fetchTestimonialStats = createAsyncThunk(
  'testimonials/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/testimonials/admin/stats');
      return data.stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const approveTestimonialAdmin = createAsyncThunk(
  'testimonials/approve',
  async ({ id, isFeatured, displayOrder, adminNotes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/testimonials/admin/${id}/approve`, {
        isFeatured,
        displayOrder,
        adminNotes
      });
      return data.testimonial;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve');
    }
  }
);

export const rejectTestimonialAdmin = createAsyncThunk(
  'testimonials/reject',
  async ({ id, rejectionReason, adminNotes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/testimonials/admin/${id}/reject`, {
        rejectionReason,
        adminNotes
      });
      return data.testimonial;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject');
    }
  }
);

export const toggleFeaturedAdmin = createAsyncThunk(
  'testimonials/toggleFeatured',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/testimonials/admin/${id}/featured`);
      return data.testimonial;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle featured');
    }
  }
);

export const deleteTestimonialAdmin = createAsyncThunk(
  'testimonials/deleteAdmin',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/testimonials/admin/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete');
    }
  }
);

const initialState = {
  // Public testimonials
  testimonials: [],
  pagination: null,
  loading: false,
  error: null,
  
  // User's testimonials
  myTestimonials: [],
  myLoading: false,
  myError: null,
  
  // Admin
  adminTestimonials: [],
  adminPagination: null,
  adminStats: null,
  adminLoading: false,
  adminError: null,
  
  // Submission
  submitting: false,
  submitSuccess: false,
  submitError: null,
};

const testimonialSlice = createSlice({
  name: 'testimonials',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.myError = null;
      state.adminError = null;
      state.submitError = null;
    },
    resetSubmitState: (state) => {
      state.submitting = false;
      state.submitSuccess = false;
      state.submitError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch approved testimonials
      .addCase(fetchApprovedTestimonials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovedTestimonials.fulfilled, (state, action) => {
        state.loading = false;
        state.testimonials = action.payload.testimonials;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchApprovedTestimonials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch my testimonials
      .addCase(fetchMyTestimonials.pending, (state) => {
        state.myLoading = true;
        state.myError = null;
      })
      .addCase(fetchMyTestimonials.fulfilled, (state, action) => {
        state.myLoading = false;
        state.myTestimonials = action.payload.testimonials;
      })
      .addCase(fetchMyTestimonials.rejected, (state, action) => {
        state.myLoading = false;
        state.myError = action.payload;
      })
      
      // Submit testimonial
      .addCase(submitTestimonial.pending, (state) => {
        state.submitting = true;
        state.submitSuccess = false;
        state.submitError = null;
      })
      .addCase(submitTestimonial.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccess = true;
        state.myTestimonials.unshift(action.payload.testimonial);
      })
      .addCase(submitTestimonial.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })
      
      // Update testimonial
      .addCase(updateTestimonial.fulfilled, (state, action) => {
        const index = state.myTestimonials.findIndex(t => t._id === action.payload.testimonial._id);
        if (index !== -1) {
          state.myTestimonials[index] = action.payload.testimonial;
        }
      })
      
      // Delete testimonial
      .addCase(deleteTestimonial.fulfilled, (state, action) => {
        state.myTestimonials = state.myTestimonials.filter(t => t._id !== action.payload);
      })
      
      // Mark helpful
      .addCase(markTestimonialHelpful.fulfilled, (state, action) => {
        const testimonial = state.testimonials.find(t => t._id === action.payload.id);
        if (testimonial) {
          testimonial.helpfulCount = action.payload.helpfulCount;
        }
      })
      
      // Admin: Fetch all
      .addCase(fetchAllTestimonialsAdmin.pending, (state) => {
        state.adminLoading = true;
        state.adminError = null;
      })
      .addCase(fetchAllTestimonialsAdmin.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminTestimonials = action.payload.testimonials;
        state.adminPagination = action.payload.pagination;
        state.adminStats = action.payload.stats;
      })
      .addCase(fetchAllTestimonialsAdmin.rejected, (state, action) => {
        state.adminLoading = false;
        state.adminError = action.payload;
      })
      
      // Admin: Fetch stats
      .addCase(fetchTestimonialStats.fulfilled, (state, action) => {
        state.adminStats = action.payload;
      })
      
      // Admin: Approve
      .addCase(approveTestimonialAdmin.fulfilled, (state, action) => {
        const index = state.adminTestimonials.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.adminTestimonials[index] = action.payload;
        }
        if (state.adminStats) {
          state.adminStats.pending = Math.max(0, (state.adminStats.pending || 0) - 1);
          state.adminStats.approved = (state.adminStats.approved || 0) + 1;
        }
      })
      
      // Admin: Reject
      .addCase(rejectTestimonialAdmin.fulfilled, (state, action) => {
        const index = state.adminTestimonials.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.adminTestimonials[index] = action.payload;
        }
        if (state.adminStats) {
          state.adminStats.pending = Math.max(0, (state.adminStats.pending || 0) - 1);
          state.adminStats.rejected = (state.adminStats.rejected || 0) + 1;
        }
      })
      
      // Admin: Toggle featured
      .addCase(toggleFeaturedAdmin.fulfilled, (state, action) => {
        const index = state.adminTestimonials.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.adminTestimonials[index] = action.payload;
        }
      })
      
      // Admin: Delete
      .addCase(deleteTestimonialAdmin.fulfilled, (state, action) => {
        state.adminTestimonials = state.adminTestimonials.filter(t => t._id !== action.payload);
      });
  }
});

export const { clearErrors, resetSubmitState } = testimonialSlice.actions;
export default testimonialSlice.reducer;
