export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    is_active: boolean;
  };
  message: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  refresh_token: string;
  token_type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  full_name?: string;
  is_active: boolean;
}
