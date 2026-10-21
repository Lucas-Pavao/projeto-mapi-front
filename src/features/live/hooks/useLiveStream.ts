import { useEffect, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { parseLiveEvent, type LiveEvent } from '../schemas/live-event.schema';

export type LiveStatus = 'connecting' | 'open' | 'error' | 'closed';

interface Options {
  enabled?: boolean;
  onEvent?: (event: LiveEvent) => void;
}

class FatalStreamError extends Error {}

const BACKOFF_START_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

/**
 * Conecta ao /api/stream (SSE, ADR 0012) com cookie de sessão. Reconecta sozinho (a biblioteca
 * reenvia Last-Event-ID) com espera crescente (1 s até 30 s); 401/403/429 encerram sem insistir.
 * Usado pelo Mapa (risk-summary, prediction) e por Alertas (alert).
 */
export function useLiveStream({ enabled = true, onEvent }: Options = {}) {
  const [status, setStatus] = useState<LiveStatus>('closed');
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    let retryMs = BACKOFF_START_MS;
    queueMicrotask(() => {
      if (!ctrl.signal.aborted) setStatus('connecting');
    });
    fetchEventSource('/api/stream', {
      signal: ctrl.signal,
      credentials: 'include',
      fetch: (...args) => globalThis.fetch(...args),
      async onopen(res) {
        if (res.ok && res.headers.get('content-type')?.startsWith('text/event-stream')) {
          setStatus('open');
          retryMs = BACKOFF_START_MS;
          return;
        }
        if ([401, 403, 429].includes(res.status)) throw new FatalStreamError(`stream ${res.status}`);
        throw new Error(`stream ${res.status}`);
      },
      onmessage(msg) {
        const ev = parseLiveEvent(msg);
        if (!ev) return;
        if (ev.type === 'heartbeat') setLastHeartbeatAt(ev.at ?? new Date().toISOString());
        handler.current?.(ev);
      },
      onclose() {
        setStatus('connecting');
      },
      onerror(err) {
        setStatus('error');
        if (err instanceof FatalStreamError) throw err;
        // Devolver um número troca o intervalo de nova tentativa da biblioteca.
        const wait = retryMs;
        retryMs = Math.min(retryMs * 2, BACKOFF_MAX_MS);
        return wait;
      },
    }).catch(() => {
      if (!ctrl.signal.aborted) setStatus('error');
    });
    return () => {
      ctrl.abort();
      setStatus('closed');
    };
  }, [enabled]);

  return { status, lastHeartbeatAt };
}
