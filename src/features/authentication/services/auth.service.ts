import axios from 'axios';
import type { LoginResponse, AuthResponse, RegisterRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    
    // Store refresh token if needed, or just return the response
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return {
      user: { username },
      token: response.data.accessToken,
    };
  },

  async register(data: RegisterRequest): Promise<void> {
    await axios.post(`${API_URL}/api/auth/register`, data);
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/api/auth/refresh`, {
      refreshToken,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};
