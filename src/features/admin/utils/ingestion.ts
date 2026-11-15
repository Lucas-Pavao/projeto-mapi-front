import { CircleAlert, CircleCheck, CirclePause, Clock, ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import type { IngestionSource, IngestionStatus } from '../schemas/admin.schema';

export const INGESTION_STATUS = {
  OK: { label: 'Em dia', Icon: CircleCheck, tone: 'text-success border-success/40 bg-success/10' },
  DELAYED: { label: 'Atrasada', Icon: Clock, tone: 'text-warning border-warning/40 bg-warning/10' },
  FAILING: { label: 'Com falha', Icon: CircleAlert, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  QUARANTINED: { label: 'Em quarentena', Icon: ShieldAlert, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  IDLE: { label: 'Parada', Icon: CirclePause, tone: 'text-muted-foreground border-border bg-muted' },
} satisfies Record<IngestionStatus, { label: string; Icon: ComponentType<{ className?: string }>; tone: string }>;

export const isProblem = (s: IngestionStatus) => s === 'FAILING' || s === 'QUARANTINED' || s === 'DELAYED';


/**
 * As 6 fontes da tela (mockup "Saúde dos dados"). A API lista cada chave do source_registry e do ingestion_run
 * (ex.: TABUAMARE_PE02, DHN_TABUA_PE02 e TIDE_PE02_HOURLY são a mesma maré); aqui elas viram uma fonte só.
 */
export const SOURCE_GROUPS: { id: string; name: string; what: string; members: string[] }[] = [
  { id: 'CEMADEN', name: 'APAC · Cemaden', what: 'Chuva (pluviômetros)', members: ['CEMADEN'] },
  { id: 'APAC', name: 'APAC · meteorologia', what: 'Chuva e nível de rio', members: ['APAC_METEO24H', 'APAC_PORTAL', 'APAC'] },
  { id: 'ANA', name: 'ANA · telemetria', what: 'Chuva e rio', members: ['ANA_SOAP', 'ANA'] },
  {
    id: 'OPEN_METEO', name: 'Open-Meteo', what: 'Clima atual e chuva 24 h',
    members: ['OPEN_METEO_CURRENT', 'OPEN_METEO_ARCHIVE', 'OPEN_METEO_ERA5LAND', 'OPEN_METEO_MARINE', 'OPEN_METEO'],
  },
  { id: 'TABUA', name: 'TabuaMare / DHN', what: 'Maré prevista (pe02)', members: ['TABUAMARE_PE02', 'DHN_TABUA_PE02', 'TIDE_PE02_HOURLY', 'TABUA_MARE', 'TABUA'] },
  { id: 'CKAN_RECIFE', name: 'CKAN Dados Recife', what: 'Ocorrências da Defesa Civil', members: ['CKAN_RECIFE'] },
];

/** Uma fonte da tela: o agregado das chaves que a compõem. `runSource` é a chave usada no filtro de execuções. */
export interface SourceView extends IngestionSource {
  name: string;
  what: string;
  runSource: string;
}

const SEVERITY: Record<IngestionStatus, number> = { FAILING: 4, QUARANTINED: 3, DELAYED: 2, OK: 1, IDLE: 0 };
const latest = (a: string | null | undefined, b: string | null | undefined) => (!a ? b : !b ? a : Date.parse(a) >= Date.parse(b) ? a : b);

/**
 * Junta as chaves da API nas fontes da tela. Chave que nunca rodou (IDLE) não pesa no estado do grupo; o estado
 * é o pior entre as que rodaram. Chave fora de qualquer grupo vira um cartão próprio.
 */
export function groupSources(items: IngestionSource[]): SourceView[] {
  const byKey = new Map(items.map((s) => [s.source, s]));
  const used = new Set<string>();
  const out: SourceView[] = [];
  for (const g of SOURCE_GROUPS) {
    const members = g.members.map((m) => byKey.get(m)).filter((m): m is IngestionSource => !!m);
    if (members.length === 0) continue;
    members.forEach((m) => used.add(m.source));
    const ran = members.filter((m) => m.lastRunId || m.lastSuccessAt || m.status !== 'IDLE');
    const worst = (ran.length ? ran : members).reduce((a, b) => (SEVERITY[b.status] > SEVERITY[a.status] ? b : a));
    const everies = members.map((m) => m.expectedEveryMinutes).filter((v): v is number => v != null && v > 0);
    const recent = ran.reduce<IngestionSource | null>((a, b) => (!a || latest(a.lastSuccessAt, b.lastSuccessAt) === b.lastSuccessAt ? b : a), null);
    out.push({
      source: g.id,
      name: g.name,
      what: g.what,
      status: worst.status,
      expectedEveryMinutes: everies.length ? Math.min(...everies) : null,
      lastSuccessAt: ran.reduce<string | null | undefined>((a, m) => latest(a, m.lastSuccessAt), null) ?? null,
      lastRunId: worst.lastRunId ?? recent?.lastRunId ?? null,
      lastError: worst.lastError ?? null,
      rowsLast24h: members.reduce((n, m) => n + (m.rowsLast24h ?? 0), 0),
      runSource: (worst.lastRunId ? worst : recent ?? members[0]).source,
    });
  }
  for (const s of items) {
    if (!used.has(s.source)) out.push({ ...s, name: s.source, what: '', runSource: s.source });
  }
  return out;
}

/** Sem ciclo agendado e sem problema: a fonte roda sob demanda (carga, maré anual, revalidação). */
export const isOnDemand = (s: Pick<IngestionSource, 'status' | 'expectedEveryMinutes'>) =>
  !s.expectedEveryMinutes && (s.status === 'OK' || s.status === 'IDLE');

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
