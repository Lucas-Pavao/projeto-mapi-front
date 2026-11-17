import { useQuery } from '@tanstack/react-query';
import { alertaService } from '../services/alerta.service';

export const ALERTA_PONTOS_KEY = ['alerta', 'pontos'] as const;

/**
 * Estado do alerta por ponto. O SSE (`alert-state`) atualiza o cache (useMapLive); a consulta a cada 60 s cobre o
 * stream fora. Em modo sombra só o ADMIN consulta: os demais nem pedem.
 */
export const useAlertaPontos = (enabled: boolean) =>
  useQuery({
    queryKey: ALERTA_PONTOS_KEY,
    queryFn: () => alertaService.pontos(),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
