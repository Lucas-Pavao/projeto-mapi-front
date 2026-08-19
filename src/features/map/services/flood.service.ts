import api from '@/lib/api';
import { validateFloodPoint } from '../schemas/floodPointResponse.schema';
import type {
  FloodPointResponseDTO,
  FloodPointRequestDTO,
  FloodEventDTO,
  ScraperEventDTO,
  PreciseDataResponse,
  PreciseData,
  FloodScenarioLabelResponseDTO,
  FloodPredictionResponseDTO
} from '../types';

// The backend (MapiResponseDTO.SensorReadingDTO) serializes two fields of
// `latestReadings` with explicit @JsonProperty snake_case aliases
// ("sensor_id" and "distance_km") while every other field in the API stays
// camelCase. Left untouched, `reading.sensorId` / `reading.distanceKm`
// resolve to `undefined` at runtime even though the TS types claim
// otherwise. Normalize here, at the service boundary, so every consumer
// downstream can keep using the camelCase contract declared in
// `SensorReadingDTO`.
export const normalizePreciseData = <T extends PreciseData | null | undefined>(preciseData: T): T => {
  if (!preciseData?.latestReadings?.length) return preciseData;
  return {
    ...preciseData,
    latestReadings: preciseData.latestReadings.map((reading) => {
      const raw = reading as unknown as Record<string, unknown>;
      return {
        ...reading,
        sensorId: (raw.sensor_id as string | undefined) ?? reading.sensorId,
        distanceKm: (raw.distance_km as number | undefined) ?? reading.distanceKm,
      };
    }),
  } as T;
};

// The backend (FloodPredictionResponseDTO) serializes its three numeric/risk
// fields with explicit @JsonProperty snake_case aliases ("flood_probability",
// "risk_level", "estimated_time_to_event") while the TS contract declares
// them camelCase. Left untouched, `prediction.riskLevel` / `.floodProbability`
// / `.estimatedTimeToEvent` resolve to `undefined` at runtime, which silently
// breaks all risk-level visualization (map marker colors, popups, detail
// cards). Normalize here, at the service boundary, so every consumer
// downstream can keep using the camelCase contract declared in
// `FloodPredictionResponseDTO`.
export const normalizeFloodPrediction = <T extends FloodPredictionResponseDTO | null | undefined>(prediction: T): T => {
  if (!prediction) return prediction;
  const raw = prediction as unknown as Record<string, unknown>;
  return {
    ...prediction,
    floodProbability: (raw.flood_probability as number | undefined) ?? prediction.floodProbability,
    riskLevel: (raw.risk_level as string | undefined) ?? prediction.riskLevel,
    estimatedTimeToEvent: (raw.estimated_time_to_event as string | undefined) ?? prediction.estimatedTimeToEvent,
  } as T;
};

export const floodService = {
  async getAllFloodPoints(): Promise<FloodPointResponseDTO[]> {
    const response = await api.get<FloodPointResponseDTO[]>('/api/pontos');
    return response.data.map((point) => {
      const normalized = {
        ...point,
        liveData: normalizePreciseData(point.liveData),
        floodPrediction: normalizeFloodPrediction(point.floodPrediction),
      };
      return validateFloodPoint(normalized);
    });
  },

  async createFloodPoint(data: FloodPointRequestDTO): Promise<FloodPointResponseDTO> {
    const response = await api.post<FloodPointResponseDTO>('/api/pontos', data);
    return validateFloodPoint({
      ...response.data,
      liveData: normalizePreciseData(response.data.liveData),
      floodPrediction: normalizeFloodPrediction(response.data.floodPrediction),
    });
  },

  async getPointStatus(id_ponto: string): Promise<FloodPointResponseDTO> {
    const response = await api.get<FloodPointResponseDTO>(`/api/pontos/${id_ponto}`);
    return validateFloodPoint({
      ...response.data,
      liveData: normalizePreciseData(response.data.liveData),
      floodPrediction: normalizeFloodPrediction(response.data.floodPrediction),
    });
  },

  async getPreciseData(latitude: number, longitude: number): Promise<PreciseDataResponse> {
    const response = await api.get<PreciseDataResponse>('/api/precise-data', {
      params: { latitude, longitude }
    });
    return {
      ...response.data,
      preciseData: normalizePreciseData(response.data.preciseData),
      floodPrediction: normalizeFloodPrediction(response.data.floodPrediction),
    };
  },

  async reportFlood(data: Partial<FloodEventDTO>): Promise<FloodEventDTO> {
    const response = await api.post<FloodEventDTO>('/api/eventos-alagamento', data);
    return response.data;
  },

  async ingestScraperEvent(data: ScraperEventDTO): Promise<FloodEventDTO> {
    const response = await api.post<FloodEventDTO>('/api/eventos-alagamento/ingest', data);
    return response.data;
  },

  async reportScenario(data: { latitude: number; longitude: number; isFlooded: boolean }): Promise<FloodScenarioLabelResponseDTO> {
    const response = await api.post<FloodScenarioLabelResponseDTO>('/api/pontos/scenarios', data);
    return response.data;
  },
};

