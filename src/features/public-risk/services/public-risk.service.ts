import axios from 'axios';
import type { PublicRisk } from '@/types/api';

// Endpoint público (ADR 0013): cliente sem credenciais e sem o redirecionamento de 401 para /login.
const publicApi = axios.create({ withCredentials: false });

export const publicRiskService = {
  async nearby(lat: number, lon: number): Promise<PublicRisk> {
    const { data } = await publicApi.get<PublicRisk>('/api/public/risk', { params: { lat, lon } });
    return data;
  },
};
