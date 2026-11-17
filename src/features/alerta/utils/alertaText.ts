import type { AlertaPonto } from '../schemas/alerta.schema';

const mm = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
const cm = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }));

export const PHYSICAL_MODEL_LABEL = 'Estimativa do modelo físico, ainda não validada contra alagamento observado';

/** Título do destaque de chuva. SEM_DADO nunca vira "sem risco". Mapeamento exaustivo. */
export function rainTitle(a: AlertaPonto): string {
  switch (a.rainAlert) {
    case 'ALERTA':
      return 'Chuva acima do que a galeria escoa';
    case 'ATENCAO':
      return 'Chuva forte provável';
    case 'NENHUM':
      return 'Sem alerta de chuva';
    case 'SEM_DADO':
      return 'Sem dado suficiente agora';
    default: {
      const never: never = a.rainAlert;
      return never;
    }
  }
}

/** Mensagem do alerta de chuva, com o texto combinado no prompt. Nenhuma das duas promete alagamento. */
export function rainMessage(a: AlertaPonto, ponto: string): string {
  switch (a.rainAlert) {
    case 'ATENCAO':
      return `Chuva forte provável nos próximos 20 a 60 min em ${ponto}. Chuva agora: ${mm(a.rainTeMm)} mm em 10 min.`;
    case 'ALERTA':
      return `Chuva acima do que a galeria escoa em ${ponto}.`;
    case 'NENHUM':
      return `Chuva agora: ${mm(a.rainTeMm)} mm em 10 min.`;
    case 'SEM_DADO':
      return `Sem dado suficiente agora: ${a.rainReasonText ?? a.rainReason ?? 'motivo não informado'}.`;
    default: {
      const never: never = a.rainAlert;
      return never;
    }
  }
}

/** Mensagem do nível do ponto (balde a 10 min). Sempre acompanhada da etiqueta do modelo físico. */
export function floodMessage(a: AlertaPonto, ponto: string): string {
  switch (a.pointFlood) {
    case 'PROVAVEL': {
      const agora = a.floodInMinutes === 0;
      const y = agora ? a.hNowCm : a.hProjQ50MaxCm;
      return `Alagamento provável em ${ponto}: lâmina estimada de ${cm(y)} cm ${agora ? 'agora' : `em até ${a.floodInMinutes} min`}.`;
    }
    case 'NAO':
      return `Lâmina estimada agora: ${cm(a.hNowCm)} cm (alagamento a partir de 15 cm).`;
    case 'SEM_DADO':
      return `Nível do ponto sem dado: ${a.floodReasonText ?? a.floodReason ?? 'motivo não informado'}.`;
    default: {
      const never: never = a.pointFlood;
      return never;
    }
  }
}

/** Faixa da lâmina projetada: mediana (q50) e quantil de 80%, nunca um número único. */
export function floodBand(a: AlertaPonto): string | null {
  if (a.hProjQ50MaxCm == null && a.hProjQ80MaxCm == null) return null;
  return `Projeção em 60 min: ${cm(a.hProjQ50MaxCm)} cm (chuva prevista mediana) a ${cm(a.hProjQ80MaxCm)} cm (quantil de 80%).`;
}

export function ageText(a: AlertaPonto): string | null {
  if (a.latestReadingAgeMinutes == null) return null;
  return `leitura de ${Math.round(a.latestReadingAgeMinutes)} min atrás`;
}

export type AlertChipKind = 'NENHUM' | 'ATENCAO' | 'ALERTA' | 'PROVAVEL' | 'ALERTA_PROVAVEL' | 'SEM_DADO' | 'NAO_OFICIAL';
export type AlertTone = 'ok' | 'warn' | 'danger' | 'muted';

export interface AlertChip { kind: AlertChipKind; label: string; tone: AlertTone; dashed: boolean }

const CHIPS: Record<AlertChipKind, AlertChip> = {
  NENHUM: { kind: 'NENHUM', label: 'Sem alerta de chuva', tone: 'ok', dashed: false },
  ATENCAO: { kind: 'ATENCAO', label: 'Atenção · chuva forte provável', tone: 'warn', dashed: false },
  ALERTA: { kind: 'ALERTA', label: 'Alerta · chuva acima da galeria', tone: 'danger', dashed: false },
  PROVAVEL: { kind: 'PROVAVEL', label: 'Alagamento provável', tone: 'danger', dashed: false },
  ALERTA_PROVAVEL: { kind: 'ALERTA_PROVAVEL', label: 'Alerta + alagamento provável', tone: 'danger', dashed: false },
  SEM_DADO: { kind: 'SEM_DADO', label: 'Alerta sem dado', tone: 'muted', dashed: true },
  NAO_OFICIAL: { kind: 'NAO_OFICIAL', label: 'Alerta em teste', tone: 'muted', dashed: true },
};

/**
 * Selo do alerta no topo do card. Quem não é ADMIN vê "em teste" (modo sombra). Sem leitura (carregando, erro, ponto
 * ainda não calculado) e SEM_DADO viram "Alerta sem dado", nunca "sem alerta". Alagamento provável vence a chuva.
 */
export function alertChipOf(a: AlertaPonto | null | undefined, isAdmin: boolean): AlertChip {
  if (!isAdmin) return CHIPS.NAO_OFICIAL;
  if (!a) return CHIPS.SEM_DADO;
  if (a.pointFlood === 'PROVAVEL') return a.rainAlert === 'ALERTA' ? CHIPS.ALERTA_PROVAVEL : CHIPS.PROVAVEL;
  switch (a.rainAlert) {
    case 'ALERTA': return CHIPS.ALERTA;
    case 'ATENCAO': return CHIPS.ATENCAO;
    case 'NENHUM': return CHIPS.NENHUM;
    case 'SEM_DADO': return CHIPS.SEM_DADO;
    default: {
      const never: never = a.rainAlert;
      return never;
    }
  }
}

export type MarkerRing = 'ATENCAO' | 'ALERTA' | 'SEM_DADO';

/** Anel do marcador no mapa: laranja ATENCAO, vermelho ALERTA ou alagamento provável, cinza tracejado SEM_DADO. Sem alerta, sem anel. */
export function markerRingOf(a: AlertaPonto | null | undefined): MarkerRing | null {
  if (!a) return null;
  const k = alertChipOf(a, true).kind;
  if (k === 'ALERTA' || k === 'PROVAVEL' || k === 'ALERTA_PROVAVEL') return 'ALERTA';
  if (k === 'ATENCAO') return 'ATENCAO';
  if (k === 'SEM_DADO') return 'SEM_DADO';
  return null;
}

export const CHIP_TONE_CLASS: Record<AlertTone, string> = {
  ok: 'border-success/60 bg-success/10 text-foreground',
  warn: 'border-warning/60 bg-warning/10 text-warning',
  danger: 'border-destructive/60 bg-destructive/10 text-destructive',
  muted: 'border-muted-foreground/50 bg-muted text-muted-foreground',
};
export const CHIP_EDGE_CLASS: Record<AlertTone, string> = {
  ok: 'border-t-success', warn: 'border-t-warning', danger: 'border-t-destructive', muted: 'border-t-muted-foreground',
};
