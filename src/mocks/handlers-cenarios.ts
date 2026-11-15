import { http, HttpResponse } from 'msw';
import type { RainCandidates } from '@/features/points/schemas/rain-candidates.schema';

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

export const cenariosHandlers = [
  http.get<{ slug: string }>('/api/pontos/:slug/rain-candidates', ({ params }) => HttpResponse.json(rainCandidates(params.slug))),
];
