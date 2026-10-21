import api from '@/lib/api';
import type { FloodReport, PageMeta, ReportStatus } from '@/types/api';

export const reportsService = {
  async list(status: ReportStatus = 'PENDING', page = 0, size = 20): Promise<PageMeta<FloodReport>> {
    const { data } = await api.get<PageMeta<FloodReport>>('/api/reports', { params: { status, page, size } });
    return data;
  },
};
