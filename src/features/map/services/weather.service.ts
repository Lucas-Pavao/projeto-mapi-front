import axios from 'axios';
import { API_URL, getAuthHeader } from './api';
import type { WeatherResponseDTO } from '../types';

export const weatherService = {
  async getWeather(latitude: number, longitude: number): Promise<WeatherResponseDTO> {
    const response = await axios.get<WeatherResponseDTO>(`${API_URL}/api/weather`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
