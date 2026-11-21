import type { StationCardData } from '@/features/map/cards/schemas/stationCard.schema';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { LocationAnalysis } from '@/features/map/cards/schemas/locationAnalysis.schema';
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

/**
 * Os 8 estados do card: 7 `state` + a variante só PED. NO_RESPONSE = nenhuma leitura nas 3 h; GAP_NOW = nenhuma leitura em
 * (at − 70 min, at] (as 7 últimas posições), com leitura antes disso.
 */
export const STATION_CARD_FIXTURES: Record<string, StationCardData> = {
  normal: base,
  divergent: { ...base, state: 'DIVERGENT', liveMmH: 2.0, note: { kind: 'DIVERGENT', hourEndUtc: new Date(HOUR_END).toISOString(), liveMm: 2.0, pedMm: 3.2, diffMm: 1.2 } },
  peak: { ...base, state: 'PEAK_REMOVED', blocks: blocksOf((i) => (i === 6 ? 2 : 0.4), 'CEMADEN_PED', 6), note: { kind: 'PEAK_REMOVED', hourEndUtc: new Date(HOUR_END - 6_000_000).toISOString() } },
  unchecked: { ...base, state: 'UNCHECKED', monthCheck: { monthStartUtc: '2026-11-01T00:00:00Z', status: 'UNCHECKED', reasons: ['FEW_WET_NEIGHBORS'] } },
  gap: { ...base, state: 'GAP_NOW', nowMmH: null, nowSource: null, liveMmH: null, pedMmH: null, blocks: blocksOf((i) => (i >= 11 ? null : 0.4)), acc1hMm: null, acc3hMm: null, quarantineToday: { GAP: 2, AFTER_GAP: 0, SUSPECT_QUALIFIER: 0 } },
  noResponse: { ...base, state: 'NO_RESPONSE', nowMmH: null, nowSource: null, liveMmH: null, pedMmH: null, blocks: blocksOf(() => null), acc1hMm: null, acc3hMm: null, lastReadingUtc: new Date(HOUR_END - 4 * 3_600_000).toISOString(),
    uses: [{ slug: 'AV_RECIFE_IBURA', name: 'Av. Recife - Entrada do Ibura', distanceM: 688, role: 'NO_VALUE', usedStationName: null }] },
  failMonth: { ...base, state: 'FAIL_MONTH', monthCheck: { monthStartUtc: '2026-11-01T00:00:00Z', status: 'FAIL', reasons: ['UNDERCATCH'] }, uses: [{ slug: 'AV_RECIFE_IBURA', name: 'Av. Recife - Entrada do Ibura', distanceM: 688, role: 'EXCLUDED', usedStationName: null }] },
  pedOnly: { ...base, canonicalId: 'SINT-P', name: 'Sintético: Cavaleiro', aliases: ['CEMADEN_PED:SINT-P'], aliasDistanceM: null, sources: ['CEMADEN_PED'], pedOnly: true, liveMmH: null },
};

/** `?cardFx=<estado>` (normal, divergent, peak, unchecked, gap, noResponse, failMonth, pedOnly) escolhe o estado do card no navegador com MSW. */
export const stationCardFor = (id: string, fx?: string | null): StationCardData => ({ ...((fx && STATION_CARD_FIXTURES[fx]) || base), canonicalId: id, name: `Sintético: ${id}` });

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const pointBase = {
  id: 1, slug: 'AGAMENON_DERBY', name: 'Av. Agamenon - Derby', municipality: 'Recife', description: 'Canal e maré', latitude: -8.05, longitude: -34.9, altitudeM: 3, distanceToChannelM: 100,
  basinName: null, sensorConfig: null, active: true, tideHeight: 1.4, tideUnit: 'DHN (NR)', liveData: { historicalAggregates: { rain3h: 12.4 } },
} as unknown as FloodPointResponseDTO;

/** Pontos do card (dados sintéticos). O nível vem do alerta por regressão (mocks/alagamento). */
export const POINT_CARD_FIXTURES: Record<'high' | 'medium', FloodPointResponseDTO> = {
  high: { ...pointBase } as FloodPointResponseDTO,
  medium: { ...pointBase, id: 2, slug: 'AGAMENON_DERBY_2', name: 'Av. Agamenon - Derby 2' } as FloodPointResponseDTO,
};

export const pointRain = (over: Partial<RainCandidates> = {}): RainCandidates => ({
  slug: 'AGAMENON_DERBY', hourEndUtc: ago(10), radiusM: 5000, ruleVersion: 'chuva-ponto-v4', valueMm: 3.2, usedStationId: 'SINT-A',
  candidates: [
    { stationId: 'SINT-A', name: 'Sintético: Areias', distanceM: 690, valueMm: 3.2, monthStatus: 'OK', reasons: [], role: 'USED' },
    { stationId: 'SINT-B', name: 'Sintético: Ibura', distanceM: 1900, valueMm: 1.1, monthStatus: 'UNCHECKED', reasons: [], role: 'LOWER' },
    { stationId: 'SINT-C', name: 'Sintético: Boa Viagem', distanceM: 3400, valueMm: null, monthStatus: 'FAIL', reasons: ['STUCK_ZERO'], role: 'EXCLUDED' },
  ],
  attribution: ATTRIBUTION, ...over,
});

const cand = (stationId: string, name: string, distanceM: number, valueMmH: number | null, role: 'USED' | 'LOWER' | 'EXCLUDED' | 'NO_VALUE', monthStatus: 'OK' | 'FAIL' | 'UNCHECKED' = 'OK', reasons: string[] = []) =>
  ({ stationId, name, distanceM, valueMmH, monthStatus, reasons, role, lat: -8.12, lon: -34.95 });

const locBase: LocationAnalysis = {
  lat: -8.1039, lon: -34.9509, at: ago(10), inArea: true, isSea: false,
  rain: { mode: 'MEASURED', nowMmH: 3.2, acc3hMm: 5.0, acc24hMm: null, station: { stationId: 'SINT-A', name: 'Sintético: Ibura', distanceM: 2400 },
    candidates: [cand('SINT-A', 'Sintético: Ibura', 2400, 3.2, 'USED'), cand('SINT-B', 'Sintético: Areias', 3100, 1.1, 'LOWER', 'UNCHECKED'), cand('SINT-C', 'Sintético: Boa Viagem', 4200, null, 'EXCLUDED', 'FAIL', ['STUCK_ZERO'])], nValid: 2 },
  nearestPoint: { slug: 'AV_RECIFE_IBURA', name: 'Av. Recife - Entrada do Ibura', distanceKm: 1.8 },
  tide: { levelM: 1.81, rising: true, harbor: 'Porto do Recife', verticalReference: 'NR DHN' },
  river: { stationId: '260790119H', name: 'Duas Unas', levelM: 1.2, distanceKm: 2.4, outsideModel: true },
  terrain: { elevationM: 4.2, distanceToCoastKm: 3.1 },
  weather: { temperatureC: 27.1, humidityPct: 76, windKmh: 14, source: 'OPEN_METEO' },
  attribution: ATTRIBUTION,
};

/** Os 5 estados do card de local. */
export const LOCATION_FIXTURES: Record<'measured' | 'gap' | 'estimated' | 'sea' | 'outside', LocationAnalysis> = {
  measured: locBase,
  gap: { ...locBase, rain: { ...locBase.rain, mode: 'GAP', nowMmH: null, acc3hMm: null, acc24hMm: null, station: null, candidates: [cand('SINT-A', 'Sintético: Ibura', 2400, null, 'NO_VALUE'), cand('SINT-B', 'Sintético: Areias', 3100, null, 'NO_VALUE')] },
    nearestPoint: { slug: 'AV_RECIFE_IBURA', name: 'Av. Recife - Entrada do Ibura', distanceKm: 1.8 } },
  estimated: { ...locBase, rain: { mode: 'ESTIMATED', nowMmH: 0.4, acc3hMm: 1.1, acc24hMm: 6.0, station: null, candidates: [], nValid: 0 }, river: null },
  sea: { ...locBase, lat: -8.06, lon: -34.84, isSea: true, rain: { mode: 'ESTIMATED', nowMmH: null, acc3hMm: null, acc24hMm: null, station: null, candidates: [], nValid: 0 }, terrain: null, river: null },
  outside: { ...locBase, lat: -7.85, lon: -34.9, inArea: false, rain: { mode: 'ESTIMATED', nowMmH: 0, acc3hMm: 0.2, acc24hMm: 2, station: null, candidates: [], nValid: 0 }, terrain: null, river: null, nearestPoint: null },
};

/** `?locFx=<estado>` (measured, gap, estimated, sea, outside) escolhe o estado do card de local no navegador com MSW. */
export const locationFixture = (fx?: string | null): LocationAnalysis => (fx && (LOCATION_FIXTURES as Record<string, LocationAnalysis>)[fx]) || LOCATION_FIXTURES.measured;
