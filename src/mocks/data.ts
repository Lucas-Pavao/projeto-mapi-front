/**
 * DADOS SINTÉTICOS. Nada aqui é medição, previsão ou ocorrência real: servem só para desenhar
 * e testar telas. Todo nome começa com "Sintético" para ninguém confundir com o ponto real.
 */
import type { PredictionSummary, RiskSummary } from '@/features/points/schemas/prediction.schema';
import type { SensorFreshness } from '@/features/sensors/schemas/sensor.schema';
import type { Alert } from '@/features/alerts/schemas/alert.schema';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import type { ModelEvaluation } from '@/features/model/schemas/model.schema';
import type { FloodReport } from '@/features/reports/schemas/report.schema';
import type { IngestionSource, UserSummary } from '@/features/admin/schemas/admin.schema';
import type { PublicRisk } from '@/features/public-risk/schemas/public-risk.schema';
import { RISK_MEANING } from '@/components/risk/risk';

const MIN = 60_000;
const ago = (minutes: number) => new Date(Date.now() - minutes * MIN).toISOString();

export const SYNTHETIC_SLUG = 'sintetico-1';

export const predictions = (slug: string): PredictionSummary[] => [
  { slug, riskLevel: 'LOW', probability: 0.12, issuedAt: ago(180), validUntil: ago(120), horizonHours: 1, modelVersion: 'sintetico-0', degradationReason: null, modelValidationStatus: 'NOT_VALIDATED' },
  { slug, riskLevel: 'MEDIUM', probability: 0.41, issuedAt: ago(120), validUntil: ago(60), horizonHours: 1, modelVersion: 'sintetico-0', degradationReason: null, modelValidationStatus: 'NOT_VALIDATED' },
  { slug, riskLevel: 'HIGH', probability: 0.78, issuedAt: ago(60), validUntil: ago(0), horizonHours: 1, modelVersion: 'sintetico-0', degradationReason: null, modelValidationStatus: 'NOT_VALIDATED' },
  // UNKNOWN: sem probabilidade, com motivo da degradação.
  { slug, riskLevel: 'UNKNOWN', probability: null, issuedAt: ago(5), validUntil: null, horizonHours: null, modelVersion: null, degradationReason: 'AI_UNAVAILABLE', lastValidIssuedAt: ago(60), modelValidationStatus: 'NOT_VALIDATED' },
];

export const riskSummary = (): RiskSummary => ({ LOW: 5, MEDIUM: 2, HIGH: 1, UNKNOWN: 1, computedAt: ago(1) });

export const sensors: SensorFreshness[] = [
  { sensorId: 'SINTETICO-PLUV-01', type: 'PRECIPITATION', value: 2.4, observedAt: ago(8), ageSeconds: 480, stale: false },
  { sensorId: 'SINTETICO-RIO-01', type: 'RIVER_LEVEL', value: 1.82, observedAt: ago(9), ageSeconds: 540, stale: false },
  { sensorId: 'SINTETICO-PLUV-02', type: 'PRECIPITATION', value: null, observedAt: ago(300), ageSeconds: 18000, stale: true },
];

export const alerts: Alert[] = [
  { id: 1, ruleId: 1, kind: 'RISK_LEVEL', severity: 'CRITICAL', floodPointSlug: SYNTHETIC_SLUG, title: 'Sintético: risco alto no ponto de teste', detail: 'Dado sintético para desenho de tela.', riskLevel: 'HIGH', modelValidationStatus: 'NOT_VALIDATED', triggeredAt: ago(20), acknowledgedAt: null, acknowledgedBy: null },
  { id: 2, ruleId: 2, kind: 'PREDICTION_UNAVAILABLE', severity: 'WARNING', floodPointSlug: SYNTHETIC_SLUG, title: 'Sintético: previsão indisponível', detail: 'O modelo não respondeu.', riskLevel: 'UNKNOWN', degradationReason: 'AI_TIMEOUT', modelValidationStatus: 'NOT_VALIDATED', triggeredAt: ago(45), acknowledgedAt: null, acknowledgedBy: null },
];

export const timeline = (from: string, to: string): Timeline => ({
  from, to, stepMinutes: 10,
  rain: [{ stationId: 'SINTETICO-PLUV-01', points: [{ t: from, v: 0 }, { t: to, v: 2.4 }] }],
  tide: { harbor: 'pe02', points: [{ t: from, v: 0.8 }, { t: to, v: 2.1 }] },
  river: [{ stationId: 'SINTETICO-RIO-01', points: [{ t: from, v: 1.5 }, { t: to, v: 1.82 }] }],
  risk: [{ slug: SYNTHETIC_SLUG, items: predictions(SYNTHETIC_SLUG) }],
  floodEvents: [{ id: 1, slug: SYNTHETIC_SLUG, startTime: ago(90), severity: 'MEDIUM' }],
});

export const evaluation: ModelEvaluation = {
  sha256: '0'.repeat(64),
  source: 'sintetico/resultado-fake.json',
  frozenAt: ago(60 * 24 * 30),
  result: { observacao: 'Resultado sintético. Não é a avaliação real do modelo.' },
};

export const reports: FloodReport[] = [
  { id: 1, latitude: -8.05, longitude: -34.9, observedAt: ago(15), waterDepth: 'KNEE', status: 'PENDING', nearestPointSlug: SYNTHETIC_SLUG, nearestPointDistanceM: 250, createdAt: ago(12) },
  { id: 2, latitude: -8.06, longitude: -34.95, observedAt: ago(200), waterDepth: null, status: 'DISCARDED', nearestPointSlug: null, nearestPointDistanceM: null, createdAt: ago(190), reviewedAt: ago(150), reviewedBy: 'sintetico@example.org', discardReason: 'Sintético: duplicado' },
];

export const ingestionSources: IngestionSource[] = [
  { source: 'CEMADEN', status: 'OK', expectedEveryMinutes: 10, lastSuccessAt: ago(4), lastRunId: 101, lastError: null, rowsLast24h: 1440 },
  { source: 'APAC', status: 'DELAYED', expectedEveryMinutes: 10, lastSuccessAt: ago(55), lastRunId: 99, lastError: null, rowsLast24h: 900 },
  { source: 'OPEN_METEO', status: 'FAILING', expectedEveryMinutes: 60, lastSuccessAt: ago(600), lastRunId: 90, lastError: 'Sintético: tempo esgotado', rowsLast24h: 3 },
];

export const users: UserSummary[] = [
  { id: 1, name: 'Sintético Admin', email: 'admin@example.org', role: 'ADMIN', active: true, lastLoginAt: ago(30) },
  { id: 2, name: 'Sintético Operador', email: 'operador@example.org', role: 'OPERADOR', active: true, lastLoginAt: ago(600) },
  { id: 3, name: null, email: 'morador@example.org', role: 'USER', active: false, lastLoginAt: null },
];

export const publicRisk = (): PublicRisk => ({
  nearestPoint: { slug: SYNTHETIC_SLUG, name: 'Sintético: ponto de teste', distanceM: 300, riskLevel: 'MEDIUM', issuedAt: ago(10), validUntil: null, degradationReason: null },
  rainLastHourMm: 3.2,
  rainStationId: 'SINTETICO-PLUV-01',
  modelValidationStatus: 'NOT_VALIDATED',
  meaning: RISK_MEANING.MEDIUM,
});
