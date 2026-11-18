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

describe('useMapLive', () => {
  it('prediction vai para applyPrediction e risk-summary vira a contagem', async () => {
    server.use(liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extra: [{ event: 'prediction', data: prediction }, { event: 'risk-summary', data: { LOW: 9, MEDIUM: 8, HIGH: 7, UNKNOWN: 6, computedAt: '2999-01-01T00:00:00Z' } }] }), ...handlers);
    const applyPrediction = vi.fn();
    const { result } = renderHook(() => useMapLive({ applyPrediction, isAdmin: false }), { wrapper: wrapper() });
    await waitFor(() => expect(applyPrediction).toHaveBeenCalledWith(expect.objectContaining({ slug: 'sintetico-1', riskLevel: 'HIGH' })));
    await waitFor(() => expect(result.current.riskSummary?.LOW).toBe(9));
  });

  it('não-ADMIN não consulta o alerta por ponto: nenhum anel', async () => {
    let called = 0;
    server.use(...handlers, http.get('/api/alerta/pontos', () => { called++; return HttpResponse.json([]); }));
    const { result } = renderHook(() => useMapLive({ applyPrediction: vi.fn(), isAdmin: false }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.riskSummary).toBeDefined());
    expect(called).toBe(0);
    expect(result.current.alertaBySlug.size).toBe(0);
  });

  it('ADMIN: GET /api/alerta/pontos e alert-state ao vivo definem o estado por ponto', async () => {
    server.use(
      liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extraDelayMs: 300, extra: [{ event: 'alert-state', data: { slug: 'a', rainAlert: 'ALERTA', pointFlood: 'NAO', shadow: true } }] }),
      http.get('/api/alerta/pontos', () => HttpResponse.json([{ slug: 'a', rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true }, { slug: 'b', rainAlert: 'ATENCAO', pointFlood: 'NAO', shadow: true }])),
      ...handlers,
    );
    const { result } = renderHook(() => useMapLive({ applyPrediction: vi.fn(), isAdmin: true }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.alertaBySlug.get('b')?.rainAlert).toBe('ATENCAO'));
    await waitFor(() => expect(result.current.alertaBySlug.get('a')?.rainAlert).toBe('ALERTA'));
  });
});
