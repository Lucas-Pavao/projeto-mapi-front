import axios from 'axios';
import type { 
  SensorResponseDTO, 
  WeatherResponseDTO, 
  PreciseDataResponse,
  FloodPointResponseDTO,
  FloodPointRequestDTO,
  MapiResponseDTO,
  TideTableResponseDTO,
  TabuaMareResponseListObject,
  TabuaMareResponseListString,
  TabuaMareResponseObject,
  FloodEventDTO,
  ScraperEventDTO,
  DataHealthReportDTO,
  UnifiedDataDTO
} from '../types';

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

  async getPreciseData(latitude: number, longitude: number): Promise<PreciseDataResponse> {
    const response = await axios.get<PreciseDataResponse>(`${API_URL}/api/precise-data`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },

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

  async getSensorHistory(sensorId: string): Promise<SensorResponseDTO[]> {
    const response = await axios.get<SensorResponseDTO[]>(`${API_URL}/api/sensors/${sensorId}/history`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getLatestBySensorId(sensorId: string): Promise<SensorResponseDTO> {
    const response = await axios.get<SensorResponseDTO>(`${API_URL}/api/sensors/${sensorId}/latest`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getMarineData(latitude: number, longitude: number): Promise<Record<string, unknown>> {
    const response = await axios.get<Record<string, unknown>>(`${API_URL}/api/marine`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getWaveHeight(latitude: number, longitude: number): Promise<number> {
    const response = await axios.get<number>(`${API_URL}/api/marine/wave-height`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Tide Endpoints
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

  // Tabua de Mare (DevTu) Endpoints
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

  // Flood Events
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

  async getFloodHistory(slug: string): Promise<FloodEventDTO[]> {
    const response = await axios.get<FloodEventDTO[]>(`${API_URL}/api/eventos-alagamento/${slug}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Export Data
  async getUnifiedIAData(slug: string, days = 30): Promise<UnifiedDataDTO[]> {
    const response = await axios.get<UnifiedDataDTO[]>(`${API_URL}/api/export/ia-dataset/${slug}`, {
      params: { days },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getUnifiedIADataCsv(slug: string, days = 30): Promise<string> {
    const response = await axios.get<string>(`${API_URL}/api/export/ia-dataset/${slug}/csv`, {
      params: { days },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getAllPointsIADataCsv(days = 0): Promise<string> {
    const response = await axios.get<string>(`${API_URL}/api/export/ia-dataset/all/csv`, {
      params: { days },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Admin Ingestion
  async checkDataIntegrity(): Promise<DataHealthReportDTO[]> {
    const response = await axios.get<DataHealthReportDTO[]>(`${API_URL}/api/admin/ingestion/check-integrity`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async repairStations(): Promise<string> {
    const response = await axios.post<string>(`${API_URL}/api/admin/ingestion/repair-stations`, null, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async startFullSync(years = 5): Promise<string> {
    const response = await axios.post<string>(`${API_URL}/api/admin/ingestion/historical-full-sync`, null, {
      params: { years },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async wipeDatabase(): Promise<string> {
    const response = await axios.delete<string>(`${API_URL}/api/admin/ingestion/wipe-database`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async alignEvents(): Promise<string> {
    const response = await axios.post<string>(`${API_URL}/api/admin/ingestion/align-events`, null, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Ingestion Endpoints (Admin/System)
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
