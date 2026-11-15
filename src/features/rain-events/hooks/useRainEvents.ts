import { useQueries, useQuery } from '@tanstack/react-query';
import { RAIN_SOURCES, type RainSource } from '../schemas/rain-events.schema';
import { rainEventsService } from '../services/rain-events.service';

const RAIN_WINDOW = { from: '2021-09-01T00:00:00Z', to: '2026-10-08T00:00:00Z' } as const;

/** Período padrão: a série inteira (set/2021 → out/2026), o mesmo dos KPIs de EVENTOS-DE-CHUVA.md. Fixo: chave de cache estável. */
export function useRainWindow() {
  return RAIN_WINDOW;
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
