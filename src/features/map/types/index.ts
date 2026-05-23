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

export interface SensorConfigDTO {
  estacao_pluviometrica_id?: string;
  estacao_nivel_rio_id?: string;
}

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

export interface HourDataDTO {
  hour: string;
  level: number;
}

export interface DayDataDTO {
  weekdayName: string;
  day: number;
  hours: HourDataDTO[];
}

export interface MonthDataDTO {
  monthName: string;
  month: number;
  days: DayDataDTO[];
}

export interface GeoLocationDTO {
  lat: string;
  lng: string;
  decimalLat: string;
  decimalLng: string;
  latDirection: string;
  lngDirection: string;
}

export interface TideTableResponseDTO {
  id: number;
  year: number;
  harborName: string;
  state: string;
  timezone: string;
  card: string;
  dataCollectionInstitution: string;
  meanLevel: number;
  geoLocations: GeoLocationDTO[];
  months: MonthDataDTO[];
  currentTideHeight: number;
}

export interface TabuaMareError {
  msg: string;
  code: number;
}

export interface TabuaMareResponseListObject {
  data: Record<string, unknown>[];
  total: number;
  error: TabuaMareError | null;
}

export interface TabuaMareResponseListString {
  data: string[];
  total: number;
  error: TabuaMareError | null;
}

export interface TabuaMareResponseObject {
  data: Record<string, unknown> | null;
  total: number;
  error: TabuaMareError | null;
}

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
  unitPrecipitation: string | null;
  unitTemperature: string | null;
  unitWaterLevel: string | null;
  unitTide: string | null;
  unitWave: string | null;
  message: string | null;
}

export interface MapiResponseDTO {
  requestedLatitude: number;
  requestedLongitude: number;
  preciseData: PreciseData;
  nearestSensor: SensorResponseDTO;
  openMeteoData: WeatherResponseDTO;
  distanceToNearestSensorKm: number;
}

export type PreciseDataResponse = MapiResponseDTO;
esponse = MapiResponseDTO;
