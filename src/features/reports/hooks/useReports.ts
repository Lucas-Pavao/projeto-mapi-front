import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsService, type ReportStatusFilter } from '../services/reports.service';
import type { ReportReview } from '../schemas/report.schema';

export const REPORTS_KEY = ['reports'] as const;

export const useReports = (status: ReportStatusFilter = 'PENDING', page = 0, size = 20) =>
  useQuery({ queryKey: [...REPORTS_KEY, status, page, size], queryFn: () => reportsService.list(status, page, size), placeholderData: keepPreviousData });

/** Confirmar ou descartar. Mesmo com erro (ex.: 409, já revisado) a fila é revalidada. */
export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReportReview }) => reportsService.review(id, body),
    onSettled: () => qc.invalidateQueries({ queryKey: REPORTS_KEY }),
  });
}
