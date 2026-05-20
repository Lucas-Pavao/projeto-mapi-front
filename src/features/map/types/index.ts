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
  windDirection: number | null;
  solarRadiation: number | null;
  accumulatedPrecipitation: number | null;
  soilHumidity: any | null;
  waterLevel: number | null;
  flowRate: number | null;
  basinName: string | null;
  rawData?: string;
}

export interface WeatherResponseDTO {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    is_day: number;
    precipitation?: number;
  };
  generationtime_ms?: number;
  elevation?: number;
}

export interface PreciseDataResponse {
  requestedLatitude: number;
  requestedLongitude: number;
  preciseData: {
    source: string;
    timestamp: string;
    precipitation: number | null;
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    windSpeed: number | null;
    waterLevel: number | null;
    flowRate: number | null;
    unitPrecipitation: string | null;
    unitTemperature: string | null;
    unitWaterLevel: string | null;
    message: string | null;
  };
  nearestSensor: SensorResponseDTO;
  openMeteoData: WeatherResponseDTO;
  distanceToNearestSensorKm: number;
}
