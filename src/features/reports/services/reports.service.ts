import api from '@/lib/api';
import { floodReportPageSchema, floodReportSchema, type FloodReport, type FloodReportInput, type FloodReportPage, type ReportReview, type ReportStatus } from '../schemas/report.schema';

export type ReportStatusFilter = ReportStatus | 'ALL';

export const reportsService = {
  /** Fila de relatos (OPERADOR). `ALL` não manda o parâmetro status. */
  async list(status: ReportStatusFilter = 'PENDING', page = 0, size = 20): Promise<FloodReportPage> {
    const { data } = await api.get<unknown>('/api/reports', { params: { status: status === 'ALL' ? undefined : status, page, size } });
    return floodReportPageSchema.parse(data);
  },
  /** Confirmar (cria um FloodEvent ligado ao ponto) ou descartar. 409 = já revisado. */
  async review(id: number, body: ReportReview): Promise<FloodReport> {
    const { data } = await api.patch<unknown>(`/api/reports/${id}`, body);
    return floodReportSchema.parse(data);
  },
  /** Enviar relato de alagamento (USER). Nasce PENDING. */
  async create(input: FloodReportInput): Promise<FloodReport> {
    const { data } = await api.post<unknown>('/api/reports', input);
    return floodReportSchema.parse(data);
  },
};
