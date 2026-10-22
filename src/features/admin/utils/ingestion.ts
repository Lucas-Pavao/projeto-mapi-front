import { CircleAlert, CircleCheck, CirclePause, Clock, ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import type { IngestionStatus } from '../schemas/admin.schema';

export const INGESTION_STATUS = {
  OK: { label: 'Em dia', Icon: CircleCheck, tone: 'text-success border-success/40 bg-success/10' },
  DELAYED: { label: 'Atrasada', Icon: Clock, tone: 'text-warning border-warning/40 bg-warning/10' },
  FAILING: { label: 'Com falha', Icon: CircleAlert, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  QUARANTINED: { label: 'Em quarentena', Icon: ShieldAlert, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  IDLE: { label: 'Parada', Icon: CirclePause, tone: 'text-muted-foreground border-border bg-muted' },
} satisfies Record<IngestionStatus, { label: string; Icon: ComponentType<{ className?: string }>; tone: string }>;

export const isProblem = (s: IngestionStatus) => s === 'FAILING' || s === 'QUARANTINED' || s === 'DELAYED';


/** Nome e conteúdo de cada fonte, só para exibir (o contrato traz apenas o identificador). */
export const SOURCE_INFO: Record<string, { name: string; what: string }> = {
  CEMADEN: { name: 'APAC · Cemaden', what: 'Chuva (pluviômetros)' },
  APAC: { name: 'APAC · meteorologia', what: 'Chuva e nível de rio' },
  ANA: { name: 'ANA · telemetria', what: 'Chuva e rio' },
  OPEN_METEO: { name: 'Open-Meteo', what: 'Clima atual e chuva 24 h' },
  TABUA_MARE: { name: 'TabuaMare / DHN', what: 'Maré prevista (pe02)' },
  TABUA: { name: 'TabuaMare / DHN', what: 'Maré prevista (pe02)' },
  CKAN_RECIFE: { name: 'CKAN Dados Recife', what: 'Ocorrências da Defesa Civil' },
};

/** Cor do ponto e do texto de estado de uma fonte. */
export const STATUS_COLOR: Record<IngestionStatus, string> = {
  OK: 'var(--success)',
  DELAYED: 'var(--warning)',
  FAILING: 'var(--destructive)',
  QUARANTINED: 'var(--destructive)',
  IDLE: 'var(--muted-foreground)',
};

export const everyText = (min: number | null | undefined): string => {
  if (min == null || min <= 0) return 'manual';
  if (min >= 1440) return `a cada ${min / 1440 === 1 ? '1 dia' : `${Math.round(min / 1440)} dias`}`;
  if (min >= 60) return `a cada ${Math.round((min / 60) * 10) / 10} h`.replace('.', ',');
  return `a cada ${min} min`;
};

/** "há 5 min", "há 2 h", "há 3 d"; sem data, "nunca". */
export function agoText(iso: string | null | undefined, now: number): string {
  if (!iso) return 'nunca';
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.floor(min / 60)} h`;
  return `há ${Math.floor(min / 1440)} d`;
}

/** Fração (0 a 1) do intervalo esperado já decorrida desde o último sucesso; sem intervalo, null. */
export function elapsedFraction(iso: string | null | undefined, everyMin: number | null | undefined, now: number): number | null {
  if (!iso || !everyMin) return null;
  return Math.min(1, Math.max(0, (now - Date.parse(iso)) / 60_000 / everyMin));
}
