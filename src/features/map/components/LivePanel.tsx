import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui/panel';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { RiskCountTiles } from '@/components/risk/RiskCountTiles';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { Sparkline } from '@/components/charts/Sparkline';
import { degradationText, formatProbability, getRiskVisual, showsExperimentalLabel } from '@/components/risk/risk';
import { cn } from '@/lib/utils';
import type { RiskSummary } from '@/features/points/schemas/prediction.schema';
import type { LiveStatus } from '@/features/live/hooks/useLiveStream';
import type { FloodPointResponseDTO, SensorResponseDTO } from '../types';
import { getDataFreshness, getSensorConfig } from '../utils/sensor';
import { fmtNum, riverState, sortPoints } from '../utils/overview';
import { formatRecife } from '../utils/datetime';
import type { useMapOverview } from '../hooks/useMapOverview';
import type { StationAccumulation } from '../schemas/measuredRain.schema';
import { feedSourceText, liveAliasCodes, stationRowText } from '../utils/measuredRain';
import { alertChipOf, CHIP_TONE_CLASS } from '@/features/alerta/utils/alertaText';
import type { AlertaPonto } from '@/features/alerta/schemas/alerta.schema';
import { OfficialWarningBadge } from '@/features/warnings/components/OfficialWarningBadge';
import type { OfficialWarning } from '@/features/warnings/schemas/officialWarning.schema';

type Overview = ReturnType<typeof useMapOverview>;
type Tab = 'points' | 'sensors';

interface Props {
  points: FloodPointResponseDTO[];
  sensors: SensorResponseDTO[];
  summary: RiskSummary | undefined;
  summaryFailed: boolean;
  liveStatus: LiveStatus;
  lastSuccessAt: string | null;
  overview: Overview;
  selectedFloodPointId?: number;
  selectedSensorId?: number;
  onFloodPointClick: (p: FloodPointResponseDTO) => void;
  onSensorClick: (s: SensorResponseDTO) => void;
  /**
   * Estações unificadas com a chuva medida (rain-accumulations). Com elas, o pluviômetro do feed que é a mesma
   * estação física sai da lista e a estação aparece uma vez só, com janela e fonte declaradas.
   */
  stations?: StationAccumulation[];
  onStationClick?: (canonicalId: string) => void;
  selectedStationId?: string | null;
  /** Avisos meteorológicos oficiais vigentes do INMET (ADR 0024). */
  officialWarnings?: OfficialWarning[];
  /** Estado do alerta por ponto (só ADMIN): vira a 1ª linha da lista; o risco de 6 h passa a segundo plano. */
  alertaBySlug?: ReadonlyMap<string, AlertaPonto>;
  /** Só ADMIN abre "Saúde dos dados" (ADR 0010). */
  canSeeDataHealth: boolean;
  className?: string;
}

/** Escala da minilinha: 0 a 25% no mínimo, para que probabilidades baixas mostrem a tendência em vez de uma linha reta. */
const sparkMax = (v: Array<number | null>) => Math.min(1, Math.max(0.25, ...v.map((x) => x ?? 0)));
const row = 'row-hover flex w-full items-center gap-3 rounded-[10px] text-left text-foreground hover:bg-muted';
const ageText = (min: number | null) => (min == null ? 'sem dados' : min < 60 ? `há ${min} min` : `há ${Math.round(min / 60)} h`);
const clockText = (iso: string | null | undefined) => formatRecife(iso)?.slice(-5).replace(':', 'h') ?? null;

/** Painel esquerdo "Agora na RMR" do mapa (Main.dc.html): contagem, abas Pontos críticos e Sensores, fontes. */
export const LivePanel: React.FC<Props> = ({
  points, sensors, summary, summaryFailed, liveStatus, lastSuccessAt, overview, selectedFloodPointId, selectedSensorId, onFloodPointClick, onSensorClick, canSeeDataHealth, className,
  alertaBySlug, stations = [], onStationClick, selectedStationId, officialWarnings = [],
}) => {
  const [tab, setTab] = useState<Tab>('points');
  const sorted = useMemo(() => sortPoints(points), [points]);
  const horizon = points.map((p) => p.floodPrediction?.horizonHours).find((h): h is number => h != null);
  const allUnknown = points.length > 0 && points.every((p) => (p.floodPrediction?.riskLevel ?? 'UNKNOWN') === 'UNKNOWN');
  const experimental = points.some((p) => showsExperimentalLabel(p.floodPrediction));
  const reason = points.map((p) => p.floodPrediction?.degradationReason).find(Boolean);
  const time = clockText(summary?.computedAt ?? lastSuccessAt);

  const [now] = useState(() => Date.now());
  const unified = useMemo(() => stations.filter((s) => s.canonicalId != null)
    .map((s) => ({ s, ...stationRowText(s, now) }))
    .sort((a, b) => (a.s.name ?? '').localeCompare(b.s.name ?? '')), [stations, now]);
  const aliasCodes = useMemo(() => liveAliasCodes(stations), [stations]);
  const sensorRows = useMemo(() => {
    // O pluviômetro do feed que é apelido de uma estação unificada sai: a estação aparece uma vez, na lista unificada.
    const own = sensors.filter((s) => !(s.source === 'APAC/Cemaden' && s.code != null && aliasCodes.has(s.code)));
    const rows = own.map((s) => {
      const cfg = getSensorConfig(s);
      const fresh = getDataFreshness(s.timestamp);
      const stale = fresh.status === 'stale';
      const state = riverState(s.value, s);
      return {
        key: s.id, sensor: s, stale, dot: cfg.color,
        name: s.stationName || s.sensorId,
        // Fonte e janela declaradas: o número é a ÚLTIMA leitura do feed (não um acumulado).
        sub: state ? `Nível · ${state} · ${feedSourceText(s.source)}` : `${cfg.label} · última leitura · ${feedSourceText(s.source)} · ${ageText(fresh.minutesAgo)}`,
        value: stale || s.value == null ? '—' : `${fmtNum(s.value)} ${s.unit ?? ''}`.trim(),
        river: s.riverAlertLevel != null || s.riverPreAlertLevel != null || s.riverFloodLevel != null,
      };
    });
    return rows.sort((a, b) => Number(b.river) - Number(a.river) || a.name.localeCompare(b.name));
  }, [sensors, aliasCodes]);
  const tideRow = overview.tideNow ? 1 : 0;
  const chip = (slug: string) => alertChipOf(alertaBySlug?.get(slug), true);

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={tab === id}
      aria-controls={`painel-${id}`}
      onClick={() => setTab(id)}
      className={cn('h-8 rounded-lg text-[13px] leading-4 font-bold text-foreground', tab === id ? 'bg-card' : 'bg-transparent hover:bg-card/60')}
    >
      {label}
    </button>
  );

  return (
    <Panel as="aside" aria-label="Situação agora" className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex flex-col gap-3 border-b border-border px-4 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="m-0 whitespace-nowrap text-xl leading-[26px] font-extrabold tracking-[-0.01em]">Agora na RMR</h1>
          <span className="text-xs leading-4 text-muted-foreground" data-live-status={liveStatus}>
            {horizon != null ? `previsão para ${horizon} h` : 'previsão'}
            {time && <> · <span className="font-mono">{time}</span></>}
          </span>
        </div>
        <RiskCountTiles summary={summary} failed={summaryFailed} />
        {(liveStatus === 'error' || liveStatus === 'closed') && (
          <p role="status" className="m-0 text-xs leading-4 text-warning">Sem atualização ao vivo: os números podem estar atrasados.</p>
        )}
        {allUnknown ? (
          <div role="status" className="flex gap-2 rounded-[10px] border-2 border-dashed border-risk-unknown-edge p-2.5 text-[13px] leading-[18px]">
            <strong className="flex-none">Previsão indisponível.</strong>
            <span className="text-muted-foreground">Motivo: {degradationText(reason)}. Isto não significa risco baixo.</span>
          </div>
        ) : (
          experimental && <ExperimentalBadge />
        )}
        <OfficialWarningBadge warnings={officialWarnings} />
        <div role="tablist" aria-label="Tipo de lista" className="grid grid-cols-2 gap-1 rounded-[10px] bg-muted p-1">
          {tabBtn('points', `Pontos críticos · ${points.length}`)}
          {tabBtn('sensors', `Sensores · ${unified.length + sensorRows.length + tideRow}`)}
        </div>
      </div>

      {tab === 'points' ? (
        <ul id="painel-points" role="tabpanel" aria-labelledby="tab-points" className="scroll m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 p-2">
          {sorted.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">Nenhum ponto crítico retornado pela API.</li>}
          {sorted.map((p) => {
            const level = p.floodPrediction?.riskLevel;
            const v = getRiskVisual(level);
            const pct = formatProbability(level, p.floodPrediction?.floodProbability);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => onFloodPointClick(p)} aria-pressed={selectedFloodPointId === p.id} className={cn(row, 'p-2', selectedFloodPointId === p.id && 'bg-secondary')}>
                  <RiskBadge level={level} variant="marker" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm leading-5 font-bold">{p.name}</span>
                    {alertaBySlug ? (
                      <span data-testid="point-alert-line" className="truncate text-xs leading-4 text-muted-foreground">
                        <span className={cn('font-bold', CHIP_TONE_CLASS[chip(p.slug).tone].split(' ').filter((c) => c.startsWith('text-')).join(' '))}>{chip(p.slug).label}</span>
                        {` · risco${(p.floodPrediction?.horizonHours ?? horizon) != null ? ` ${p.floodPrediction?.horizonHours ?? horizon} h` : ''}: ${v.label}`}
                      </span>
                    ) : (
                      <span className="truncate text-xs leading-4 text-muted-foreground">{p.municipality ?? 'Recife'} · {v.label}</span>
                    )}
                  </span>
                  <span className={cn('flex flex-col items-end', v.text)}>
                    <span className="font-mono text-[15px] leading-5 font-bold">{pct ?? '—'}</span>
                    <Sparkline values={overview.probabilities.get(p.slug) ?? []} max={sparkMax(overview.probabilities.get(p.slug) ?? [])} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul id="painel-sensors" role="tabpanel" aria-labelledby="tab-sensors" className="scroll m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 p-2">
          {overview.tideNow && (
            <li>
              <div className={cn(row, 'px-2 py-[9px] hover:bg-transparent')}>
                <span aria-hidden="true" className="box-border size-2.5 flex-none rounded-full bg-sand" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm leading-5 font-bold">Maré · Recife</span>
                  <span className="truncate text-xs leading-4 text-muted-foreground">Maré prevista · tábua da DHN</span>
                </span>
                <span className="font-mono text-sm leading-5 font-semibold">{fmtNum(overview.tideNow.v, 2)} m</span>
              </div>
            </li>
          )}
          {unified.map(({ s, value, sub, missing }) => (
            <li key={`st-${s.canonicalId}`}>
              <button type="button" data-testid="unified-station" onClick={() => onStationClick?.(s.canonicalId as string)} aria-pressed={selectedStationId === s.canonicalId}
                className={cn(row, 'px-2 py-[9px]', selectedStationId === s.canonicalId && 'bg-secondary')}>
                <span aria-hidden="true" className={cn('box-border size-2.5 flex-none rounded-full', missing ? 'border-2 border-dashed border-risk-unknown-edge bg-transparent' : 'bg-primary')} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm leading-5 font-bold">{s.name ?? s.canonicalId}</span>
                  <span className={cn('truncate text-xs leading-4', missing ? 'text-warning' : 'text-muted-foreground')}>{sub}</span>
                </span>
                <span className={cn('font-mono text-sm leading-5 font-semibold', missing && 'text-warning')}>{value}</span>
              </button>
            </li>
          ))}
          {sensorRows.map((r) => (
            <li key={r.key}>
              <button type="button" onClick={() => onSensorClick(r.sensor)} aria-pressed={selectedSensorId === r.key} className={cn(row, 'px-2 py-[9px]', selectedSensorId === r.key && 'bg-secondary')}>
                <span aria-hidden="true" className={cn('box-border size-2.5 flex-none rounded-full', r.stale ? 'border-2 border-dashed border-risk-unknown-edge bg-transparent' : r.dot)} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm leading-5 font-bold">{r.name}</span>
                  <span className={cn('truncate text-xs leading-4', r.stale ? 'text-warning' : 'text-muted-foreground')}>{r.sub}</span>
                </span>
                <span className="font-mono text-sm leading-5 font-semibold">{r.value}</span>
              </button>
            </li>
          ))}
          {sensors.length === 0 && unified.length === 0 && !overview.tideNow && <li className="p-4 text-center text-xs text-muted-foreground">Nenhum sensor retornado pela API.</li>}
          <li><Link to="/sensores" className="row-hover mt-1 flex h-9 items-center rounded-[10px] px-2 text-xs leading-4 text-primary hover:bg-muted">Ver a página de sensores</Link></li>
        </ul>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs leading-4 text-muted-foreground">
        <span>APAC · ANA · Cemaden · Open-Meteo · DHN</span>
        {canSeeDataHealth && <Link to="/admin/dados" className="shrink-0 text-primary hover:text-foreground">Saúde dos dados</Link>}
      </div>
    </Panel>
  );
};
