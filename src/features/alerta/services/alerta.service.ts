import api from '@/lib/api';
import { alertaPontosSchema, type AlertaPonto } from '../schemas/alerta.schema';

export const alertaService = {
  /** Estado atual do alerta de cada ponto. Em modo sombra, só ADMIN (403 para os demais). */
  async pontos(): Promise<AlertaPonto[]> {
    const { data } = await api.get<unknown>('/api/alerta/pontos');
    return alertaPontosSchema.parse(data);
  },
};
