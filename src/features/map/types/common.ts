import type { SensorResponseDTO } from './sensor';
import type { WeatherResponseDTO } from './weather';
import type { FloodPredictionResponseDTO } from './flood';

export interface PreciseData {
  source: string;
  timestamp: string;
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

export interface MapiResponseDTO {
  requestedLatitude: number;
  requestedLongitude: number;
  preciseData: PreciseData;
  nearestSensor: SensorResponseDTO;
  openMeteoData: WeatherResponseDTO;
  distanceToNearestSensorKm: number;
  floodPrediction?: FloodPredictionResponseDTO;
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
