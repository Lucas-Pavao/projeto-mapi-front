import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { RAIN_SOURCES, type RainSource } from '../schemas/rain-events.schema';
import { rainEventsService } from '../services/rain-events.service';

const DAY = 86_400_000;

/** Janela de 365 dias terminando na última hora cheia, fixada na montagem (chave de cache estável). */
export function useRainWindow() {
  const [w] = useState(() => {
    const to = Math.floor(Date.now() / 3_600_000) * 3_600_000;
    return { from: new Date(to - 365 * DAY).toISOString(), to: new Date(to).toISOString() };
  });
  return w;
}

export const useRainSummary = (slug: string, source: RainSource, w: { from: string; to: string }) =>
  useQuery({ queryKey: ['rain-events', 'summary', slug, source, w], queryFn: () => rainEventsService.summary({ slug, source, ...w }), staleTime: 300_000 });

/** Eventos das três fontes, para a sensibilidade à capacidade comparar o mesmo limite nas três. */
export const useRainEventsBySource = (slug: string, w: { from: string; to: string }) =>
  useQueries({
    queries: RAIN_SOURCES.map((source) => ({
      queryKey: ['rain-events', 'events', slug, source, w],
      queryFn: () => rainEventsService.events({ slug, source, ...w }),
      staleTime: 300_000,
    })),
  });
