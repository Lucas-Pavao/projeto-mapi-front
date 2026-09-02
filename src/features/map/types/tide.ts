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

export interface TideSyncSummaryDTO {
  harborsSynced: number;
  monthsSynced: number;
  errors: number;
  harborNames: string[];
}
