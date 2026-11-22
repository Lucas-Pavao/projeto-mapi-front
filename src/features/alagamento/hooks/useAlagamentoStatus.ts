import { useQuery } from '@tanstack/react-query';
import { alagamentoService } from '../services/alagamento.service';

/** Versões da IA e último ciclo do alerta por regressão (tela Dados, só ADMIN). */
export const useAlagamentoStatus = () =>
  useQuery({ queryKey: ['alagamento', 'status'], queryFn: () => alagamentoService.status(), refetchInterval: 60_000, staleTime: 30_000 });
