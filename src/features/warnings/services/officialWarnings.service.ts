import api from '@/lib/api';
import { officialWarningsResponseSchema, type OfficialWarningsResponse } from '../schemas/officialWarning.schema';

export const officialWarningsService = {
  /** Consulta avisos meteorológicos oficiais vigentes persistidos pela API (INMET, ADR 0024). */
  async getActive(municipio?: string): Promise<OfficialWarningsResponse> {
    const { data } = await api.get<unknown>('/api/warnings/official/active', {
      params: municipio ? { municipio } : undefined,
    });
    return officialWarningsResponseSchema.parse(data);
  },
};
