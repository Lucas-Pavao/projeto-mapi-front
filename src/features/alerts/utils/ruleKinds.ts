import type { AlertKind, AlertRuleInput, RuleKind } from '../schemas/alert.schema';

export interface RuleKindInfo {
  label: string;
  /** Unidade do limiar; null = esta regra não usa limiar numérico. */
  unit: string | null;
  usesMinRisk: boolean;
  /** Obrigatória para TIDE_ABOVE e RAIN_RATE (contrato). */
  needsSource: boolean;
  /** A regra aponta para uma estação (em vez de um ponto)? */
  target: 'point' | 'station' | 'either';
  help: string;
}

export const RULE_KINDS: Record<RuleKind, RuleKindInfo> = {
  RISK_LEVEL: { label: 'Alerta de alagamento', unit: null, usesMinRisk: true, needsSource: false, target: 'point', help: 'Dispara quando o alerta por regressão do ponto entra em Atenção ou Alerta (conforme o mínimo) e avisa quando sai. Experimental: em modo sombra não dispara.' },
  RIVER_STAGE: { label: 'Cota do rio', unit: 'm', usesMinRisk: false, needsSource: false, target: 'station', help: 'Dispara quando a estação de rio passa do limiar.' },
  TIDE_ABOVE: { label: 'Maré acima de', unit: 'm', usesMinRisk: false, needsSource: true, target: 'point', help: 'Maré prevista na referência da tábua (NR). Exige fonte do limiar.' },
  RAIN_RATE: { label: 'Chuva em 1 h', unit: 'mm/h', usesMinRisk: false, needsSource: true, target: 'station', help: 'Compara com a soma horária do pluviômetro. Exige fonte do limiar.' },
  SENSOR_STALE: { label: 'Sensor sem resposta', unit: 'min', usesMinRisk: false, needsSource: false, target: 'station', help: 'Dispara quando o sensor passa de tantos minutos sem leitura.' },
  PREDICTION_UNAVAILABLE: { label: 'Alerta sem dado', unit: null, usesMinRisk: false, needsSource: false, target: 'point', help: 'Dispara quando o alerta do ponto fica sem dado (chuva ausente, previsão fora, sem terreno). Sem dado não é sem alerta.' },
};

export const ALERT_KIND_LABEL = (k: AlertKind): string => {
  if (k === 'SOURCE_STALE') return 'Fonte de dados parada';
  if (k === 'MODEL_CHECK') return 'Conferência da previsão de chuva';
  return RULE_KINDS[k].label;
};

/** Valida o formulário da regra; devolve erros por campo (vazio = válido). */
export function validateRule(r: Partial<AlertRuleInput> & { kind: RuleKind }): Record<string, string> {
  const info = RULE_KINDS[r.kind];
  const e: Record<string, string> = {};
  if (info.unit) {
    if (r.threshold == null || !Number.isFinite(r.threshold)) e.threshold = `Informe o limiar em ${info.unit}.`;
    else if (r.threshold < 0) e.threshold = 'O limiar não pode ser negativo.';
  }
  if (info.needsSource && !r.thresholdSource?.trim()) e.thresholdSource = 'Informe de onde vem este limiar (norma, estudo, decisão registrada).';
  if (info.usesMinRisk && !r.minRisk) e.minRisk = 'Escolha o nível mínimo.';
  return e;
}
