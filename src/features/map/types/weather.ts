export interface WeatherResponseDTO {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    surface_pressure?: number | null;
    weather_code: number;
    is_day: number;
    precipitation?: number;
    wind_speed_10m?: number | null;
    shortwave_radiation?: number | null;
  };
  generationtime_ms?: number;
  elevation?: number;
}
