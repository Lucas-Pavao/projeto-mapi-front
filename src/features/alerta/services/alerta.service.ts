import { z } from 'zod';
import api from '@/lib/api';
import { alertaPontosSchema, type AlertaPonto } from '../schemas/alerta.schema';
import { conferenciaSchema, latencyReportSchema, latencySchema, type Conferencia, type Latency, type LatencyReport } from '../schemas/operacao.schema';

export const alertaService = {
  /** Estado atual do alerta de cada ponto. Em modo sombra, só ADMIN (403 para os demais). */
  async pontos(): Promise<AlertaPonto[]> {
    const { data } = await api.get<unknown>('/api/alerta/pontos');
    return alertaPontosSchema.parse(data);
  },
};


export const alertaOperacaoService = {
  async latencia(dias = 7): Promise<Latency> {
    const { data } = await api.get<unknown>('/api/alerta/latencia', { params: { dias } });
    return latencySchema.parse(data);
  },
  async relatorios(): Promise<LatencyReport[]> {
    const { data } = await api.get<unknown>('/api/alerta/latencia/relatorios');
    return z.array(latencyReportSchema).parse(data);
  },
  async conferencia(dias = 30): Promise<Conferencia> {
    const { data } = await api.get<unknown>('/api/alerta/conferencia', { params: { dias } });
    return conferenciaSchema.parse(data);
  },
};
