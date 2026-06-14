// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; // Adjust this path to match where your authSlice lives

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;