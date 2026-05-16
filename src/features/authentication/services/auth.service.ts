import axios from 'axios';
import type { LoginResponse, AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    
    // Mapping the API response to the app's internal AuthResponse
    return {
      user: { username },
      token: response.data.accessToken,
    };
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
