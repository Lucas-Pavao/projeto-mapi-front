import { useQuery } from '@tanstack/react-query';
import { alertsService, type AlertStatusFilter } from '../services/alerts.service';

export const useAlerts = (status: AlertStatusFilter = 'OPEN') =>
  useQuery({ queryKey: ['alerts', status], queryFn: () => alertsService.list(status) });
