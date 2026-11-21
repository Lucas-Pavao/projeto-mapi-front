import api from '@/lib/api';
import { alagamentoPontosSchema, alagamentoStatusSchema, type AlagamentoPonto, type AlagamentoStatus } from '../schemas/alagamento.schema';

export const alagamentoService = {
  /** Alerta de alagamento por regressão de cada ponto. Em modo sombra, só ADMIN (403 para os demais). */
  async pontos(): Promise<AlagamentoPonto[]> {
    const { data } = await api.get<unknown>('/api/alagamento/pontos');
    return alagamentoPontosSchema.parse(data);
  },
  /** Versões da IA e último ciclo (só ADMIN). */
  async status(): Promise<AlagamentoStatus> {
    const { data } = await api.get<unknown>('/api/alagamento/status');
    return alagamentoStatusSchema.parse(data);
  },
};
