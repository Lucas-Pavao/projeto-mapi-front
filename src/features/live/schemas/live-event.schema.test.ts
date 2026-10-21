import { describe, it, expect } from 'vitest';
import { parseLiveEvent } from './live-event.schema';

const pred = { slug: 'p1', riskLevel: 'HIGH', probability: 0.8, issuedAt: '2026-10-21T17:00:00Z', modelValidationStatus: 'NOT_VALIDATED' };

describe('parseLiveEvent: eventos do mapa e dos alertas', () => {
  it('prediction válida', () => {
    const ev = parseLiveEvent({ event: 'prediction', data: JSON.stringify(pred) });
    expect(ev).toMatchObject({ type: 'prediction', data: { slug: 'p1', riskLevel: 'HIGH' } });
  });

  it('prediction UNKNOWN com degradationReason, sem probabilidade', () => {
    const ev = parseLiveEvent({ event: 'prediction', data: JSON.stringify({ ...pred, riskLevel: 'UNKNOWN', probability: null, degradationReason: 'AI_TIMEOUT', lastValidIssuedAt: '2026-10-21T16:00:00Z' }) });
    expect(ev).toMatchObject({ type: 'prediction', data: { riskLevel: 'UNKNOWN', probability: null, degradationReason: 'AI_TIMEOUT' } });
  });

  it('prediction sem slug é descartada', () => {
    expect(parseLiveEvent({ event: 'prediction', data: JSON.stringify({ riskLevel: 'LOW' }) })).toBeNull();
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
