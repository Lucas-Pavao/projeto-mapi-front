import type { SensorResponseDTO, SensorReadingDTO } from './sensor';
import type { WeatherResponseDTO } from './weather';
import type { FloodPredictionResponseDTO } from './flood';

export interface Aggregates {
  rain3h: number | null;
  rain6h: number | null;
  rain12h: number | null;
  rain24h: number | null;
  /** Origem dos acumulados: OPEN_METEO_ARCHIVE (grade do pipeline) ou OPEN_METEO_FORECAST (últimas 24 h). */
  rainSource?: string | null;
  maxRiverLevel24h: number | null;
  avgTemperature24h: number | null;
}

export interface PreciseData {
  source: string;
  timestamp: string;
  sensorIds?: string[];
  latestReadings?: SensorReadingDTO[];
  historicalAggregates?: Aggregates;
  precipitation: number | null;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  waterLevel: number | null;
  flowRate: number | null;
  tideHeight: number | null;
  waveHeight: number | null;
  waveDirection: number | null;
  wavePeriod: number | null;
  tideHeightTabuaMare: number | null;
  solarRadiation: number | null;
  unitPrecipitation: string | null;
  unitTemperature: string | null;
  unitWaterLevel: string | null;
  unitTide: string | null;
  unitWave: string | null;
  unitWindSpeed: string | null;
  unitPressure: string | null;
  unitSolarRadiation: string | null;
  unitFlowRate: string | null;
  message: string | null;
}

export interface LocalElevation {
  meters: number | null;
  source: 'PE3D_MDT_5M' | 'OPEN_METEO_90M' | string;
  resolutionM: number | null;
  note: string | null;
}

export interface MapiResponseDTO {
  requestedLatitude: number;
  requestedLongitude: number;
  preciseData: PreciseData;
  nearestSensor: SensorResponseDTO | null;
  openMeteoData: WeatherResponseDTO;
  /** Altitude do local: cota do MDT do PE3D (5 m, relativa) ou, fora da área do MDT, Open-Meteo (90 m, aproximada). */
  localElevation?: LocalElevation | null;
  distanceToNearestSensorKm: number | null;
  floodPrediction?: FloodPredictionResponseDTO;
}

export interface IngestionAcceptedDTO {
  message: string;
}

export interface DataHealthReportDTO {
  slug: string;
  totalWeatherRecords: number;
  totalSensorRecords: number;
  totalFloodEvents: number;
  weatherRecordsByYear: Record<string, number>;
  sensorRecordsByYear: Record<string, number>;
  status: string;
}

export interface UnifiedDataDTO {
  floodPointSlug: string;
  timestamp: string;
  sensorPrecipitation: number;
  sensorWaterLevel: number;
  sensorSoilHumidity: number;
  weatherPrecipitation: number;
  weatherTemperature: number;
  weatherPressure: number;
  weatherCode: number;
  tideHeight: number;
  isFlooded: boolean;
  severity: string;
  accumulated3h: number;
  accumulated6h: number;
  accumulated12h: number;
  accumulated24h: number;
  accumulated48h: number;
}

export type PreciseDataResponse = MapiResponseDTO;
