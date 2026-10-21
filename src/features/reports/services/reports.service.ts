import api from '@/lib/api';
import { floodReportPageSchema, type FloodReportPage, type ReportStatus } from '../schemas/report.schema';

export const reportsService = {
  async list(status: ReportStatus = 'PENDING', page = 0, size = 20): Promise<FloodReportPage> {
    const { data } = await api.get<unknown>('/api/reports', { params: { status, page, size } });
    return floodReportPageSchema.parse(data);
  },
};
