import axios from 'axios';
import type { SensorResponseDTO, WeatherResponseDTO } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const mapService = {
  async getLatestSensors(): Promise<SensorResponseDTO[]> {
    const response = await axios.get<SensorResponseDTO[]>(`${API_URL}/api/sensors/latest`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getWeather(latitude: number, longitude: number): Promise<WeatherResponseDTO> {
    const response = await axios.get<WeatherResponseDTO>(`${API_URL}/api/weather`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
