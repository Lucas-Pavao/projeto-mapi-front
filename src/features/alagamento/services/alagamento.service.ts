import api from '@/lib/api';
import { alagamentoHistoricoSchema, alagamentoPontosSchema, alagamentoStatusSchema, type AlagamentoHistorico, type AlagamentoPonto, type AlagamentoStatus } from '../schemas/alagamento.schema';

export const alagamentoService = {
  /** Alerta de alagamento por regressão de cada ponto. Em modo sombra, só ADMIN (403 para os demais). */
  async pontos(): Promise<AlagamentoPonto[]> {
    const { data } = await api.get<unknown>('/api/alagamento/pontos');
    return alagamentoPontosSchema.parse(data);
  },
  /** Histórico por ponto nas últimas `horas` horas (modo sombra: só ADMIN). */
  async historico(horas: number): Promise<AlagamentoHistorico> {
    const { data } = await api.get<unknown>('/api/alagamento/historico', { params: { horas } });
    return alagamentoHistoricoSchema.parse(data);
  },
  /** Versões da IA e último ciclo (só ADMIN). */
  async status(): Promise<AlagamentoStatus> {
    const { data } = await api.get<unknown>('/api/alagamento/status');
    return alagamentoStatusSchema.parse(data);
  },
};
