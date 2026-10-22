import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import api from './api';
import { sessionEvents, type SessionEvent } from './session';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const revoked = () => HttpResponse.json({ code: 'TOKEN_REVOKED' }, { status: 401 });
const record = () => {
  const seen: SessionEvent[] = [];
  const off = sessionEvents.on((e) => seen.push(e));
  return { seen, off };
};

describe('interceptor de sessão', () => {
  it('401 TOKEN_REVOKED: renova uma vez, avisa (refreshed) e repete a requisição', async () => {
    let calls = 0;
    let refreshes = 0;
    server.use(
      http.get('/api/alerts', () => (calls++ === 0 ? revoked() : HttpResponse.json({ ok: true }))),
      http.post('/api/auth/refresh', () => { refreshes++; return new HttpResponse(null, { status: 200 }); }),
    );
    const { seen, off } = record();
    const res = await api.get('/api/alerts');
    off();
    expect(res.data).toEqual({ ok: true });
    expect(refreshes).toBe(1);
    expect(seen).toEqual(['refreshed']);
  });

  it('várias requisições revogadas ao mesmo tempo compartilham um único refresh', async () => {
    const hits: Record<string, number> = {};
    let refreshes = 0;
    server.use(
      http.get('/api/:what', ({ params }) => { const k = String(params.what); return (hits[k] = (hits[k] ?? 0) + 1) === 1 ? revoked() : HttpResponse.json({ k }); }),
      http.post('/api/auth/refresh', async () => { refreshes++; await new Promise((r) => setTimeout(r, 30)); return new HttpResponse(null, { status: 200 }); }),
    );
    const r = await Promise.all([api.get('/api/a'), api.get('/api/b'), api.get('/api/c')]);
    expect(r.map((x) => x.data.k)).toEqual(['a', 'b', 'c']);
    expect(refreshes).toBe(1);
  });

  it('refresh que falha (403) emite expired e rejeita a requisição original', async () => {
    server.use(http.get('/api/alerts', revoked), http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 403 })));
    const { seen, off } = record();
    await expect(api.get('/api/alerts')).rejects.toMatchObject({ response: { status: 401 } });
    off();
    expect(seen).toEqual(['expired']);
  });

  it('só repete uma vez: se continua revogado depois do refresh, rejeita', async () => {
    let calls = 0;
    server.use(http.get('/api/x', () => { calls++; return revoked(); }), http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 200 })));
    await expect(api.get('/api/x')).rejects.toBeTruthy();
    expect(calls).toBe(2);
  });

  it('403 em /api/auth/me ou /api/auth/refresh é sessão expirada; 403 em outro endpoint não é', async () => {
    server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 403 })), http.get('/api/alerts', () => new HttpResponse(null, { status: 403 })));
    const { seen, off } = record();
    await expect(api.get('/api/auth/me')).rejects.toBeTruthy();
    expect(seen).toEqual(['expired']);
    await expect(api.get('/api/alerts')).rejects.toBeTruthy();
    off();
    expect(seen).toEqual(['expired']); // continua um só: 403 comum = sem permissão
  });

  it('401 sem o código TOKEN_REVOKED não tenta refresh', async () => {
    let refreshes = 0;
    const assign = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get('/api/y', () => HttpResponse.json({}, { status: 401 })), http.post('/api/auth/refresh', () => { refreshes++; return new HttpResponse(null, { status: 200 }); }));
    // pathname de teste (jsdom) é "/": tela "privada"; o redirect via window.location não existe em jsdom, só o aviso importa.
    await expect(api.get('/api/y')).rejects.toBeTruthy();
    expect(refreshes).toBe(0);
    assign.mockRestore();
  });
});
