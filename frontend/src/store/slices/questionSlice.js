import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchProductQuestions = createAsyncThunk(
  'questions/fetchProductQuestions',
  async ({ productId, page = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/questions/product/${productId}?page=${page}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch questions');
    }
  }
);

export const askQuestion = createAsyncThunk(
  'questions/askQuestion',
  async ({ productId, question }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/questions', { productId, question });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to ask question');
    }
  }
);

export const answerQuestion = createAsyncThunk(
  'questions/answerQuestion',
  async ({ questionId, answer }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/questions/${questionId}/answer`, { answer });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to answer question');
    }
  }
);

export const voteAnswer = createAsyncThunk(
  'questions/voteAnswer',
  async ({ questionId, answerId, helpful }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/questions/${questionId}/answers/${answerId}/vote`, { helpful });
      return { questionId, answerId, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to vote');
    }
  }
);

const initialState = {
  questions: [],
  totalQuestions: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
  askingQuestion: false,
  answeringQuestion: false,
};

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    clearQuestions: (state) => {
      state.questions = [];
      state.totalQuestions = 0;
      state.page = 1;
      state.pages = 1;
    },
    clearQuestionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchProductQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.data || [];
        state.totalQuestions = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.pages = action.payload.pages || 1;
      })
      .addCase(fetchProductQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Ask question
      .addCase(askQuestion.pending, (state) => {
        state.askingQuestion = true;
        state.error = null;
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        state.askingQuestion = false;
        // Backend returns { success: true, data: newQuestion }
        const newQuestion = action.payload.data || action.payload;
        state.questions.unshift(newQuestion);
        state.totalQuestions += 1;
      })
      .addCase(askQuestion.rejected, (state, action) => {
        state.askingQuestion = false;
        state.error = action.payload;
      })
      // Answer question
      .addCase(answerQuestion.pending, (state) => {
        state.answeringQuestion = true;
        state.error = null;
      })
      .addCase(answerQuestion.fulfilled, (state, action) => {
        state.answeringQuestion = false;
        // Backend returns { success: true, data: updatedQuestion }
        const updatedQuestion = action.payload.data || action.payload;
        const index = state.questions.findIndex((q) => q._id === updatedQuestion._id);
        if (index !== -1) {
          state.questions[index] = updatedQuestion;
        }
      })
      .addCase(answerQuestion.rejected, (state, action) => {
        state.answeringQuestion = false;
        state.error = action.payload;
      })
      // Vote answer
      .addCase(voteAnswer.fulfilled, (state, action) => {
        const { questionId, answerId, helpfulVotes, notHelpfulVotes } = action.payload;
        const question = state.questions.find((q) => q._id === questionId);
        if (question) {
          const answer = question.answers.find((a) => a._id === answerId);
          if (answer) {
            answer.helpfulVotes = helpfulVotes;
            answer.notHelpfulVotes = notHelpfulVotes;
          }
        }
      });
  },
});

export const { clearQuestions, clearQuestionError } = questionSlice.actions;
export default questionSlice.reducer;
