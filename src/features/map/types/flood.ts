import type { SensorConfigDTO } from './sensor';
import type { PreciseData } from './common';

export interface FloodPointResponseDTO {
  id: number;
  id_ponto: string;
  nome: string;
  municipio: string | null;
  descricao: string | null;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  dist_canal_m: number | null;
  bacia_hidrografica: string | null;
  config_sensores: SensorConfigDTO | null;
  sensores_proximos_ids?: string[];
  liveData?: PreciseData;
  floodPrediction?: FloodPredictionResponseDTO;
  active: boolean;
  tideHeight: number | null;
  tideUnit: string | null;
}

export interface FloodPointRequestDTO {
  id_ponto: string;
  nome: string;
  municipio?: string;
  descricao?: string;
  latitude: number;
  longitude: number;
  altitude_m?: number;
  dist_canal_m?: number;
  config_sensores?: SensorConfigDTO;
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

export interface FloodPredictionResponseDTO {
  floodProbability: number;
  riskLevel: string;
  estimatedTimeToEvent: string;
  message: string;
}
