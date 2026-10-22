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
