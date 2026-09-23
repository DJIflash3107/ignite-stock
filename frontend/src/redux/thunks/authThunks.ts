import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiPost, apiGet, TOKEN_STORAGE_KEY } from '@/lib/api-client';
import { extractErrorMessage } from '@/lib/api-error';
import { logout } from '@/redux/slices/authSlice';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthBackendResponse,
  MeBackendResponse,
} from '@/models/auth';

export interface AuthSuccessPayload {
  user: User;
  token: string;
}

export const loginUser = createAsyncThunk<
  AuthSuccessPayload,
  LoginRequest,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await apiPost<AuthBackendResponse>('/auth/login', credentials);
    const user = response.data.user.profile;
    const token = response.data.user.token.access_token;
    return { user, token };
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, 'Login failed. Please check your credentials.'));
  }
});

export const registerUser = createAsyncThunk<
  AuthSuccessPayload,
  RegisterRequest,
  { rejectValue: string }
>('auth/register', async (data, { rejectWithValue }) => {
  try {
    const response = await apiPost<AuthBackendResponse>('/auth/register', data);
    const user = response.data.user.profile;
    const token = response.data.user.token.access_token;
    return { user, token };
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, 'Registration failed. Please try again.'));
  }
});

export const fetchCurrentUser = createAsyncThunk<
  { user: User },
  void,
  { rejectValue: string }
>('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await apiGet<MeBackendResponse>('/auth/me');
    return { user: response.data.user };
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, 'Failed to fetch user session.'));
  }
});

export const logoutUser = createAsyncThunk<void, void>(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    dispatch(logout());
  }
);
