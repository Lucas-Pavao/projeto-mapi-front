import axios, { isAxiosError } from 'axios';
import { publicRiskSchema, type PublicRisk } from '../schemas/public-risk.schema';

// Endpoint público (ADR 0013): cliente sem credenciais e sem o redirecionamento de 401 para /login.
const publicApi = axios.create({ withCredentials: false });

export const publicRiskService = {
  async nearby(lat: number, lon: number): Promise<PublicRisk> {
    const { data } = await publicApi.get<unknown>('/api/public/risk', { params: { lat, lon } });
    return publicRiskSchema.parse(data);
  },
};

/** Segundos do cabeçalho Retry-After de uma resposta 429, ou null. */
export function retryAfterSeconds(error: unknown): number | null {
  if (!isAxiosError(error)) return null;
  const raw = error.response?.headers?.['retry-after'];
  const n = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.ceil(n) : null;
}
