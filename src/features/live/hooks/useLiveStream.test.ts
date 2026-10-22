import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '@/mocks/server';
import { liveStreamHandler } from '@/mocks/handlers';
import { parseLiveEvent, type LiveEvent } from '../schemas/live-event.schema';
import { useLiveStream } from './useLiveStream';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('parseLiveEvent', () => {
  it('risk-summary válido e heartbeat', () => {
    const rs = { LOW: 1, MEDIUM: 0, HIGH: 0, UNKNOWN: 2, computedAt: '2026-10-21T17:00:00Z' };
    expect(parseLiveEvent({ event: 'risk-summary', data: JSON.stringify(rs) })).toEqual({ type: 'risk-summary', data: rs });
    expect(parseLiveEvent({ event: 'heartbeat', data: '' })).toEqual({ type: 'heartbeat', at: null });
  });
  it('payload inválido, JSON quebrado e evento desconhecido viram null', () => {
    expect(parseLiveEvent({ event: 'risk-summary', data: '{"LOW":"x"}' })).toBeNull();
    expect(parseLiveEvent({ event: 'risk-summary', data: '{' })).toBeNull();
    expect(parseLiveEvent({ event: 'outro', data: '{}' })).toBeNull();
  });
});

describe('useLiveStream (MSW)', () => {
  it('abre, recebe risk-summary e heartbeat', async () => {
    server.use(liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1 }));
    const events: LiveEvent[] = [];
    const { result } = renderHook(() => useLiveStream({ onEvent: (e) => events.push(e) }));
    await waitFor(() => expect(result.current.lastHeartbeatAt).not.toBeNull());
    expect(events.map((e) => e.type)).toEqual(['risk-summary', 'heartbeat']);
  });
  it('enabled=false não conecta', () => {
    const { result } = renderHook(() => useLiveStream({ enabled: false }));
    expect(result.current.status).toBe('closed');
  });
});
