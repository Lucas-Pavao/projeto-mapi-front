import { z } from 'zod';

/**
 * Validação de runtime pro contrato mais crítico do app: `/api/pontos` alimenta o mapa
 * inteiro. Um type TS só protege em tempo de compilação — se o backend mudar um shape de
 * resposta (como já aconteceu: `flood_probability`/`risk_level` chegando em snake_case
 * enquanto o tipo dizia camelCase), nada aqui te avisa, os campos só viram `undefined` em
 * silêncio. Isso valida o formato mínimo esperado e reporta claramente no console quando o
 * contrato real diverge do que o código espera, em vez de deixar o mapa quebrar sem explicação.
 *
 * Deliberadamente não é `.strict()`: o objetivo é pegar campos ESSENCIAIS ausentes/com tipo
 * errado, não rejeitar a resposta inteira porque o backend adicionou um campo novo.
 */
const floodPredictionSchema = z
  .object({
    floodProbability: z.number(),
    riskLevel: z.string(),
    estimatedTimeToEvent: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  })
  .passthrough();

const preciseDataSchema = z
  .object({
    source: z.string(),
    timestamp: z.string(),
    precipitation: z.number().nullable(),
    temperature: z.number().nullable(),
    tideHeight: z.number().nullable(),
  })
  .passthrough();

export const floodPointResponseSchema = z
  .object({
    id: z.number(),
    id_ponto: z.string(),
    nome: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    active: z.boolean(),
    liveData: preciseDataSchema.nullable().optional(),
    floodPrediction: floodPredictionSchema.nullable().optional(),
  })
  .passthrough();

/**
 * Valida um ponto crítico vindo da API. Em caso de divergência de contrato, loga um erro
 * detalhado (com o que exatamente não bateu) e devolve o dado como veio — não lança exceção,
 * pra não travar o mapa por causa de um campo secundário fora do formato esperado.
 */
export function validateFloodPoint<T>(raw: T): T {
  const result = floodPointResponseSchema.safeParse(raw);
  if (!result.success) {
    console.error(
      '[floodService] Resposta de /api/pontos não bate com o contrato esperado:',
      z.treeifyError(result.error),
      'payload recebido:',
      raw,
    );
  }
  return raw;
}
