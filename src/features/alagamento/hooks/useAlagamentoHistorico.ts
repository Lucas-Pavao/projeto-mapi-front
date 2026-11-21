import { useQuery } from '@tanstack/react-query';
import { alagamentoService } from '../services/alagamento.service';

/** Histórico do alerta por regressão (relatório do evento e linha do tempo). Em modo sombra só o ADMIN consulta. */
export const useAlagamentoHistorico = (horas: number, enabled: boolean) =>
  useQuery({ queryKey: ['alagamento', 'historico', horas], queryFn: () => alagamentoService.historico(horas), enabled, staleTime: 60_000 });
