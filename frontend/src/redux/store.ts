import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import investigationReducer from './slices/investigationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    investigation: investigationReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
