import api from '@/lib/api';
import type { 
  TideTableResponseDTO, 
  TabuaMareResponseListObject, 
  TabuaMareResponseListString, 
  TabuaMareResponseObject 
} from '../types';

export const tideService = {
  async getTideTable(harbor: string, year?: number): Promise<TideTableResponseDTO> {
    const response = await api.get<TideTableResponseDTO>(`/api/tide/${harbor}`, {
      params: { year }
    });
    return response.data;
  },

  async getTideByState(state: string, year?: number): Promise<TideTableResponseDTO[]> {
    const response = await api.get<TideTableResponseDTO[]>(`/api/tide/state/${state}`, {
      params: { year }
    });
    return response.data;
  },

  async searchTide(harbor: string, year?: number): Promise<TideTableResponseDTO[]> {
    const response = await api.get<TideTableResponseDTO[]>('/api/tide/search', {
      params: { harbor, year }
    });
    return response.data;
  },

  async listHarbors(year?: number): Promise<string[]> {
    const response = await api.get<string[]>('/api/tide/harbors', {
      params: { year }
    });
    return response.data;
  },

  async getDevTuTideTable(harbor: string, month: number, days: string): Promise<TabuaMareResponseListObject> {
    const response = await api.get<TabuaMareResponseListObject>(`/api/tabua-mare/tide/${harbor}/${month}/${days}`);
    return response.data;
  },

  async getStates(): Promise<TabuaMareResponseListString> {
    const response = await api.get<TabuaMareResponseListString>('/api/tabua-mare/states');
    return response.data;
  },

  async getNearestHarbor(latitude: number, longitude: number): Promise<TabuaMareResponseObject> {
    const response = await api.get<TabuaMareResponseObject>('/api/tabua-mare/nearest', {
      params: { latitude, longitude }
    });
    // The backend passes the external tabuamare API payload through as-is,
    // and that upstream API is inconsistent: `data` can arrive as either a
    // single harbor object or a one-item array of harbor objects (the
    // backend's own TabuaMareServiceImpl.getTideHeightAt() branches on
    // `instanceof List`/`instanceof Map` for this exact reason). Normalize
    // to a single object here so every frontend consumer can rely on one
    // shape instead of reimplementing the List/Map check.
    const rawData = response.data?.data;
    const normalizedData = Array.isArray(rawData) ? (rawData[0] ?? null) : rawData;
    return { ...response.data, data: normalizedData };
  },

  async getHarbors(ids: string): Promise<TabuaMareResponseListObject> {
    const response = await api.get<TabuaMareResponseListObject>(`/api/tabua-mare/harbors/${ids}`);
    return response.data;
  },

  async getHarborNamesByState(state: string): Promise<TabuaMareResponseListObject> {
    const response = await api.get<TabuaMareResponseListObject>(`/api/tabua-mare/harbors/state/${state}`);
    return response.data;
  },
};
