import type { StationCardData } from '@/features/map/cards/schemas/stationCard.schema';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';
import type { RainCandidates } from '@/features/points/schemas/rain-candidates.schema';

/** DADOS SINTÉTICOS dos cards do mapa (B6/B7). Só desenham e testam telas. */
const ATTRIBUTION = 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC';

const HOUR_END = Math.floor(Date.now() / 600_000) * 600_000;

/** 18 blocos de 10 min; `mm(i)` devolve o valor ou null (sem dado). */
export const blocksOf = (mm: (i: number) => number | null, source: 'CEMADEN' | 'CEMADEN_PED' = 'CEMADEN_PED', peakAt = -1): StationCardData['blocks'] =>
  Array.from({ length: 18 }, (_, i) => {
    const v = mm(i);
    return { endUtc: new Date(HOUR_END - (17 - i) * 600_000).toISOString(), mm: v, source: v == null ? null : i >= 16 ? 'CEMADEN' : source, peakRemoved: i === peakAt };
  });

const base: StationCardData = {
  canonicalId: 'SINT-A', name: 'Sintético: Areias', aliases: ['CEMADEN:SINT-A', 'CEMADEN_PED:SINT-A'], aliasDistanceM: 12, sources: ['CEMADEN', 'CEMADEN_PED'], pedOnly: false,
  state: 'NORMAL', nowMmH: 3.2, nowSource: 'CEMADEN_PED', liveMmH: 3.0, pedMmH: 3.2, pedPending: false,
  blocks: blocksOf((i) => (i % 5) * 0.4), acc1hMm: 2.1, acc3hMm: 5.0, acc24hMm: null, note: null,
  monthCheck: { monthStartUtc: '2026-11-01T00:00:00Z', status: 'OK', reasons: [] }, quarantineToday: { GAP: 0, AFTER_GAP: 0, SUSPECT_QUALIFIER: 0 },
  uses: [{ slug: 'AV_RECIFE_IBURA', name: 'Av. Recife - Entrada do Ibura', distanceM: 688, role: 'USED', usedStationName: null }, { slug: 'CIN_UFPE', name: 'CIn UFPE', distanceM: 3400, role: 'LOWER', usedStationName: 'Ibura' }],
  lastReadingUtc: new Date(HOUR_END).toISOString(), attribution: ATTRIBUTION,
};

/** Os 8 estados do card: 7 `state` + a variante só PED. */
export const STATION_CARD_FIXTURES: Record<string, StationCardData> = {
  normal: base,
  divergent: { ...base, state: 'DIVERGENT', liveMmH: 2.0, note: { kind: 'DIVERGENT', hourEndUtc: new Date(HOUR_END).toISOString(), liveMm: 2.0, pedMm: 3.2, diffMm: 1.2 } },
  peak: { ...base, state: 'PEAK_REMOVED', blocks: blocksOf((i) => (i === 6 ? 2 : 0.4), 'CEMADEN_PED', 6), note: { kind: 'PEAK_REMOVED', hourEndUtc: new Date(HOUR_END - 6_000_000).toISOString() } },
  unchecked: { ...base, state: 'UNCHECKED', monthCheck: { monthStartUtc: '2026-11-01T00:00:00Z', status: 'UNCHECKED', reasons: ['FEW_WET_NEIGHBORS'] } },
  gap: { ...base, state: 'GAP_NOW', nowMmH: null, nowSource: null, liveMmH: null, pedMmH: null, blocks: blocksOf((i) => (i >= 15 ? null : 0.4)), acc1hMm: null, acc3hMm: null, quarantineToday: { GAP: 2, AFTER_GAP: 0, SUSPECT_QUALIFIER: 0 } },
  noResponse: { ...base, state: 'NO_RESPONSE', nowMmH: null, nowSource: null, liveMmH: null, pedMmH: null, blocks: blocksOf((i) => (i >= 6 ? null : 0.4)), acc1hMm: null, acc3hMm: null, lastReadingUtc: new Date(HOUR_END - 4 * 3_600_000).toISOString(),
    uses: [{ slug: 'AV_RECIFE_IBURA', name: 'Av. Recife - Entrada do Ibura', distanceM: 688, role: 'NO_VALUE', usedStationName: null }] },
  failMonth: { ...base, state: 'FAIL_MONTH', monthCheck: { monthStartUtc: '2026-11-01T00:00:00Z', status: 'FAIL', reasons: ['UNDERCATCH'] }, uses: [{ slug: 'AV_RECIFE_IBURA', name: 'Av. Recife - Entrada do Ibura', distanceM: 688, role: 'EXCLUDED', usedStationName: null }] },
  pedOnly: { ...base, canonicalId: 'SINT-P', name: 'Sintético: Cavaleiro', aliases: ['CEMADEN_PED:SINT-P'], aliasDistanceM: null, sources: ['CEMADEN_PED'], pedOnly: true, liveMmH: null },
};

export const stationCardFor = (id: string): StationCardData => ({ ...base, canonicalId: id, name: `Sintético: ${id}` });

const TH = { medium: 0.0159, high: 0.2441, source: 'metadata' };
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const pointBase = {
  id: 1, slug: 'AGAMENON_DERBY', name: 'Av. Agamenon - Derby', municipality: 'Recife', description: 'Canal e maré', latitude: -8.05, longitude: -34.9, altitudeM: 3, distanceToChannelM: 100,
  basinName: null, sensorConfig: null, active: true, tideHeight: 1.4, tideUnit: 'DHN (NR)', liveData: { historicalAggregates: { rain3h: 12.4 } },
} as unknown as FloodPointResponseDTO;

const pred = (over: Record<string, unknown>) => ({ modelValidationStatus: 'NOT_VALIDATED', modelVersion: 'xgb_v2', rainSource: 'MEASURED', trainingData: 'SYNTHETIC', riskThresholds: TH, issuedAt: ago(10), validUntil: ago(-50),
  contributors: [{ featureId: 'rain_3h', label: 'Chuva acumulada em 3 horas', contribution: 0.21, value: 12.4, unit: 'mm' }], ...over });

/** Os 5 estados do card do ponto. */
export const POINT_CARD_FIXTURES: Record<'high' | 'medium' | 'low' | 'insufficient' | 'unavailable', FloodPointResponseDTO> = {
  high: { ...pointBase, floodPrediction: pred({ riskLevel: 'HIGH', floodProbability: 0.31 }) } as FloodPointResponseDTO,
  medium: { ...pointBase, floodPrediction: pred({ riskLevel: 'MEDIUM', floodProbability: 0.12 }) } as FloodPointResponseDTO,
  low: { ...pointBase, floodPrediction: pred({ riskLevel: 'LOW', floodProbability: 0.004 }) } as FloodPointResponseDTO,
  insufficient: { ...pointBase, floodPrediction: { riskLevel: 'UNKNOWN', floodProbability: null, degradationReason: 'INSUFFICIENT_DATA', modelValidationStatus: 'NOT_VALIDATED', modelVersion: 'xgb_v2' } } as FloodPointResponseDTO,
  unavailable: { ...pointBase, floodPrediction: { riskLevel: 'UNKNOWN', floodProbability: null, degradationReason: 'AI_UNAVAILABLE', modelValidationStatus: 'NOT_VALIDATED', lastValidIssuedAt: ago(90) } } as FloodPointResponseDTO,
};

/** Série de 12 h: probabilidades válidas e, quando `gap`, as 3 últimas horas sem previsão (UNKNOWN). */
export const pointSeries = (gap = false): PredictionSummary[] =>
  [0.01, 0.02, 0.05, 0.12, 0.31, 0.2].map((probability, i) => ({ slug: 'AGAMENON_DERBY', riskLevel: 'LOW', probability, issuedAt: ago(660 - i * 120), modelValidationStatus: 'NOT_VALIDATED', riskThresholds: TH } as PredictionSummary))
    .concat(gap ? [{ slug: 'AGAMENON_DERBY', riskLevel: 'UNKNOWN', probability: null, issuedAt: ago(30), degradationReason: 'INSUFFICIENT_DATA', modelValidationStatus: 'NOT_VALIDATED' } as PredictionSummary] : []);

export const pointRain = (over: Partial<RainCandidates> = {}): RainCandidates => ({
  slug: 'AGAMENON_DERBY', hourEndUtc: ago(10), radiusM: 5000, ruleVersion: 'chuva-ponto-v4', valueMm: 3.2, usedStationId: 'SINT-A',
  candidates: [
    { stationId: 'SINT-A', name: 'Sintético: Areias', distanceM: 690, valueMm: 3.2, monthStatus: 'OK', reasons: [], role: 'USED' },
    { stationId: 'SINT-B', name: 'Sintético: Ibura', distanceM: 1900, valueMm: 1.1, monthStatus: 'UNCHECKED', reasons: [], role: 'LOWER' },
    { stationId: 'SINT-C', name: 'Sintético: Boa Viagem', distanceM: 3400, valueMm: null, monthStatus: 'FAIL', reasons: ['STUCK_ZERO'], role: 'EXCLUDED' },
  ],
  attribution: ATTRIBUTION, ...over,
});
