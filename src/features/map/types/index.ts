export interface SensorResponseDTO {
  id: number;
  sensorId: string;
  value: number;
  unit: string;
  batteryStatus: string;
  timestamp: string;
  stationName: string;
  latitude: number;
  longitude: number;
  municipality: string;
  type: string;
  source: string;
  rawData: string;
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
  };
}
