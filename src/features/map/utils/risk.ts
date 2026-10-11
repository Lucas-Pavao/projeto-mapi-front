import type { DegradationReason, RiskLevel } from '../schemas/floodPointResponse.schema';

/** Visual de um nível de risco. UNKNOWN usa cinza neutro, fora da paleta de risco. */
export interface RiskVisual {
  label: string;
  /** Cor hex (círculo do mapa). */
  hex: string;
  /** Marcador: fundo e anel de pulso. */
  bg: string;
  ping: string;
  /** Texto/ícone, borda, fundo suave e cabeçalho (card de detalhe). */
  text: string;
  border: string;
  softBg: string;
  header: string;
  shadow: string;
  /** false em UNKNOWN: nunca exibir porcentagem. */
  showsProbability: boolean;
}

const UNKNOWN_VISUAL: RiskVisual = { label: 'Previsão indisponível', hex: '#71717a', bg: 'bg-zinc-500', ping: 'bg-zinc-400', text: 'text-zinc-400', border: 'border-zinc-500/30', softBg: 'bg-zinc-500/5', header: 'bg-zinc-600/80', shadow: 'shadow-black/20', showsProbability: false };

/** Único mapeamento risco→visual do app. `never` garante exaustividade em compilação. */
export function getRiskVisual(level: RiskLevel | undefined | null): RiskVisual {
  const l: RiskLevel = level ?? 'UNKNOWN';
  switch (l) {
    // Contraste (WCAG 1.4.11, F4-FRONT-01a): fundos de marcador escolhidos para ter >= 3:1 contra
    // o ícone branco e contra o fundo #09090b; textos (text-*-500) já passam de 4,5:1.
    case 'HIGH':
      return { label: 'Alto', hex: '#dc2626', bg: 'bg-red-600', ping: 'bg-red-400', text: 'text-red-500', border: 'border-red-500/30', softBg: 'bg-red-500/5', header: 'bg-red-600/80', shadow: 'shadow-red-500/20', showsProbability: true };
    case 'MEDIUM':
      return { label: 'Moderado', hex: '#d97706', bg: 'bg-amber-600', ping: 'bg-amber-400', text: 'text-amber-500', border: 'border-amber-500/30', softBg: 'bg-amber-500/5', header: 'bg-amber-600/80', shadow: 'shadow-amber-500/20', showsProbability: true };
    case 'LOW':
      return { label: 'Baixo', hex: '#059669', bg: 'bg-emerald-600', ping: 'bg-emerald-400', text: 'text-emerald-500', border: 'border-emerald-500/30', softBg: 'bg-emerald-500/5', header: 'bg-emerald-600/80', shadow: 'shadow-emerald-500/20', showsProbability: true };
    case 'UNKNOWN':
      return UNKNOWN_VISUAL;
    default: {
      // Exaustividade em compilação; em runtime, valor inesperado cai no estado neutro.
      const _exhaustive: never = l;
      void _exhaustive;
      return UNKNOWN_VISUAL;
    }
  }
}

const DEGRADATION_TEXT: Record<DegradationReason, string> = {
  INSUFFICIENT_DATA: 'dados insuficientes para prever',
  AI_TIMEOUT: 'o modelo demorou demais para responder',
  AI_UNAVAILABLE: 'o modelo está fora do ar',
  AI_ERROR: 'erro no modelo de previsão',
};

/** Texto fixo, em português, por motivo de degradação. Ausente → "motivo não informado". */
export function degradationText(reason: DegradationReason | null | undefined): string {
  if (!reason) return 'motivo não informado';
  return DEGRADATION_TEXT[reason] ?? 'motivo não informado';
}

/** "42%" ou null. UNKNOWN e probabilidade null nunca geram porcentagem (ADR 0007 §6). */
export function formatProbability(
  level: RiskLevel | undefined | null,
  probability: number | null | undefined,
): string | null {
  if (!getRiskVisual(level).showsProbability || probability == null) return null;
  return `${(probability * 100).toFixed(0)}%`;
}

/** Texto operacional de cada classe, para a legenda. Não promete o que o modelo ainda não faz. */
export const RISK_MEANING: Record<RiskLevel, string> = {
  LOW: 'Probabilidade de alagamento baixa na estimativa do modelo. Segue valendo acompanhar sensores e chuva.',
  MEDIUM: 'Probabilidade intermediária. Vale acompanhar o ponto e conferir os sensores próximos.',
  HIGH: 'Probabilidade alta. Priorize a verificação do ponto; a classe não confirma alagamento no local.',
  UNKNOWN: 'O modelo não respondeu ou faltam dados. Isto não significa risco baixo: use sensores e observação em campo.',
};

/** Ordem de exibição da legenda (do menor ao maior risco; indisponível por último). */
export const RISK_LEGEND_ORDER: readonly RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'];
