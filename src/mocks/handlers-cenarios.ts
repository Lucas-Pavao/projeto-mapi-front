import { http, HttpResponse } from 'msw';
import type { RainCandidates } from '@/features/points/schemas/rain-candidates.schema';
import type { CanonicalStation, StationHour } from '@/features/sensors/schemas/station.schema';

/** DADOS SINTÉTICOS dos endpoints B1–B4 do contrato novos-cenarios (ainda sem backend). Só desenham e testam telas. */
export const ATTRIBUTION = 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC';

export const rainCandidates = (slug: string): RainCandidates => ({
  slug, hourEndUtc: new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString(), radiusM: 5000, ruleVersion: 'chuva-ponto-v4', valueMm: 3.2, usedStationId: 'SINT-A',
  candidates: [
    { stationId: 'SINT-A', name: 'Sintético: Ibura', distanceM: 690, valueMm: 3.2, monthStatus: 'OK', reasons: [], role: 'USED' },
    { stationId: 'SINT-B', name: 'Sintético: Areias', distanceM: 1900, valueMm: 1.1, monthStatus: 'UNCHECKED', reasons: [], role: 'LOWER' },
    { stationId: 'SINT-C', name: 'Sintético: Boa Viagem', distanceM: 3400, valueMm: 12.4, monthStatus: 'FAIL', reasons: ['STUCK_ZERO', 'UNDERCATCH'], role: 'EXCLUDED' },
    { stationId: 'SINT-D', name: 'Sintético: Torrões', distanceM: 4700, valueMm: null, monthStatus: 'OK', reasons: [], role: 'NO_VALUE' },
  ],
  attribution: ATTRIBUTION,
});

export const canonicalStations: CanonicalStation[] = [
  { canonicalId: 'SINT-A', name: 'Sintético: Areias', municipality: 'RECIFE', lat: -8.1, lon: -34.9, primarySource: 'CEMADEN_PED', aliases: ['CEMADEN:SINT-A', 'CEMADEN_PED:SINT-A'], sources: ['CEMADEN', 'CEMADEN_PED'],
    monthCheck: { monthStartUtc: '2026-11-01T00:00:00Z', status: 'OK', reasons: [], ruleVersion: 'chuva-ponto-v4' }, quarantine: { GAP: 0, AFTER_GAP: 3, SUSPECT_QUALIFIER: 1 }, divergenceCount: 2, attribution: ATTRIBUTION },
  { canonicalId: 'SINT-C', name: 'Sintético: Boa Viagem', municipality: 'RECIFE', lat: -8.12, lon: -34.91, primarySource: 'CEMADEN_PED', aliases: ['CEMADEN_PED:SINT-C'], sources: ['CEMADEN_PED'],
    monthCheck: { monthStartUtc: '2026-11-01T00:00:00Z', status: 'FAIL', reasons: ['STUCK_ZERO'], ruleVersion: 'chuva-ponto-v4' }, quarantine: { GAP: 0, AFTER_GAP: 0, SUSPECT_QUALIFIER: 0 }, divergenceCount: 0, attribution: ATTRIBUTION },
];

/** 24 h sintéticas: PED nas antigas, ao vivo nas duas últimas, uma lacuna, um pico isolado removido e duas divergências. */
export const hourlyHours = (): StationHour[] => {
  const end = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  return Array.from({ length: 24 }, (_, i): StationHour => {
    const t = new Date(end - (23 - i) * 3_600_000).toISOString();
    if (i === 5) return { hourEndUtc: t, valueMm: null, usedSource: null, pedMm: null, liveMm: null, divergent: false, isolatedPeakRemoved: false };
    if (i === 9) return { hourEndUtc: t, valueMm: null, usedSource: 'CEMADEN_PED', pedMm: 31, liveMm: 30, divergent: false, isolatedPeakRemoved: true };
    if (i >= 22) return { hourEndUtc: t, valueMm: 2 + i - 22, usedSource: 'CEMADEN', pedMm: null, liveMm: 2 + i - 22, divergent: false, isolatedPeakRemoved: false };
    const div = i === 12 || i === 13;
    return { hourEndUtc: t, valueMm: i % 4, usedSource: 'CEMADEN_PED', pedMm: i % 4, liveMm: div ? (i % 4) + 1.4 : i % 4, divergent: div, isolatedPeakRemoved: false };
  });
};

export const monthChecksMock = () => {
  const months = ['2026-09-01T00:00:00Z', '2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z'];
  return {
    ruleVersion: 'chuva-ponto-v4', months,
    stations: [
      { stationId: 'SINT-A', name: 'Sintético: Areias', cells: months.map((monthStartUtc) => ({ monthStartUtc, status: 'OK', reasons: [] })) },
      { stationId: 'SINT-C', name: 'Sintético: Boa Viagem', cells: [{ monthStartUtc: months[1], status: 'UNCHECKED', reasons: ['FEW_WET_NEIGHBORS'] }, { monthStartUtc: months[2], status: 'FAIL', reasons: ['STUCK_ZERO'] }] },
    ],
  };
};

const ev = (id: string, slug: string, maxHourlyMmH: number, over = true) => ({
  floodPointSlug: slug, eventId: id, source: 'X', startUtc: '2026-05-10T14:00:00Z', endUtc: '2026-05-10T18:00:00Z', durationMin: 240, totalMm: 52.4, maxHourlyMmH,
  type: 'FORTE', hasGap: false, truncated: false, stationId: 'SINT-A', stationDistanceM: 800, rainOrigin: 'MEASURED', excessOverCapacityMm: over ? 8 : 0, hoursAboveCapacity: over ? 1 : 0,
});

/** Eventos sintéticos por fonte: a reanálise suaviza os picos, então passa menos da capacidade. */
export const rainEventsFor = (source: string) => ({
  manifest: { datasetId: 'sint', source, params: { capacityMmH: 60.1 }, rows: 3 },
  events: source === 'OPEN_METEO_ARCHIVE'
    ? [ev('e1', 'sintetico-1', 34)]
    : [ev('e1', 'sintetico-1', 71.2), ev('e2', 'sintetico-1', 64.5), ev('e3', 'sintetico-1', 40), { ...ev('e4', 'sintetico-1', 99), truncated: true }],
});

const summaryFor = (source: string) => ({
  manifest: { datasetId: 'sint', source, params: { capacityMmH: 60.1 }, rows: 3 },
  rows: [
    { floodPointSlug: 'sintetico-1', type: 'FORTE', count: 3, countWithoutGap: 2, eventsAboveCapacity: 2, coverageFraction: 0.9 },
    { floodPointSlug: 'sintetico-1', type: 'MEDIA', count: 5, countWithoutGap: 5, eventsAboveCapacity: 0, coverageFraction: 0.9 },
    { floodPointSlug: 'sintetico-1', type: 'FRACA', count: 12, countWithoutGap: 11, eventsAboveCapacity: 0, coverageFraction: 0.9 },
    { floodPointSlug: 'sintetico-1', type: 'TOTAL', count: 20, countWithoutGap: 18, eventsAboveCapacity: 2, coverageFraction: 0.9 },
  ],
});

export const cenariosHandlers = [
  http.get('/api/analise/eventos-chuva/resumo', ({ request }) => HttpResponse.json(summaryFor(new URL(request.url).searchParams.get('source') ?? 'ANA'))),
  http.get('/api/analise/eventos-chuva', ({ request }) => HttpResponse.json(rainEventsFor(new URL(request.url).searchParams.get('source') ?? 'ANA'))),
  http.get('/api/admin/stations/month-checks', () => HttpResponse.json(monthChecksMock())),
  http.get('/api/stations/canonical', () => HttpResponse.json(canonicalStations)),
  http.get('/api/stations/rain-accumulations', () => HttpResponse.json({
    computedAtUtc: null, fetchedAtUtc: new Date().toISOString(), stale: false, timezone: 'UTC', unit: 'mm', rainOrigin: 'MEASURED', source: 'sintético', attribution: ATTRIBUTION,
    municipalitiesQueried: [], municipalitiesWithoutData: [], municipalitiesFailed: [],
    stations: [{ canonicalId: 'SINT-A', stationCode: 'SINT-A', name: 'Sintético: Areias', municipality: 'RECIFE', lat: -8.1, lon: -34.9, aliases: [], status: 'OK', lastReadingUtc: null, acc1hMm: 3, acc3hMm: 5, acc6hMm: null, acc12hMm: null, acc24hMm: null, acc48hMm: null, acc72hMm: null, acc96hMm: null, acc120hMm: null },
      { canonicalId: 'SINT-C', stationCode: 'SINT-C', name: 'Sintético: Boa Viagem', municipality: 'RECIFE', lat: -8.12, lon: -34.91, aliases: [], status: 'OK', lastReadingUtc: null, acc1hMm: 0, acc3hMm: 0, acc6hMm: null, acc12hMm: null, acc24hMm: null, acc48hMm: null, acc72hMm: null, acc96hMm: null, acc120hMm: null }],
  })),
  http.get<{ id: string }>('/api/stations/:id/hourly', ({ params, request }) => {
    const u = new URL(request.url);
    return HttpResponse.json({ canonicalId: params.id, from: u.searchParams.get('from') ?? '', to: u.searchParams.get('to') ?? '', toleranceMm: 0.5, hours: hourlyHours(), attribution: ATTRIBUTION });
  }),
  http.get<{ slug: string }>('/api/pontos/:slug/rain-candidates', ({ params }) => HttpResponse.json(rainCandidates(params.slug))),
];
