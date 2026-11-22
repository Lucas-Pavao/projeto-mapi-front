import axios from 'axios';
import api from '@/lib/api';
import { officialWarningsResponseSchema, type OfficialWarningsResponse } from '@/features/warnings/schemas/officialWarning.schema';
import { horizonsSchema, officialForecastSchema, type Horizons, type OfficialForecast } from '../schemas/horizontes.schema';

// Rotas públicas (Minha rua): cliente sem credenciais e sem o redirecionamento de 401 para /login.
const publicApi = axios.create({ withCredentials: false });

export const horizontesService = {
  /** As três camadas do ponto (exige login). */
  async forPoint(slug: string): Promise<Horizons> {
    const { data } = await api.get<unknown>(`/api/horizontes/${encodeURIComponent(slug)}`);
    return horizonsSchema.parse(data);
  },
  /** Previsão do INMET do município (exige login). */
  async forecast(municipio: string): Promise<OfficialForecast> {
    const { data } = await api.get<unknown>(`/api/previsao-oficial/${encodeURIComponent(municipio)}`);
    return officialForecastSchema.parse(data);
  },
  /** Previsão do INMET do município (pública). */
  async publicForecast(municipio: string): Promise<OfficialForecast> {
    const { data } = await publicApi.get<unknown>(`/api/public/previsao-oficial/${encodeURIComponent(municipio)}`);
    return officialForecastSchema.parse(data);
  },
  /** Avisos vigentes do INMET do município (pública). */
  async publicWarnings(municipio: string): Promise<OfficialWarningsResponse> {
    const { data } = await publicApi.get<unknown>(`/api/public/avisos-oficiais/${encodeURIComponent(municipio)}`);
    return officialWarningsResponseSchema.parse(data);
  },
};
