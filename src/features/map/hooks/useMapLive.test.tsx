import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { handlers, liveStreamHandler } from '@/mocks/handlers';
import { useMapLive } from './useMapLive';
import { ALAGAMENTO_FIXTURES } from '@/mocks/alagamento';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const fx = (slug: string, level: string) => ({ ...ALAGAMENTO_FIXTURES.sem_alerta_seco, slug, level });

describe('useMapLive', () => {
  it('não-ADMIN não consulta o alerta por regressão: nenhum anel', async () => {
    let called = 0;
    server.use(...handlers, http.get('/api/alagamento/pontos', () => { called++; return HttpResponse.json([]); }));
    const { result } = renderHook(() => useMapLive({ isAdmin: false }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.liveStatus).toBeDefined());
    expect(called).toBe(0);
    expect(result.current.alagamentoBySlug.size).toBe(0);
  });

  it('ADMIN: GET /api/alagamento/pontos e flood-forecast ao vivo definem o nível por ponto', async () => {
    server.use(
      liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extraDelayMs: 300, extra: [{ event: 'flood-forecast', data: fx('a', 'ALERTA') }] }),
      http.get('/api/alagamento/pontos', () => HttpResponse.json([fx('a', 'SEM_ALERTA'), fx('b', 'ATENCAO')])),
      ...handlers,
    );
    const { result } = renderHook(() => useMapLive({ isAdmin: true }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.alagamentoBySlug.get('b')?.level).toBe('ATENCAO'));
    await waitFor(() => expect(result.current.alagamentoBySlug.get('a')?.level).toBe('ALERTA'));
  });

  it('eventos do classificador (prediction, risk-summary) são ignorados', async () => {
    server.use(liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extra: [{ event: 'risk-summary', data: { LOW: 9 } }] }), ...handlers);
    const { result } = renderHook(() => useMapLive({ isAdmin: false }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.liveStatus).toBeDefined());
    expect(result.current).not.toHaveProperty('riskSummary');
  });
});
