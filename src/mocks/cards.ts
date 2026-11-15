import type { StationCardData } from '@/features/map/cards/schemas/stationCard.schema';

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
