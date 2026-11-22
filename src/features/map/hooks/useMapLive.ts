import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLiveStream } from '@/features/live/hooks/useLiveStream';
import type { LiveEvent } from '@/features/live/schemas/live-event.schema';
import { applyLiveAlert } from '@/features/alerts/utils/liveAlerts';
import { ALAGAMENTO_PONTOS_KEY, useAlagamentoPontos } from '@/features/alagamento/hooks/useAlagamentoPontos';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';

interface Options {
  /** Só o ADMIN lê o alerta por regressão enquanto ele está em modo sombra. */
  isAdmin: boolean;
}

/**
 * Ao vivo no mapa (ADR 0012): `flood-forecast` mantém o alerta de alagamento por regressão de cada ponto
 * (GET /api/alagamento/pontos), que dá o anel do marcador, a lista e a contagem (só ADMIN). Sem o stream, segue por
 * consulta periódica. Os eventos do classificador (`prediction`, `risk-summary`) saíram em 21/11/2026.
 */
export function useMapLive({ isAdmin }: Options) {
  const qc = useQueryClient();
  const query = useAlagamentoPontos(isAdmin);

  const onEvent = useCallback(
    (ev: LiveEvent) => {
      if (ev.type === 'alert') applyLiveAlert(qc, ev.data);
      else if (ev.type === 'flood-forecast') {
        const next = ev.data;
        qc.setQueryData<AlagamentoPonto[]>(ALAGAMENTO_PONTOS_KEY, (prev) =>
          prev ? (prev.some((a) => a.slug === next.slug) ? prev.map((a) => (a.slug === next.slug ? next : a)) : [...prev, next]) : prev);
      }
    },
    [qc],
  );
  const { status, lastHeartbeatAt } = useLiveStream({ onEvent });

  const alagamentoBySlug = useMemo(() => new Map((query.data ?? []).map((a) => [a.slug, a] as const)), [query.data]);
  return { liveStatus: status, lastHeartbeatAt, alagamentoBySlug, alagamentoFailed: query.isError, alagamentoLoading: query.isLoading };
}
