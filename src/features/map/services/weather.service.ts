import api from '@/lib/api';
import type { WeatherResponseDTO } from '../types';

export const weatherService = {
  async getWeather(latitude: number, longitude: number): Promise<WeatherResponseDTO> {
    const response = await api.get<WeatherResponseDTO>('/api/weather', {
      params: { latitude, longitude }
    });
    return response.data;
  },
};
