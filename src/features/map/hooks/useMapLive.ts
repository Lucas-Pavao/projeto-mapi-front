import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLiveStream } from '@/features/live/hooks/useLiveStream';
import type { LiveEvent } from '@/features/live/schemas/live-event.schema';
import { RISK_SUMMARY_KEY, useRiskSummary } from '@/features/points/hooks/useRiskSummary';
import { applyLiveAlert } from '@/features/alerts/utils/liveAlerts';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';
import { ALERTA_PONTOS_KEY, useAlertaPontos } from '@/features/alerta/hooks/useAlertaPontos';
import type { AlertaPonto } from '@/features/alerta/schemas/alerta.schema';

interface Options {
  applyPrediction: (p: PredictionSummary) => void;
  /** Só o ADMIN lê o alerta por ponto enquanto ele está em modo sombra (ADR 0026). */
  isAdmin: boolean;
}

/**
 * Ao vivo no mapa (ADR 0012): `risk-summary` e `prediction` atualizam contagem e marcadores;
 * `alert-state` mantém o estado do alerta por ponto (GET /api/alerta/pontos), que dá o anel do marcador (só ADMIN).
 * Sem o stream, a contagem e os alertas seguem por consulta periódica.
 */
export function useMapLive({ applyPrediction, isAdmin }: Options) {
  const qc = useQueryClient();
  const summary = useRiskSummary();
  const alertaQuery = useAlertaPontos(isAdmin);

  const onEvent = useCallback(
    (ev: LiveEvent) => {
      if (ev.type === 'risk-summary') qc.setQueryData(RISK_SUMMARY_KEY, ev.data);
      else if (ev.type === 'prediction') applyPrediction(ev.data);
      else if (ev.type === 'alert') applyLiveAlert(qc, ev.data);
      else if (ev.type === 'alert-state') {
        const next = ev.data;
        qc.setQueryData<AlertaPonto[]>(ALERTA_PONTOS_KEY, (prev) =>
          prev ? (prev.some((a) => a.slug === next.slug) ? prev.map((a) => (a.slug === next.slug ? next : a)) : [...prev, next]) : prev);
      }
    },
    [qc, applyPrediction],
  );
  const { status, lastHeartbeatAt } = useLiveStream({ onEvent });

  const alertaBySlug = useMemo(() => new Map((alertaQuery.data ?? []).map((a) => [a.slug, a] as const)), [alertaQuery.data]);
  return { riskSummary: summary.data, riskSummaryFailed: summary.isError, liveStatus: status, lastHeartbeatAt, alertaBySlug };
}
