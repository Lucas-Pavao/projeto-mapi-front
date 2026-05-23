export interface User {
  username: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}
