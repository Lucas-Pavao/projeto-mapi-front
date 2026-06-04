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
}

export interface SensorConfigDTO {
  estacao_pluviometrica_id?: string;
  estacao_nivel_rio_id?: string;
}
