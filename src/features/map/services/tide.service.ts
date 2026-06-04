import axios from 'axios';
import { API_URL, getAuthHeader } from './api';
import type { 
  TideTableResponseDTO, 
  TabuaMareResponseListObject, 
  TabuaMareResponseListString, 
  TabuaMareResponseObject 
} from '../types';

export const tideService = {
  async getTideTable(harbor: string, year?: number): Promise<TideTableResponseDTO> {
    const response = await axios.get<TideTableResponseDTO>(`${API_URL}/api/tide/${harbor}`, {
      params: { year },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getTideByState(state: string, year?: number): Promise<TideTableResponseDTO[]> {
    const response = await axios.get<TideTableResponseDTO[]>(`${API_URL}/api/tide/state/${state}`, {
      params: { year },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async searchTide(harbor: string, year?: number): Promise<TideTableResponseDTO[]> {
    const response = await axios.get<TideTableResponseDTO[]>(`${API_URL}/api/tide/search`, {
      params: { harbor, year },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async listHarbors(year?: number): Promise<string[]> {
    const response = await axios.get<string[]>(`${API_URL}/api/tide/harbors`, {
      params: { year },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getDevTuTideTable(harbor: string, month: number, days: string): Promise<TabuaMareResponseListObject> {
    const response = await axios.get<TabuaMareResponseListObject>(`${API_URL}/api/tabua-mare/tide/${harbor}/${month}/${days}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getStates(): Promise<TabuaMareResponseListString> {
    const response = await axios.get<TabuaMareResponseListString>(`${API_URL}/api/tabua-mare/states`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getNearestHarbor(latitude: number, longitude: number): Promise<TabuaMareResponseObject> {
    const response = await axios.get<TabuaMareResponseObject>(`${API_URL}/api/tabua-mare/nearest`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getHarbors(ids: string): Promise<TabuaMareResponseListObject> {
    const response = await axios.get<TabuaMareResponseListObject>(`${API_URL}/api/tabua-mare/harbors/${ids}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getHarborNamesByState(state: string): Promise<TabuaMareResponseListObject> {
    const response = await axios.get<TabuaMareResponseListObject>(`${API_URL}/api/tabua-mare/harbors/state/${state}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async uploadTidePdf(file: File, state?: string, year?: number): Promise<TideTableResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    const params: Record<string, string | number> = {};
    if (state) params.state = state;
    if (year) params.year = year;
    
    const response = await axios.post<TideTableResponseDTO>(`${API_URL}/api/tide/upload`, formData, {
      params,
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async ingestLocalRecife(year?: number): Promise<TideTableResponseDTO> {
    const response = await axios.post<TideTableResponseDTO>(`${API_URL}/api/tide/ingest/local`, null, {
      params: { year },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async ingestFromHtml(year: number, html: string): Promise<TideTableResponseDTO[]> {
    const response = await axios.post<TideTableResponseDTO[]>(`${API_URL}/api/tide/ingest/html`, html, {
      params: { year },
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  async triggerAutomaticIngestion(year?: number): Promise<TideTableResponseDTO[]> {
    const response = await axios.post<TideTableResponseDTO[]>(`${API_URL}/api/tide/ingest/automatic`, null, {
      params: { year },
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
