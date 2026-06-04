import axios from 'axios';
import { API_URL, getAuthHeader } from './api';
import type { 
  FloodPointResponseDTO, 
  FloodPointRequestDTO, 
  MapiResponseDTO, 
  FloodEventDTO, 
  ScraperEventDTO,
  PreciseDataResponse
} from '../types';

export const floodService = {
  async getAllFloodPoints(): Promise<FloodPointResponseDTO[]> {
    const response = await axios.get<FloodPointResponseDTO[]>(`${API_URL}/api/pontos`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async createFloodPoint(data: FloodPointRequestDTO): Promise<FloodPointResponseDTO> {
    const response = await axios.post<FloodPointResponseDTO>(`${API_URL}/api/pontos`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getPointStatus(id_ponto: string): Promise<MapiResponseDTO> {
    const response = await axios.get<MapiResponseDTO>(`${API_URL}/api/pontos/${id_ponto}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getPreciseData(latitude: number, longitude: number): Promise<PreciseDataResponse> {
    const response = await axios.get<PreciseDataResponse>(`${API_URL}/api/precise-data`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async reportFlood(data: Partial<FloodEventDTO>): Promise<FloodEventDTO> {
    const response = await axios.post<FloodEventDTO>(`${API_URL}/api/eventos-alagamento`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async ingestScraperEvent(data: ScraperEventDTO): Promise<FloodEventDTO> {
    const response = await axios.post<FloodEventDTO>(`${API_URL}/api/eventos-alagamento/ingest`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
