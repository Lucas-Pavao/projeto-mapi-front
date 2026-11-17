import { useQuery } from '@tanstack/react-query';
import { alertaOperacaoService } from '../services/alerta.service';

export const useAlertaLatencia = (dias = 7) =>
  useQuery({ queryKey: ['alerta', 'latencia', dias], queryFn: () => alertaOperacaoService.latencia(dias), staleTime: 60_000 });

export const useAlertaRelatorios = () =>
  useQuery({ queryKey: ['alerta', 'latencia', 'relatorios'], queryFn: () => alertaOperacaoService.relatorios(), staleTime: 10 * 60_000 });

export const useAlertaConferencia = (dias = 30) =>
  useQuery({ queryKey: ['alerta', 'conferencia', dias], queryFn: () => alertaOperacaoService.conferencia(dias), staleTime: 10 * 60_000 });
