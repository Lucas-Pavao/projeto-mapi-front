import type { DegradationReason, ModelValidationStatus, RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';

/**
 * Visual de um nível de risco, em tokens do tema (theme.css). UNKNOWN usa cinza neutro, fora da
 * paleta de risco. A escada vai do claro (baixo) ao escuro (alto): ícone e rótulo sempre juntos.
 */
export interface RiskVisual {
  label: string;
  /** Preenchimento do nível (hex do tema; MapLibre não lê var()) e cor de ícone/texto sobre ele. */
  hex: string;
  onHex: string;
  /** Marcador/selo: preenchimento `risk-*`, ícone/texto `on-risk-*` e borda `risk-*-edge`. */
  bg: string;
  /** Anel de pulso. */
  ping: string;
  /** Texto/ícone sobre superfície (`risk-*-text`), borda suave, fundos suaves e cabeçalho (card de detalhe). */
  text: string;
  border: string;
  softBg: string;
  tint: string;
  header: string;
  shadow: string;
  /** false em UNKNOWN: nunca exibir porcentagem. */
  showsProbability: boolean;
}

const UNKNOWN_VISUAL: RiskVisual = { label: 'Previsão indisponível', hex: '#8a9a9c', onHex: '#0a1419', bg: 'bg-risk-unknown text-on-risk-unknown border-risk-unknown-edge', ping: 'bg-risk-unknown', text: 'text-risk-unknown-text', border: 'border-risk-unknown-edge/40', softBg: 'bg-risk-unknown/10', tint: 'bg-risk-unknown/20', header: 'bg-risk-unknown text-on-risk-unknown', shadow: 'shadow-elevation-raised', showsProbability: false };

/** Único mapeamento risco→visual do app. `never` garante exaustividade em compilação. */
export function getRiskVisual(level: RiskLevel | undefined | null): RiskVisual {
  const l: RiskLevel = level ?? 'UNKNOWN';
  switch (l) {
    case 'HIGH':
      return { label: 'Alto', hex: '#d4373c', onHex: '#ffffff', bg: 'bg-risk-high text-on-risk-high border-risk-high-edge', ping: 'bg-risk-high', text: 'text-risk-high-text', border: 'border-risk-high-edge/40', softBg: 'bg-risk-high/10', tint: 'bg-risk-high/20', header: 'bg-risk-high text-on-risk-high', shadow: 'shadow-elevation-raised', showsProbability: true };
    case 'MEDIUM':
      return { label: 'Moderado', hex: '#f5a524', onHex: '#2a1a00', bg: 'bg-risk-moderate text-on-risk-moderate border-risk-moderate-edge', ping: 'bg-risk-moderate', text: 'text-risk-moderate-text', border: 'border-risk-moderate-edge/40', softBg: 'bg-risk-moderate/10', tint: 'bg-risk-moderate/20', header: 'bg-risk-moderate text-on-risk-moderate', shadow: 'shadow-elevation-raised', showsProbability: true };
    case 'LOW':
      return { label: 'Baixo', hex: '#9be7bd', onHex: '#0b2a1d', bg: 'bg-risk-low text-on-risk-low border-risk-low-edge', ping: 'bg-risk-low', text: 'text-risk-low-text', border: 'border-risk-low-edge/40', softBg: 'bg-risk-low/10', tint: 'bg-risk-low/20', header: 'bg-risk-low text-on-risk-low', shadow: 'shadow-elevation-raised', showsProbability: true };
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

/** Rótulo obrigatório junto da classe enquanto o modelo não for validado (ADR 0007, emenda 1). */
export const EXPERIMENTAL_LABEL = 'Previsão experimental — modelo não validado';

/** Estado de validação efetivo: ausente (backend antigo) = NOT_VALIDATED. */
export function validationStatusOf(
  prediction: { modelValidationStatus?: ModelValidationStatus | null } | null | undefined,
): ModelValidationStatus {
  return prediction?.modelValidationStatus === 'VALIDATED' ? 'VALIDATED' : 'NOT_VALIDATED';
}

/** true quando a classe (LOW/MEDIUM/HIGH) deve vir com o rótulo experimental. UNKNOWN tem estado próprio. */
export function showsExperimentalLabel(
  prediction: { riskLevel?: RiskLevel | null; modelValidationStatus?: ModelValidationStatus | null } | null | undefined,
): boolean {
  if (!prediction || !getRiskVisual(prediction.riskLevel).showsProbability) return false;
  return validationStatusOf(prediction) === 'NOT_VALIDATED';
}

/** Frase da legenda sobre o rótulo experimental. */
export const EXPERIMENTAL_LEGEND_TEXT = 'Classes experimentais: modelo não validado.';
