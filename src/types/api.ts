/**
 * Tipos dos contratos novos do redesign, escritos à mão a partir de redesign-telas.yaml
 * (docs/redesign/F0-TELAS.md). Substituir por tipos gerados do OpenAPI quando o backend publicar.
 * Timestamps em ISO 8601 UTC ("Z"); converter para America/Recife só na exibição.
 */
import type { DegradationReason, ModelValidationStatus, RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';

export type { DegradationReason, ModelValidationStatus, RiskLevel };

export type Role = 'USER' | 'OPERADOR' | 'ADMIN';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SensorType = 'PRECIPITATION' | 'RIVER_LEVEL';
export type ReportStatus = 'PENDING' | 'CONFIRMED' | 'DISCARDED';

export interface PageMeta<T> {
  page: number;
  size: number;
  totalElements: number;
  content: T[];
}

export interface PredictionSummary {
  slug: string;
  riskLevel: RiskLevel;
  probability?: number | null;
  issuedAt: string;
  validUntil?: string | null;
  horizonHours?: number | null;
  modelVersion?: string | null;
  degradationReason?: DegradationReason | null;
  lastValidIssuedAt?: string | null;
  modelValidationStatus: ModelValidationStatus;
}

export interface RiskSummary {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  UNKNOWN: number;
  computedAt: string;
}

export interface SensorFreshness {
  sensorId: string;
  type: SensorType;
  value?: number | null;
  observedAt: string;
  ageSeconds: number;
  stale: boolean;
}

export type AlertKind = 'RISK_LEVEL' | 'RIVER_STAGE' | 'TIDE_ABOVE' | 'RAIN_RATE' | 'SENSOR_STALE' | 'PREDICTION_UNAVAILABLE';

export interface Alert {
  id: number;
  ruleId?: number | null;
  kind: AlertKind;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  floodPointSlug?: string | null;
  stationId?: string | null;
  title: string;
  detail?: string | null;
  observedValue?: number | null;
  riskLevel?: RiskLevel | null;
  degradationReason?: DegradationReason | null;
  modelValidationStatus?: ModelValidationStatus | null;
  triggeredAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
}

export interface TimePoint {
  t: string;
  v: number | null;
}

export interface Timeline {
  from: string;
  to: string;
  stepMinutes: number;
  rain: { stationId: string; points: TimePoint[] }[];
  tide: { harbor: string; points: TimePoint[] };
  river: { stationId: string; points: TimePoint[] }[];
  risk: { slug: string; items: PredictionSummary[] }[];
  floodEvents?: { id: number; slug: string; startTime: string; severity: Severity }[];
}

export interface ModelEvaluation {
  sha256: string;
  source: string;
  frozenAt?: string | null;
  result: Record<string, unknown>;
}

export interface BucketSimulation {
  model: 'M1a';
  illustrative: true;
  hMm: number[];
  hmaxMm: number;
  tCrossH?: number | null;
  nOutsideCurve: number;
  paramsUsed: { C: number; iT_mm_h: number; f: number; hcrit_mm: number; snap_m: number; curve_scale: number };
}

export interface FloodReport {
  id: number;
  latitude: number;
  longitude: number;
  observedAt: string;
  waterDepth?: 'ANKLE' | 'KNEE' | 'WAIST' | 'ABOVE_WAIST' | null;
  status: ReportStatus;
  nearestPointSlug?: string | null;
  nearestPointDistanceM?: number | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  floodEventId?: number | null;
  discardReason?: string | null;
}

export type IngestionStatus = 'OK' | 'DELAYED' | 'FAILING' | 'QUARANTINED' | 'IDLE';

export interface IngestionSource {
  source: string;
  status: IngestionStatus;
  expectedEveryMinutes?: number | null;
  lastSuccessAt?: string | null;
  lastRunId?: number | null;
  lastError?: string | null;
  rowsLast24h?: number;
}

export interface UserSummary {
  id: number;
  name?: string | null;
  email: string;
  role: Role;
  active: boolean;
  lastLoginAt?: string | null;
}

export interface PublicRisk {
  nearestPoint: {
    slug: string;
    name: string;
    distanceM: number;
    riskLevel: RiskLevel;
    issuedAt: string;
    validUntil?: string | null;
    degradationReason?: DegradationReason | null;
  } | null;
  rainLastHourMm?: number | null;
  rainStationId?: string | null;
  modelValidationStatus: ModelValidationStatus;
  /** Texto de RISK_MEANING, sem reescrita. */
  meaning: string;
}
