import { describe, expect, it } from 'vitest';
import { freshnessText, groupSources, worstFreshness } from './ingestion';
import type { IngestionSource } from '../schemas/admin.schema';

const NOW = Date.parse('2026-11-16T17:00:00Z');

describe('fonte velha pela leitura aceita (V29)', () => {
  it('fonte que roda e não aceita nada aparece como parada, com o motivo', () => {
    const meteo: IngestionSource = {
      source: 'APAC_METEO24H', status: 'STALE', expectedEveryMinutes: 5, lastSuccessAt: '2026-11-16T16:58:00Z',
      freshness: { state: 'NO_DATA', lastAcceptedAt: null, ageMinutes: null, maxAgeMinutes: 60 },
    };
    const [card] = groupSources([meteo]);
    expect(card.status).toBe('STALE');
    expect(freshnessText(card.freshness, NOW)).toBe('nenhuma leitura aceita em 60 dias');
  });

  it('idade da leitura aceita e cobertura da tábua em texto', () => {
    expect(freshnessText({ state: 'FRESH', lastAcceptedAt: '2026-11-16T16:48:00Z', ageMinutes: 12, maxAgeMinutes: 90 }, NOW))
      .toBe('leitura aceita há 12 min (máx. 1,5 h)');
    expect(freshnessText({ state: 'COVERAGE_LOW', coverageUntil: '2026-11-26T01:36:00Z', minCoverageAheadMinutes: 43200 }, NOW))
      .toBe('tábua cobre 9 d à frente (mín. 30 d)');
  });

  it('no grupo da maré vale a pior frescura', () => {
    const f = worstFreshness([
      { source: 'TIDE_PE02_HOURLY', status: 'OK', freshness: { state: 'FRESH' } },
      { source: 'TABUAMARE_PE02', status: 'STALE', freshness: { state: 'COVERAGE_LOW', coverageUntil: '2026-11-26T01:36:00Z', minCoverageAheadMinutes: 43200 } },
      { source: 'DHN_TABUA_PE02', status: 'OK', freshness: { state: 'UNMONITORED' } },
    ]);
    expect(f?.state).toBe('COVERAGE_LOW');
  });
});
