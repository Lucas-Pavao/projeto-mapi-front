import { useQuery } from '@tanstack/react-query';
import { alagamentoService } from '../services/alagamento.service';

export const ALAGAMENTO_PONTOS_KEY = ['alagamento', 'pontos'] as const;

/**
 * Alerta por regressão de cada ponto. O SSE (`flood-forecast`) atualiza o cache; a consulta a cada 60 s cobre o stream
 * fora. Em modo sombra só o ADMIN consulta.
 */
export const useAlagamentoPontos = (enabled: boolean) =>
  useQuery({
    queryKey: ALAGAMENTO_PONTOS_KEY,
    queryFn: () => alagamentoService.pontos(),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
