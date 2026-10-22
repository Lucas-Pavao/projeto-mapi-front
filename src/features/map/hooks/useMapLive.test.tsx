import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { handlers, liveStreamHandler } from '@/mocks/handlers';
import { useMapLive } from './useMapLive';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const prediction = { slug: 'sintetico-1', riskLevel: 'HIGH', probability: 0.8, issuedAt: '2026-10-21T17:00:00Z', modelValidationStatus: 'NOT_VALIDATED' };
const alert = { id: 9, kind: 'RISK_LEVEL', severity: 'CRITICAL', title: 'Sintético: alto', floodPointSlug: 'sintetico-1', triggeredAt: '2026-10-21T17:00:00Z' };

describe('useMapLive', () => {
  it('prediction vai para applyPrediction e risk-summary vira a contagem', async () => {
    server.use(liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extra: [{ event: 'prediction', data: prediction }, { event: 'risk-summary', data: { LOW: 9, MEDIUM: 8, HIGH: 7, UNKNOWN: 6, computedAt: '2999-01-01T00:00:00Z' } }] }), ...handlers);
    const applyPrediction = vi.fn();
    const { result } = renderHook(() => useMapLive({ applyPrediction, canSeeAlerts: false }), { wrapper: wrapper() });
    await waitFor(() => expect(applyPrediction).toHaveBeenCalledWith(expect.objectContaining({ slug: 'sintetico-1', riskLevel: 'HIGH' })));
    await waitFor(() => expect(result.current.riskSummary?.LOW).toBe(9));
  });

  it('USER não consulta alertas: nenhum marcador pulsa', async () => {
    let called = 0;
    server.use(...handlers, http.get('/api/alerts', () => { called++; return HttpResponse.json({ page: 0, size: 20, totalElements: 0, content: [] }); }));
    const { result } = renderHook(() => useMapLive({ applyPrediction: vi.fn(), canSeeAlerts: false }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.riskSummary).toBeDefined());
    expect(called).toBe(0);
    expect(result.current.alertSlugs.size).toBe(0);
  });

  it('OPERADOR: alertas abertos + alerta ao vivo definem os pontos que pulsam', async () => {
    server.use(liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extraDelayMs: 300, extra: [{ event: 'alert', data: { ...alert, floodPointSlug: 'ao-vivo' } }] }), ...handlers);
    const { result } = renderHook(() => useMapLive({ applyPrediction: vi.fn(), canSeeAlerts: true }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.alertSlugs.has('sintetico-1')).toBe(true)); // dos alertas abertos (fixture)
    await waitFor(() => expect(result.current.alertSlugs.has('ao-vivo')).toBe(true));
  });
});
