export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenRead {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface AuthResponseData {
  profile: User;
  token: TokenRead;
}

export interface AuthBackendResponse {
  message?: { success: string };
  data: {
    user: AuthResponseData;
  };
}

export interface MeBackendResponse {
  message?: { success: string };
  data: {
    user: User;
  };
}

/** Body accepted by `PATCH /users/{id}`. */
export interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
}

/** Envelope returned by `PATCH /users/{id}`. */
export interface UserResponse {
  message?: { success: string };
  data: {
    user: User;
  };
}

