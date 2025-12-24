import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { tokenStorage } from '../../utils/api';

// Helper function to refresh the access token
const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  // Use raw axios to avoid interceptors during refresh
  const API_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD ? 'https://shophub-production-e2cc.up.railway.app/api' : '/api');
  
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });
  
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
  
  const data = await response.json();
  const { accessToken } = data.data;
  
  if (accessToken) {
    tokenStorage.setAccessToken(accessToken);
    return accessToken;
  }
  
  throw new Error('No access token in refresh response');
};

// Check if user is authenticated
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  // Skip if no refresh token exists - no need to make API call
  const refreshToken = tokenStorage.getRefreshToken();
  const accessToken = tokenStorage.getAccessToken();
  const cachedUser = tokenStorage.getUser();
  
  if (!refreshToken && !accessToken) {
    console.log('checkAuth: No tokens in storage');
    return rejectWithValue(null);
  }
  
  try {
    console.log('checkAuth: Attempting to verify token...');
    const response = await api.get('/auth/me');
    console.log('checkAuth: Token verified successfully');
    // Update cached user data
    tokenStorage.setUser(response.data.data);
    return response.data.data;
  } catch (error) {
    console.log('checkAuth: Token verification failed:', error.response?.status, error.message);
    
    // If access token expired (401) but we have refresh token, try to refresh
    if (error.response?.status === 401 && refreshToken) {
      try {
        console.log('checkAuth: Attempting token refresh...');
        await refreshAccessToken();
        console.log('checkAuth: Token refreshed, retrying /auth/me...');
        
        // Retry with new access token
        const retryResponse = await api.get('/auth/me');
        console.log('checkAuth: Retry successful');
        // Update cached user data
        tokenStorage.setUser(retryResponse.data.data);
        return retryResponse.data.data;
      } catch (refreshError) {
        console.log('checkAuth: Token refresh failed:', refreshError.message);
        tokenStorage.clearTokens();
        return rejectWithValue(null);
      }
    }
    
    // Clear invalid tokens
    tokenStorage.clearTokens();
    return rejectWithValue(null);
  }
});

// Register user
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    tokenStorage.setAccessToken(response.data.data.accessToken);
    if (response.data.data.refreshToken) {
      tokenStorage.setRefreshToken(response.data.data.refreshToken);
    }
    // Store user data for persistence
    tokenStorage.setUser(response.data.data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

// Login user
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    console.log('login: Attempting login...');
    console.log('login: API URL will be:', import.meta.env.VITE_API_URL || 'default');
    
    const response = await api.post('/auth/login', credentials);
    console.log('login: Response received:', {
      status: response.status,
      hasData: !!response.data,
      hasAccessToken: !!response.data?.data?.accessToken,
      hasRefreshToken: !!response.data?.data?.refreshToken
    });
    
    const { accessToken, refreshToken } = response.data.data;
    
    if (accessToken) {
      tokenStorage.setAccessToken(accessToken);
      // Verify it was stored
      const stored = tokenStorage.getAccessToken();
      console.log('login: Access token stored:', !!stored, stored === accessToken ? 'matches' : 'MISMATCH');
    } else {
      console.error('login: No access token in response!');
    }
    
    if (refreshToken) {
      tokenStorage.setRefreshToken(refreshToken);
      const stored = tokenStorage.getRefreshToken();
      console.log('login: Refresh token stored:', !!stored, stored === refreshToken ? 'matches' : 'MISMATCH');
    }
    
    // Store user data for persistence
    tokenStorage.setUser(response.data.data);
    
    return response.data.data;
  } catch (error) {
    console.error('login: Login failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      isNetworkError: !error.response
    });
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// Logout user
export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    tokenStorage.clearTokens();
    return null;
  } catch (error) {
    tokenStorage.clearTokens();
    return rejectWithValue(error.response?.data?.message || 'Logout failed');
  }
});

// Update profile
export const updateProfile = createAsyncThunk('auth/updateProfile', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.put('/users/profile', userData);
    // Update cached user data
    tokenStorage.setUser(response.data.data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Update failed');
  }
});

// Forgot password - Send OTP
export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
  }
});

// Verify OTP
export const verifyOTP = createAsyncThunk('auth/verifyOTP', async ({ email, otp }, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Invalid OTP');
  }
});

// Reset password
export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ email, otp, newPassword }, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
  }
});

// Load cached user data for initial state (instant UI while verifying)
const getCachedAuthState = () => {
  const cachedUser = tokenStorage.getUser();
  const hasTokens = tokenStorage.getRefreshToken() || tokenStorage.getAccessToken();
  
  return {
    user: cachedUser,
    isAuthenticated: !!(cachedUser && hasTokens),
    isLoading: !!(hasTokens), // Only show loading if we have tokens to verify
  };
};

const cachedState = getCachedAuthState();

const initialState = {
  user: cachedState.user,
  isAuthenticated: cachedState.isAuthenticated,
  isLoading: cachedState.isLoading,
  error: null,
  // Forgot password state
  forgotPasswordLoading: false,
  forgotPasswordSuccess: false,
  forgotPasswordError: null,
  otpVerified: false,
  passwordResetSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearForgotPasswordState: (state) => {
      state.forgotPasswordLoading = false;
      state.forgotPasswordSuccess = false;
      state.forgotPasswordError = null;
      state.otpVerified = false;
      state.passwordResetSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordError = null;
        state.forgotPasswordSuccess = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordError = action.payload;
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordError = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
        state.otpVerified = true;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordError = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordError = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
        state.passwordResetSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordError = action.payload;
      });
  },
});

export const { clearError, clearForgotPasswordState } = authSlice.actions;
export default authSlice.reducer;
