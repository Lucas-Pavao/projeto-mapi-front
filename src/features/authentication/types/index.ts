export interface User {
  username: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
}
