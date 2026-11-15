import { rainDataSchema, type RainData } from '../schemas/rain-events.schema';

/** Os eventos dos 5 anos vêm de um JSON estático (o cálculo ao vivo passa de 1,5 min): import dinâmico, fora do bundle principal. */
export async function loadRainData(): Promise<RainData> {
  const mod = await import('../data/eventos_chuva_5anos.json');
  return rainDataSchema.parse(mod.default);
}
