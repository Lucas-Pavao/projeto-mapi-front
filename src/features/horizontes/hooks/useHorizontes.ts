import { useQuery } from '@tanstack/react-query';
import { horizontesService } from '../services/horizontes.service';

/** As três camadas do ponto. A previsão do INMET muda poucas vezes por dia; o alerta, a cada ciclo. */
export const useHorizontes = (slug: string | null | undefined) =>
  useQuery({
    queryKey: ['horizontes', slug],
    queryFn: () => horizontesService.forPoint(slug as string),
    enabled: !!slug,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

/** Previsão do INMET de um município: logado (app) ou pública (Minha rua). */
export const useOfficialForecast = (municipio: string | null | undefined, publicRoute = false) =>
  useQuery({
    queryKey: ['previsao-oficial', publicRoute ? 'public' : 'app', municipio],
    queryFn: () => (publicRoute ? horizontesService.publicForecast(municipio as string) : horizontesService.forecast(municipio as string)),
    enabled: !!municipio,
    refetchInterval: 30 * 60_000,
    staleTime: 10 * 60_000,
  });

/** Avisos do INMET do município pela rota pública (Minha rua). */
export const usePublicWarnings = (municipio: string | null | undefined) =>
  useQuery({
    queryKey: ['avisos-oficiais', 'public', municipio],
    queryFn: () => horizontesService.publicWarnings(municipio as string),
    enabled: !!municipio,
    refetchInterval: 10 * 60_000,
    staleTime: 5 * 60_000,
  });
