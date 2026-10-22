import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { eventsService } from '../services/events.service';

const TEN_MIN = 600_000;
const HOUR = 3_600_000;
/** Janela máxima da API (/api/events/timeline): 72 h. */
export const MAX_WINDOW_HOURS = 72;

/**
 * Linha do tempo de `pastHours` h atrás até `futureHours` h à frente do instante de montagem (arredondado
 * a 10 min, para a chave de cache ficar estável). `futureHours` serve à maré prevista. A soma não passa de 72 h.
 */
export function useTimeline(pastHours = 24, futureHours = 0, slugs?: string[]) {
  const [anchor] = useState(() => Math.floor(Date.now() / TEN_MIN) * TEN_MIN);
  const range = useMemo(() => {
    const past = Math.min(pastHours, MAX_WINDOW_HOURS);
    const future = Math.min(futureHours, MAX_WINDOW_HOURS - past);
    return { from: new Date(anchor - past * HOUR).toISOString(), to: new Date(anchor + future * HOUR).toISOString() };
  }, [anchor, pastHours, futureHours]);
  const query = useQuery({
    queryKey: ['events', 'timeline', range, slugs ?? null],
    queryFn: () => eventsService.timeline(range.from, range.to, slugs),
    placeholderData: keepPreviousData,
  });
  return { ...query, range, now: anchor };
}
