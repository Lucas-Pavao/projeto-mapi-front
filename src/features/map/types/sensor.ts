export interface SensorResponseDTO {
  id: number;
  sensorId: string;
  value: number | null;
  unit: string | null;
  batteryStatus: string | null;
  timestamp: string;
  stationName: string | null;
  latitude: number | null;
  longitude: number | null;
  municipality: string | null;
  type: string | null;
  source: string | null;
  fogValueReference: number | null;
  code: string | null;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  solarRadiation: number | null;
  accumulatedPrecipitation: number | null;
  soilHumidity: Record<string, unknown> | null;
  waterLevel: number | null;
  flowRate: number | null;
  basinName: string | null;
  tideHeight?: number | null;
  rawData?: string;
  // Estações fluviométricas da APAC com alerta oficial (ex.: Rio Duas Unas)
  riverName?: string | null;
  riverPreAlertLevel?: number | null;
  riverAlertLevel?: number | null;
  riverFloodLevel?: number | null;
}

export interface SensorReadingDTO {
  sensorId: string;
  latitude: number;
  longitude: number;
  value: number;
  unit: string;
  type: string;
  timestamp: string;
  distanceKm: number;
}

export interface SensorConfigDTO {
  estacoes_pluviometricas_ids?: string[];
  estacoes_nivel_rio_ids?: string[];
}
