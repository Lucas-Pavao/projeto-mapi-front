import type { AlagamentoPonto, FloodLevel, FloodReason } from '../schemas/alagamento.schema';

/** Alerta de alagamento por regressão: textos e tons num só lugar (prancha "Nível 6"). Nunca "risco baixo" nem "seguro". */

export type FloodTone = 'danger' | 'warn' | 'ok' | 'muted';

export const HCRIT_CM = 15;
/** Escala das barras de previsão de lâmina: 0 a 50 cm (o traço de 15 cm fica a 30%). */
export const BAR_MAX_CM = 50;

export const REASON_SHORT: Record<FloodReason, string> = {
  CHUVA_AUSENTE: 'chuva ausente',
  PREVISAO_INDISPONIVEL: 'previsão fora',
  SEM_TERRENO: 'sem terreno',
  TERRENO_EM_REVISAO: 'terreno em revisão',
  SERIE_INCOMPLETA: 'série incompleta',
};

const assertNever = (x: never): never => {
  throw new Error(`nível desconhecido: ${String(x)}`);
};

export const toneOf = (level: FloodLevel): FloodTone => {
  switch (level) {
    case 'ALERTA': return 'danger';
    case 'ATENCAO': return 'warn';
    case 'SEM_ALERTA': return 'ok';
    case 'SEM_DADO': return 'muted';
    default: return assertNever(level);
  }
};

export interface FloodChip { label: string; tone: FloodTone; dashed: boolean; info: string }

/** Selo do nível: "Alerta em 1 h", "Atenção em 3 h", "Sem alerta em 6 h", "Sem dado · chuva ausente". */
export const floodChipOf = (p: Pick<AlagamentoPonto, 'level' | 'worstHorizonHours' | 'reason' | 'reasonText'>): FloodChip => {
  const h = p.worstHorizonHours ?? 6;
  switch (p.level) {
    case 'ALERTA':
      return { label: `Alerta em ${h} h`, tone: 'danger', dashed: false,
        info: `A lâmina provável (cenário q50) chega a 15 cm nas próximas ${h} h. Alerta experimental: chuva prevista pelo rain_v1 passada pelo balde do ponto.` };
    case 'ATENCAO':
      return { label: `Atenção em ${h} h`, tone: 'warn', dashed: false,
        info: `Só a lâmina pessimista (cenário q95) chega a 15 cm nas próximas ${h} h; a provável não chega. Alerta experimental.` };
    case 'SEM_ALERTA':
      return { label: `Sem alerta em ${h} h`, tone: 'ok', dashed: false,
        info: `Nenhum dos dois cenários de chuva leva a lâmina a 15 cm nas próximas ${h} h. Isto não quer dizer que não há risco: o balde não está calibrado.` };
    case 'SEM_DADO': {
      const short = p.reason ? REASON_SHORT[p.reason] : 'sem motivo';
      return { label: `Sem dado · ${short}`, tone: 'muted', dashed: true,
        info: `Sem dado não é sem alerta: ${p.reasonText ?? short}. O alerta não foi calculado neste ciclo.` };
    }
    default: return assertNever(p.level);
  }
};

export const CHIP_CLASS: Record<FloodTone, string> = {
  danger: 'border-destructive/60 bg-destructive/10 text-destructive',
  warn: 'border-warning/60 bg-warning/10 text-warning',
  ok: 'border-success/60 bg-success/10 text-foreground',
  muted: 'border-muted-foreground/50 bg-muted text-muted-foreground',
};
export const DOT_CLASS: Record<FloodTone, string> = {
  danger: 'bg-destructive', warn: 'bg-warning', ok: 'bg-success', muted: 'bg-muted-foreground',
};
export const EDGE_CLASS: Record<FloodTone, string> = {
  danger: 'border-t-destructive', warn: 'border-t-warning', ok: 'border-t-success', muted: 'border-t-muted-foreground border-dashed',
};
/** Barra q50 (cheia) e q95 (clara) por nível do horizonte. Sem alerta fica no azul primário, como na prancha. */
export const BAR_CLASS: Record<FloodLevel, { q50: string; q95: string; text: string }> = {
  ALERTA: { q50: 'bg-destructive', q95: 'bg-destructive/35', text: 'text-destructive' },
  ATENCAO: { q50: 'bg-warning', q95: 'bg-warning/35', text: 'text-warning' },
  SEM_ALERTA: { q50: 'bg-primary', q95: 'bg-primary/35', text: 'text-foreground' },
  SEM_DADO: { q50: 'bg-muted-foreground', q95: 'bg-muted-foreground/35', text: 'text-muted-foreground' },
};

const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export const fmt1 = (v: number | null | undefined) => (v == null ? null : nf1.format(v));

/** "17–33 cm" (inteiros). */
export const rangeCm = (q50: number | null | undefined, q95: number | null | undefined) =>
  q50 == null || q95 == null ? 'sem dado' : `${nf0.format(Math.round(q50))}–${nf0.format(Math.round(q95))} cm`;

/** "Imbiribeira · 1,1 km · 4 min" (estação pelo nome, ou o código sem nome; distância; idade da leitura). */
export const rainSourceLine = (p: Pick<AlagamentoPonto, 'rainStation' | 'rainStationName' | 'rainStationDistanceKm' | 'latestReadingAgeMinutes'>) => {
  const parts: string[] = [];
  const station = p.rainStationName ?? p.rainStation;
  if (station) parts.push(station);
  if (p.rainStationDistanceKm != null) parts.push(`${nf1.format(p.rainStationDistanceKm)} km`);
  if (p.latestReadingAgeMinutes != null) parts.push(`${nf0.format(Math.round(p.latestReadingAgeMinutes))} min`);
  return parts.join(' · ');
};

export const pctOfBar = (cm: number | null | undefined) => (cm == null ? 0 : Math.max(0, Math.min(100, (cm / BAR_MAX_CM) * 100)));

export const INFO = {
  sheetNow: 'Água acumulada na rua estimada pelo balde do ponto com a chuva medida. Alagamento a partir de 15 cm.',
  rainNow: 'Chuva medida na última hora no ponto: o maior valor entre as estações válidas a até 5 km (rede Cemaden/PED). Abaixo, a estação da leitura mais nova, a distância e a idade da leitura.',
  forecast: 'Lâmina máxima prevista em 1, 3 e 6 h. Barra cheia: cenário provável (chuva q50 do rain_v1). Barra clara: cenário pessimista (q95). Traço vermelho: 15 cm. Alerta se a provável chega a 15 cm; Atenção se só a pessimista chega.',
  experimental: 'Experimental: nenhum modelo aprende com rótulo de alagamento; o balde não está calibrado e, na validação de 5 anos, o alerta nunca disparou. Fica assim até a validação ser aprovada pelo orientador.',
};
