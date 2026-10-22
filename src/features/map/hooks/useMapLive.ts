import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLiveStream } from '@/features/live/hooks/useLiveStream';
import type { LiveEvent } from '@/features/live/schemas/live-event.schema';
import { RISK_SUMMARY_KEY, useRiskSummary } from '@/features/points/hooks/useRiskSummary';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { applyLiveAlert } from '@/features/alerts/utils/liveAlerts';
import { activeAlertSlugs } from '@/features/alerts/utils/activeAlerts';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';

interface Options {
  applyPrediction: (p: PredictionSummary) => void;
  /** OPERADOR ou ADMIN: só eles recebem e listam alertas (ADR 0010). */
  canSeeAlerts: boolean;
}

/**
 * Ao vivo no mapa (ADR 0012): `risk-summary` e `prediction` atualizam contagem e marcadores;
 * `alert` mantém o conjunto de pontos com alerta ativo, que é o que faz o marcador pulsar (ADR 0011).
 * Sem o stream, a contagem e os alertas seguem por consulta periódica.
 */
export function useMapLive({ applyPrediction, canSeeAlerts }: Options) {
  const qc = useQueryClient();
  const summary = useRiskSummary();
  const alerts = useAlerts('OPEN', { size: 100, enabled: canSeeAlerts });

  const onEvent = useCallback(
    (ev: LiveEvent) => {
      if (ev.type === 'risk-summary') qc.setQueryData(RISK_SUMMARY_KEY, ev.data);
      else if (ev.type === 'prediction') applyPrediction(ev.data);
      else if (ev.type === 'alert') applyLiveAlert(qc, ev.data);
    },
    [qc, applyPrediction],
  );
  const { status, lastHeartbeatAt } = useLiveStream({ onEvent });

  const alertSlugs = useMemo(() => activeAlertSlugs(alerts.data?.content), [alerts.data]);
  return { riskSummary: summary.data, riskSummaryFailed: summary.isError, liveStatus: status, lastHeartbeatAt, alertSlugs };
}
