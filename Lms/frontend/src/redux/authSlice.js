import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk for Login
export const login = createAsyncThunk('auth/login', async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', formData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// Thunk for Registration
export const register = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/register', formData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userInfo: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.clear();
      state.userInfo = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
    
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.userInfo = action.payload; })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state) => { state.loading = false; })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;