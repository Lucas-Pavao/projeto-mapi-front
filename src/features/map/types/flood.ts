import type { FloodPrediction } from '../schemas/floodPointResponse.schema';
import type { SensorConfigDTO } from './sensor';
import type { PreciseData } from './common';

export interface FloodPointResponseDTO {
  id: number;
  slug: string;
  name: string;
  municipality: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  distanceToChannelM: number | null;
  basinName: string | null;
  sensorConfig: SensorConfigDTO | null;
  nearbySensorIds?: string[];
  liveData?: PreciseData;
  floodPrediction?: FloodPredictionResponseDTO;
  active: boolean;
  tideHeight: number | null;
  tideUnit: string | null;
}

export interface FloodPointRequestDTO {
  slug: string;
  name: string;
  municipality?: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitudeM?: number;
  distanceToChannelM?: number;
  sensorConfig?: SensorConfigDTO;
}

export interface FloodEventDTO {
  id: number;
  floodPointSlug: string;
  startTime: string;
  endTime: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  confirmedBy: string;
}

export interface ScraperEventDTO {
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  source: string;
}

/** Derivado do schema zod (ADR 0007): fonte única do contrato de predição. */
export type FloodPredictionResponseDTO = FloodPrediction;

export interface FloodScenarioLabelRequestDTO {
  latitude: number;
  longitude: number;
  isFlooded: boolean;
}

export interface FloodScenarioLabelResponseDTO {
  id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  isFlooded: boolean;
  currentRainfall: number | null;
  rainfall3hAccumulated: number | null;
  rainfall6hAccumulated: number | null;
  rainfall12hAccumulated: number | null;
  rainfall24hAccumulated: number | null;
  tideLevel: number | null;
  riverLevel: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  pressure: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  solarRadiation: number | null;
}
