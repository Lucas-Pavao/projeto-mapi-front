import { useQuery } from '@tanstack/react-query';
import { alertsService, type AlertStatusFilter } from '../services/alerts.service';

export const ALERTS_KEY = ['alerts'] as const;

interface Options {
  page?: number;
  size?: number;
  /** Só OPERADOR e ADMIN leem alertas (ADR 0010): para os demais a consulta nem é feita. */
  enabled?: boolean;
}

export const useAlerts = (status: AlertStatusFilter = 'OPEN', { page = 0, size = 20, enabled = true }: Options = {}) =>
  useQuery({ queryKey: [...ALERTS_KEY, status, page, size], queryFn: () => alertsService.list(status, page, size), enabled });
