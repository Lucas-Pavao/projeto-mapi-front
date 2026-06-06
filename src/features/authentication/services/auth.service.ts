import api from '@/lib/api';
import type { LoginResponse, AuthResponse, RegisterRequest } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', {
      username,
      password,
    });
    
    // Store refresh token if needed
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return {
      user: { username },
      token: response.data.accessToken || (response.data as unknown as { token?: string }).token || '',
    };
  },

  async register(data: RegisterRequest): Promise<void> {
    await api.post('/api/auth/register', data);
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/refresh', {
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
