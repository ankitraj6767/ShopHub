import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch FAQs
export const fetchFAQs = createAsyncThunk(
  'support/fetchFAQs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/support/faqs');
      const data = response.data.data;
      // If data is an object (grouped by category), flatten it to array
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return Object.values(data).flat();
      }
      return data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch FAQs');
    }
  }
);

// Create ticket
export const createTicket = createAsyncThunk(
  'support/createTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await api.post('/support/tickets', ticketData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ticket');
    }
  }
);

// Fetch my tickets
export const fetchMyTickets = createAsyncThunk(
  'support/fetchMyTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/support/tickets');
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

// Fetch ticket by ID
export const fetchTicketById = createAsyncThunk(
  'support/fetchTicketById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/support/tickets/${ticketId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket');
    }
  }
);

// Add message to ticket
export const addTicketMessage = createAsyncThunk(
  'support/addTicketMessage',
  async ({ ticketId, message }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/support/tickets/${ticketId}/messages`, { message });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add message');
    }
  }
);

// Close ticket
export const closeTicket = createAsyncThunk(
  'support/closeTicket',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/support/tickets/${ticketId}/close`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close ticket');
    }
  }
);

// Chat with AI
export const chatWithAI = createAsyncThunk(
  'support/chatWithAI',
  async (message, { rejectWithValue }) => {
    try {
      const response = await api.post('/support/chat', { message });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get response');
    }
  }
);

// Vote on FAQ
export const voteFAQ = createAsyncThunk(
  'support/voteFAQ',
  async ({ faqId, vote }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/support/faqs/${faqId}/vote`, { vote });
      return { faqId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to vote');
    }
  }
);

const initialState = {
  faqs: [],
  tickets: [],
  currentTicket: null,
  chatMessages: [],
  isLoading: false,
  error: null,
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    clearChatMessages: (state) => {
      state.chatMessages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch FAQs
      .addCase(fetchFAQs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFAQs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.faqs = action.payload;
      })
      .addCase(fetchFAQs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create ticket
      .addCase(createTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets.unshift(action.payload);
        state.currentTicket = action.payload;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch my tickets
      .addCase(fetchMyTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchMyTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch ticket by ID
      .addCase(fetchTicketById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add message
      .addCase(addTicketMessage.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      // Close ticket
      .addCase(closeTicket.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      // Chat with AI
      .addCase(chatWithAI.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(chatWithAI.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chatMessages.push({
          type: 'bot',
          message: action.payload.message || action.payload.response,
          suggestions: action.payload.suggestions || [],
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(chatWithAI.rejected, (state, action) => {
        state.isLoading = false;
        state.chatMessages.push({
          type: 'bot',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        });
      })
      // Vote FAQ
      .addCase(voteFAQ.fulfilled, (state, action) => {
        const faq = state.faqs.find((f) => f._id === action.payload.faqId);
        if (faq) {
          faq.helpful = action.payload.helpful;
          faq.notHelpful = action.payload.notHelpful;
        }
      });
  },
});

export const { clearError, addChatMessage, clearChatMessages } = supportSlice.actions;
export default supportSlice.reducer;
