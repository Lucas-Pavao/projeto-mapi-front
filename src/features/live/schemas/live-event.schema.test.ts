import { describe, it, expect } from 'vitest';
import { parseLiveEvent } from './live-event.schema';

import { ALAGAMENTO_FIXTURES } from '@/mocks/alagamento';

describe('parseLiveEvent: eventos do mapa e dos alertas', () => {
  it('flood-forecast válido (alerta por regressão); eventos do classificador retirado viram null', () => {
    const ev = parseLiveEvent({ event: 'flood-forecast', data: JSON.stringify({ ...ALAGAMENTO_FIXTURES.alerta_1h, slug: 'p1' }) });
    expect(ev).toMatchObject({ type: 'flood-forecast', data: { slug: 'p1', level: 'ALERTA' } });
    expect(parseLiveEvent({ event: 'prediction', data: JSON.stringify({ slug: 'p1', riskLevel: 'HIGH' }) })).toBeNull();
    expect(parseLiveEvent({ event: 'risk-summary', data: JSON.stringify({ LOW: 1 }) })).toBeNull();
  });
  it('flood-forecast sem nível é descartado', () => {
    expect(parseLiveEvent({ event: 'flood-forecast', data: JSON.stringify({ slug: 'p1' }) })).toBeNull();
  });
  it('alert válido', () => {
    const alert = { id: 7, kind: 'RISK_LEVEL', severity: 'CRITICAL', title: 'x', triggeredAt: '2026-10-21T17:00:00Z', floodPointSlug: 'p1' };
    expect(parseLiveEvent({ event: 'alert', data: JSON.stringify(alert) })).toMatchObject({ type: 'alert', data: { id: 7 } });
  });

  it('alert com tipo fora do contrato é descartado', () => {
    const alert = { id: 7, kind: 'OUTRO', severity: 'CRITICAL', title: 'x', triggeredAt: '2026-10-21T17:00:00Z' };
    expect(parseLiveEvent({ event: 'alert', data: JSON.stringify(alert) })).toBeNull();
  });

  it('sensor válido e inválido', () => {
    const ok = { sensorId: 's', type: 'RIVER_LEVEL', value: 1.2, observedAt: '2026-10-21T17:00:00Z' };
    expect(parseLiveEvent({ event: 'sensor', data: JSON.stringify(ok) })).toMatchObject({ type: 'sensor' });
    expect(parseLiveEvent({ event: 'sensor', data: JSON.stringify({ ...ok, type: 'X' }) })).toBeNull();
  });
});
