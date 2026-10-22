import { useMemo } from 'react';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { toTimePts } from '@/components/charts/chartMath';
import { meanRainSeries, probabilityByPoint, rainNow, tideNow } from '../utils/overview';

/** Janela do cartão "Chuva e maré hoje": 12 h até agora e 6 h à frente (a maré vem da tábua). */
const PAST_H = 12;
const FUTURE_H = 6;

/**
 * Séries reais do painel do mapa numa só consulta (/api/events/timeline): chuva média e maré do cartão,
 * e a probabilidade por ponto das minilinhas. Falha ou carga não derrubam o painel: tudo vira vazio.
 */
export function useMapOverview() {
  const q = useTimeline(PAST_H, FUTURE_H);
  const { data, range, now } = q;
  return useMemo(() => {
    const rain = data ? meanRainSeries(data.rain) : [];
    const tide = data ? toTimePts(data.tide.points) : [];
    return {
      isError: q.isError,
      from: Date.parse(range.from),
      to: Date.parse(range.to),
      now,
      rain,
      tide,
      rainNow: rainNow(rain, now),
      tideNow: tideNow(tide, now),
      probabilities: data ? probabilityByPoint(data.risk) : new Map<string, Array<number | null>>(),
    };
  }, [data, range, now, q.isError]);
}
