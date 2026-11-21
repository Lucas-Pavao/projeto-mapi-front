import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui/panel';
import { InfoTip } from '@/components/InfoTip';
import { cn } from '@/lib/utils';
import { FloodCountTiles } from '@/features/alagamento/components/FloodCountTiles';
import { ExperimentalTag } from '@/features/alagamento/components/RegressaoCard';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { DOT_CLASS, TEXT_CLASS, countByLevel, listLineOf } from '@/features/alagamento/utils/alagamentoText';
import type { LiveStatus } from '@/features/live/hooks/useLiveStream';
import type { FloodPointResponseDTO, SensorResponseDTO } from '../types';
import { getDataFreshness, getSensorConfig } from '../utils/sensor';
import { fmtNum, riverState, sortPoints } from '../utils/overview';
import { formatRecife } from '../utils/datetime';
import type { useMapOverview } from '../hooks/useMapOverview';
import type { StationAccumulation } from '../schemas/measuredRain.schema';
import { feedSourceText, liveAliasCodes, stationRowText } from '../utils/measuredRain';
import { OfficialWarningBadge } from '@/features/warnings/components/OfficialWarningBadge';
import type { OfficialWarning } from '@/features/warnings/schemas/officialWarning.schema';

type Overview = ReturnType<typeof useMapOverview>;
type Tab = 'points' | 'sensors';

interface Props {
  points: FloodPointResponseDTO[];
  sensors: SensorResponseDTO[];
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
  /** Alerta por regressão de cada ponto (só ADMIN, modo sombra): contagem, linha da lista e versões do rodapé. */
  alagamentoBySlug?: ReadonlyMap<string, AlagamentoPonto>;
  /** Leitura do alerta falhou: contagem em traço, nunca zero. */
  alagamentoFailed?: boolean;
  /** Só ADMIN abre "Saúde dos dados" (ADR 0010). */
  canSeeDataHealth: boolean;
  className?: string;
}

const row = 'row-hover flex w-full items-center gap-3 rounded-[10px] text-left text-foreground hover:bg-muted';
const ageText = (min: number | null) => (min == null ? 'sem dados' : min < 60 ? `há ${min} min` : `há ${Math.round(min / 60)} h`);
const clockText = (iso: string | null | undefined) => formatRecife(iso)?.slice(-5).replace(':', 'h') ?? null;

/** Painel esquerdo "Agora na RMR" do mapa (Main.dc.html): contagem, abas Pontos críticos e Sensores, fontes. */
export const LivePanel: React.FC<Props> = ({
  points, sensors, liveStatus, lastSuccessAt, overview, selectedFloodPointId, selectedSensorId, onFloodPointClick, onSensorClick, canSeeDataHealth, className,
  alagamentoBySlug, alagamentoFailed = false, stations = [], onStationClick, selectedStationId, officialWarnings = [],
}) => {
  const [tab, setTab] = useState<Tab>('points');
  const sorted = useMemo(() => sortPoints(points, alagamentoBySlug), [points, alagamentoBySlug]);
  const any = alagamentoBySlug ? [...alagamentoBySlug.values()][0] : undefined;
  const lastEval = alagamentoBySlug ? [...alagamentoBySlug.values()].map((a) => a.evaluatedAt).filter(Boolean).sort().pop() : null;
  const time = clockText(lastEval ?? lastSuccessAt);
  const counts = alagamentoBySlug && !alagamentoFailed ? countByLevel(points.map((p) => p.slug), alagamentoBySlug) : null;
  const versions = any ? `${Object.entries(any.modelVersions).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ')}${any.codeVersion ? ` · commit ${any.codeVersion.slice(0, 7)}` : ''}` : null;

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
            alerta em 1, 3 e 6 h
            {time && <> · <span className="font-mono">{time}</span></>}
          </span>
        </div>
        {alagamentoBySlug && <FloodCountTiles counts={counts} />}
        {(liveStatus === 'error' || liveStatus === 'closed') && (
          <p role="status" className="m-0 text-xs leading-4 text-warning">Sem atualização ao vivo: os números podem estar atrasados.</p>
        )}
        <ExperimentalTag className="self-start" />
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
            const line = alagamentoBySlug ? listLineOf(alagamentoBySlug.get(p.slug)) : null;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => onFloodPointClick(p)} aria-pressed={selectedFloodPointId === p.id} className={cn(row, 'p-2', selectedFloodPointId === p.id && 'bg-secondary')}>
                  <span aria-hidden="true" className={cn('box-border size-3 flex-none rounded-full', line ? DOT_CLASS[line.tone] : 'bg-muted-foreground', line?.tone === 'muted' && 'border-2 border-dashed border-muted-foreground bg-transparent')} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm leading-5 font-bold">{p.name}</span>
                    {line ? (
                      <span data-testid="point-alert-line" className="truncate text-xs leading-4 text-muted-foreground">
                        <span className={cn('font-bold', TEXT_CLASS[line.tone])}>{line.label}</span>{` · ${line.sheet}`}
                      </span>
                    ) : (
                      <span className="truncate text-xs leading-4 text-muted-foreground">{p.municipality ?? 'Recife'}</span>
                    )}
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
        <span className="flex items-center gap-1.5">
          APAC · Cemaden/MCTIC · DHN · Open-Meteo
          <InfoTip text={`DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC. ANA (rios), DHN (maré), Open-Meteo (tempo).${versions ? ` Alerta: ${versions}.` : ''}`} />
        </span>
        {canSeeDataHealth && <Link to="/admin/dados" className="shrink-0 text-primary hover:text-foreground">Saúde dos dados</Link>}
      </div>
    </Panel>
  );
};
