import { useEffect, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { parseLiveEvent, type LiveEvent } from '../schemas/live-event.schema';

export type LiveStatus = 'connecting' | 'open' | 'error' | 'closed';

interface Options {
  enabled?: boolean;
  onEvent?: (event: LiveEvent) => void;
}

class FatalStreamError extends Error {}

/**
 * Conecta ao /api/stream (SSE, ADR 0012) com cookie de sessão. Reconecta sozinho (a biblioteca
 * reenvia Last-Event-ID); 401/403/429 encerram sem insistir. Ainda não é usado pelas telas (F3).
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
    setStatus('connecting');
    fetchEventSource('/api/stream', {
      signal: ctrl.signal,
      credentials: 'include',
      fetch: (...args) => globalThis.fetch(...args),
      async onopen(res) {
        if (res.ok && res.headers.get('content-type')?.startsWith('text/event-stream')) {
          setStatus('open');
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
