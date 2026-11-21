import type { FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';

/**
 * Texto fixo de aviso (ADR 0013): o alerta é experimental e não garante nada.
 * TODO(F3-PUBLICO-TELEFONE): acrescentar o telefone oficial da Defesa Civil quando for informado (pergunta 52).
 * Até lá o texto não traz número nenhum, de propósito.
 */
export const PUBLIC_WARNING =
  'Este é um alerta experimental (chuva prevista + cálculo da água na rua) que ainda não foi validado. Ele não confirma nem descarta alagamento no local. Em caso de chuva forte, siga as orientações da Defesa Civil.';

export const NO_POINT_TEXT = 'Não há ponto monitorado perto deste endereço.';

/** Manchetes de "Minha rua" pelo nível (seção 5.10). Nunca "risco baixo" nem "seguro". */
export const HEADLINE: Record<FloodLevel, string> = {
  ALERTA: 'Alerta de alagamento perto de você na próxima hora.',
  ATENCAO: 'Atenção: pode alagar perto de você se a chuva for forte.',
  SEM_ALERTA: 'Sem alerta de alagamento nas próximas 6 horas. Fique de olho na chuva.',
  SEM_DADO: 'Sem dado suficiente agora para dizer se vai alagar. Isto não quer dizer que está seguro.',
};
