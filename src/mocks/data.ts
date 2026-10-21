/**
 * DADOS SINTÉTICOS. Nada aqui é medição, previsão ou ocorrência real: servem só para desenhar
 * e testar telas. Todo nome começa com "Sintético" para ninguém confundir com o ponto real.
 */
import type { PredictionSummary, RiskSummary } from '@/features/points/schemas/prediction.schema';
import type { SensorFreshness } from '@/features/sensors/schemas/sensor.schema';
import type { Alert, AlertRule } from '@/features/alerts/schemas/alert.schema';
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

export const points = [
  { id: 1, slug: SYNTHETIC_SLUG, name: 'Sintético: ponto de teste', municipality: 'Recife', description: 'Ponto sintético para desenho de tela.', latitude: -8.05, longitude: -34.9, altitudeM: 3, distanceToChannelM: 100, basinName: 'Sintético', sensorConfig: { pluviometerStationIds: ['SINTETICO-PLUV-01'], riverLevelStationIds: ['SINTETICO-RIO-01'] }, active: true, tideHeight: 1.4, tideUnit: 'm (NR da DHN)', floodPrediction: { riskLevel: 'HIGH', floodProbability: 0.78, modelValidationStatus: 'NOT_VALIDATED', issuedAt: ago(10) } },
  { id: 2, slug: 'sintetico-2', name: 'Sintético: ponto sem previsão', municipality: 'Jaboatão', description: null, latitude: -8.1, longitude: -34.95, altitudeM: null, distanceToChannelM: null, basinName: null, sensorConfig: null, active: false, tideHeight: null, tideUnit: null, floodPrediction: { riskLevel: 'UNKNOWN', floodProbability: null, degradationReason: 'AI_UNAVAILABLE', modelValidationStatus: 'NOT_VALIDATED' } },
];
export const terrain = (slug: string) => ({
  floodPointSlug: slug, status: 'OK', streetElevationM: 2.31, contributingAreaM2: 18450,
  diagnostics: { contributingAreaBySnapM2: { '0m': 17000, '5m': 18450, '10m': 19000, '20m': 21000 }, basinTouchesWindowEdge: false },
  provenance: { flightYear: 2016, verticalReference: 'datum do MDT' },
});

export const riskSummary = (): RiskSummary => ({ LOW: 5, MEDIUM: 2, HIGH: 1, UNKNOWN: 1, computedAt: ago(1) });

export const sensors: SensorFreshness[] = [
  { sensorId: 'SINTETICO-PLUV-01', type: 'PRECIPITATION', value: 2.4, unit: 'mm', stationName: 'Sintético: pluviômetro 1', municipality: 'Recife', source: 'CEMADEN', observedAt: ago(8), ageSeconds: 480, stale: false },
  { sensorId: 'SINTETICO-RIO-01', type: 'RIVER_LEVEL', value: 1.82, unit: 'm', stationName: 'Sintético: rio 1', municipality: 'Recife', source: 'APAC', observedAt: ago(9), ageSeconds: 540, stale: false },
  { sensorId: 'SINTETICO-PLUV-02', type: 'PRECIPITATION', value: null, unit: 'mm', stationName: 'Sintético: pluviômetro 2', municipality: 'Olinda', source: 'CEMADEN', observedAt: ago(300), ageSeconds: 18000, stale: true },
];

export const alerts: Alert[] = [
  { id: 1, ruleId: 1, kind: 'RISK_LEVEL', severity: 'CRITICAL', floodPointSlug: SYNTHETIC_SLUG, title: 'Sintético: risco alto no ponto de teste', detail: 'Dado sintético para desenho de tela.', riskLevel: 'HIGH', modelValidationStatus: 'NOT_VALIDATED', triggeredAt: ago(20), acknowledgedAt: null, acknowledgedBy: null },
  { id: 2, ruleId: 2, kind: 'PREDICTION_UNAVAILABLE', severity: 'WARNING', floodPointSlug: SYNTHETIC_SLUG, title: 'Sintético: previsão indisponível', detail: 'O modelo não respondeu.', riskLevel: 'UNKNOWN', degradationReason: 'AI_TIMEOUT', modelValidationStatus: 'NOT_VALIDATED', triggeredAt: ago(45), acknowledgedAt: null, acknowledgedBy: null },
];

export const acknowledgedAlert: Alert = { id: 3, ruleId: 3, kind: 'SENSOR_STALE', severity: 'INFO', stationId: 'SINTETICO-PLUV-02', title: 'Sintético: pluviômetro sem resposta', detail: null, triggeredAt: ago(200), acknowledgedAt: ago(150), acknowledgedBy: 'sintetico.operador' };
export const alertRules: AlertRule[] = [
  { id: 1, kind: 'RISK_LEVEL', floodPointSlug: null, stationId: null, threshold: null, thresholdSource: null, minRisk: 'HIGH', enabled: true, channels: ['BROWSER'], createdBy: 'sistema', createdAt: ago(5000), updatedAt: null },
  { id: 2, kind: 'RAIN_RATE', floodPointSlug: null, stationId: null, threshold: 55, thresholdSource: 'Sintético: fonte do limiar', minRisk: null, enabled: true, channels: ['BROWSER'], createdBy: 'sistema', createdAt: ago(5000), updatedAt: null },
  { id: 3, kind: 'SENSOR_STALE', floodPointSlug: null, stationId: null, threshold: 30, thresholdSource: null, minRisk: null, enabled: false, channels: ['BROWSER'], createdBy: 'sintetico.operador', createdAt: ago(4000), updatedAt: ago(100) },
];

/** Série sintética: chuva horária (t = fim da hora), maré e rio a cada 10 min. Só para desenhar telas. */
export const timeline = (from: string, to: string): Timeline => {
  const f = Date.parse(from);
  const t = Date.parse(to);
  const HOUR = 3_600_000;
  const rain: Array<{ t: string; v: number | null }> = [];
  for (let end = Math.ceil((f + 1) / HOUR) * HOUR; end <= t; end += HOUR) rain.push({ t: new Date(end).toISOString(), v: [0, 0, 0.4, 1.2, 4.8, 9.6, 3.2, 0.8][Math.floor(end / HOUR) % 8] });
  const tide: Array<{ t: string; v: number | null }> = [];
  const river: Array<{ t: string; v: number | null }> = [];
  for (let x = f; x <= t; x += 600_000) {
    tide.push({ t: new Date(x).toISOString(), v: Number((1.2 + 1.1 * Math.sin((x / HOUR / 12.4) * Math.PI * 2)).toFixed(2)) });
    river.push({ t: new Date(x).toISOString(), v: Number((1.5 + 0.6 * Math.sin(x / HOUR / 6)).toFixed(2)) });
  }
  return {
    from, to, stepMinutes: 10,
    rain: [{ stationId: 'SINTETICO-PLUV-01', points: rain }],
    tide: { harbor: 'pe02', points: tide },
    river: [{ stationId: 'SINTETICO-RIO-01', points: river }],
    risk: [{ slug: SYNTHETIC_SLUG, items: predictions(SYNTHETIC_SLUG) }],
    floodEvents: [{ id: 1, slug: SYNTHETIC_SLUG, startTime: ago(90), severity: 'MEDIUM' }],
  };
};


/** Estrutura real de resultado_etapa2.json com números SINTÉTICOS (nenhum é resultado do modelo). */
export const evaluation: ModelEvaluation = {
  sha256: '0'.repeat(64),
  source: 'sintetico/resultado-fake.json',
  frozenAt: null,
  result: {
    n_pos_principal: 11, n_pos_extra: 3, n_neg_bruto: 101, n_neg: 99, episodios_principal: 9, episodios_18: 12, dias_incompletos_avaliacao: [],
    auc_B2: [0.611, [0.402, 0.803]], auc_B3: [0.722, [0.511, 0.912]],
    m1: {
      central: { auc: 0.733, auc_ic: [0.52, 0.93], d_h1: 0.111, d_h1_ic: [-0.04, 0.26], cat_h1: 'inconclusivo', d_h2: 0, d_h2_ic: [0, 0], cat_h2: 'inconclusivo' },
      f0: { auc: 0.744, auc_ic: [0.53, 0.94], d_h1: 0.122, d_h1_ic: [-0.03, 0.27], cat_h1: 'inconclusivo', d_h2: 0, d_h2_ic: [0, 0], cat_h2: 'inconclusivo' },
    },
    class_h1: ['inconclusivo', []], class_h2: ['inconclusivo', []],
    degenerado: { alerta_M1a_em_N: 0, S_zero_em_todos_positivos: true, S_max_N: 0 },
    auc_todos: { 'B3/B3': { auc: 0.722, ic: [0.511, 0.912], exclui_05: true, auc18: 0.7, ic18: [0.5, 0.9] } },
    binarias: { 'M1a/central': { k14: 0, ic14: [0, 0.23], k18: 0, ic18: [0, 0.18], k4: 0, kn: 0, icn: [0, 0.005] } },
  },
};

export const reports: FloodReport[] = [
  { id: 1, latitude: -8.05, longitude: -34.9, observedAt: ago(15), waterDepth: 'KNEE', description: 'Sintético: água na altura do joelho', status: 'PENDING', nearestPointSlug: SYNTHETIC_SLUG, nearestPointDistanceM: 250, createdAt: ago(12) },
  { id: 3, latitude: -8.05, longitude: -34.905, observedAt: ago(500), waterDepth: 'WAIST', status: 'CONFIRMED', nearestPointSlug: SYNTHETIC_SLUG, nearestPointDistanceM: 80, createdAt: ago(480), reviewedAt: ago(400), reviewedBy: 'sintetico@example.org', floodEventId: 7 },
  { id: 2, latitude: -8.06, longitude: -34.95, observedAt: ago(200), waterDepth: null, status: 'DISCARDED', nearestPointSlug: null, nearestPointDistanceM: null, createdAt: ago(190), reviewedAt: ago(150), reviewedBy: 'sintetico@example.org', discardReason: 'Sintético: duplicado' },
];

export const ingestionSources: IngestionSource[] = [
  { source: 'CEMADEN', status: 'OK', expectedEveryMinutes: 10, lastSuccessAt: ago(4), lastRunId: '7c9e6679-7425-40de-944b-e07fc1f90ae7', lastError: null, rowsLast24h: 1440 },
  { source: 'APAC', status: 'DELAYED', expectedEveryMinutes: 10, lastSuccessAt: ago(55), lastRunId: '1b4e28ba-2fa1-11d2-883f-0016d3cca427', lastError: null, rowsLast24h: 900 },
  { source: 'OPEN_METEO', status: 'FAILING', expectedEveryMinutes: 60, lastSuccessAt: ago(600), lastRunId: null, lastError: 'Sintético: tempo esgotado', rowsLast24h: 3 },
];

export const users: UserSummary[] = [
  { id: 1, name: 'Sintético Admin', email: 'admin@example.org', role: 'ADMIN', active: true, lastLoginAt: ago(30) },
  { id: 2, name: 'Sintético Operador', email: 'operador@example.org', role: 'OPERADOR', active: true, lastLoginAt: ago(600) },
  { id: 3, name: null, email: 'morador@example.org', role: 'USER', active: false, lastLoginAt: null },
  { id: 4, name: null, email: null, role: 'USER', active: true, lastLoginAt: null }, // criado antes da V19: sem e-mail nem nome
];

export const publicRisk = (): PublicRisk => ({
  nearestPoint: { slug: SYNTHETIC_SLUG, name: 'Sintético: ponto de teste', distanceM: 300, riskLevel: 'MEDIUM', issuedAt: ago(10), validUntil: null, degradationReason: null },
  rainLastHourMm: 3.2,
  rainStationId: 'SINTETICO-PLUV-01',
  modelValidationStatus: 'NOT_VALIDATED',
  meaning: RISK_MEANING.MEDIUM,
});

export const ingestionRuns = [
  { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', source: 'CEMADEN', kind: 'LIVE', mode: 'REFETCH', status: 'SUCCEEDED', startedAt: ago(4), finishedAt: ago(3), fetched: 120, valid: 118, quarantined: 2, errorSummary: null },
  { id: '1b4e28ba-2fa1-11d2-883f-0016d3cca427', source: 'APAC', kind: 'LIVE', mode: 'REFETCH', status: 'FAILED', startedAt: ago(55), finishedAt: ago(54), fetched: 0, valid: 0, quarantined: 0, errorSummary: 'Sintético: tempo esgotado' },
];
export const integrity = [{ slug: SYNTHETIC_SLUG, totalWeatherRecords: 1200, totalSensorRecords: 3400, totalFloodEvents: 3, status: 'OK' }];
