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
