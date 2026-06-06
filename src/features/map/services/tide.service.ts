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
    return response.data;
  },

  async getHarbors(ids: string): Promise<TabuaMareResponseListObject> {
    const response = await api.get<TabuaMareResponseListObject>(`/api/tabua-mare/harbors/${ids}`);
    return response.data;
  },

  async getHarborNamesByState(state: string): Promise<TabuaMareResponseListObject> {
    const response = await api.get<TabuaMareResponseListObject>(`/api/tabua-mare/harbors/state/${state}`);
    return response.data;
  },

  async uploadTidePdf(file: File, state?: string, year?: number): Promise<TideTableResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    const params: Record<string, string | number> = {};
    if (state) params.state = state;
    if (year) params.year = year;
    
    const response = await api.post<TideTableResponseDTO>('/api/tide/upload', formData, {
      params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async ingestLocalRecife(year?: number): Promise<TideTableResponseDTO> {
    const response = await api.post<TideTableResponseDTO>('/api/tide/ingest/local', null, {
      params: { year }
    });
    return response.data;
  },

  async ingestFromHtml(year: number, html: string): Promise<TideTableResponseDTO[]> {
    const response = await api.post<TideTableResponseDTO[]>('/api/tide/ingest/html', html, {
      params: { year },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  async triggerAutomaticIngestion(year?: number): Promise<TideTableResponseDTO[]> {
    const response = await api.post<TideTableResponseDTO[]>('/api/tide/ingest/automatic', null, {
      params: { year }
    });
    return response.data;
  },
};
