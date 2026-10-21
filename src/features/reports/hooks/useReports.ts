import { useQuery } from '@tanstack/react-query';
import type { ReportStatus } from '@/types/api';
import { reportsService } from '../services/reports.service';

export const useReports = (status: ReportStatus = 'PENDING') =>
  useQuery({ queryKey: ['reports', status], queryFn: () => reportsService.list(status) });
