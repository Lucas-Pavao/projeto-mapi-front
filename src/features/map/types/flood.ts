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
