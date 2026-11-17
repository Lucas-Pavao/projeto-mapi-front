import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { SyntheticWarning } from '@/components/risk/SyntheticWarning';
import { num } from '@/features/operacao/utils/format';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import { contributorRows } from '@/features/points/utils/contributors';
import { distanceText, missingAccText } from '@/features/points/utils/rainCandidates';
import type { RainCandidates } from '@/features/points/schemas/rain-candidates.schema';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';
import type { FloodPointResponseDTO } from '../../types';
import { PointProbabilityChart } from './PointProbabilityChart';
import { isUnknownState, meaningOf, pointCardState, reasonOf } from '../utils/pointView';
import { cn } from '@/lib/utils';
import { PointAlertPanel } from '@/features/alerta/components/PointAlertPanel';
import { alertChipOf, CHIP_EDGE_CLASS, CHIP_TONE_CLASS } from '@/features/alerta/utils/alertaText';
import type { AlertaPonto } from '@/features/alerta/schemas/alerta.schema';

interface Props {
  point: FloodPointResponseDTO;
  series: readonly PredictionSummary[];
  rain?: RainCandidates;
  now: number;
  onClose?: () => void;
  onOpenAnalysis?: () => void;
  /** Só ADMIN vê o alerta por ponto (modo sombra, ADR 0026); os demais veem "Alerta em teste". */
  isAdmin?: boolean;
  alerta?: AlertaPonto | null;
  alertaLoading?: boolean;
  alertaError?: boolean;
}

type Tab = 'alerta' | 'experimental';

const TOP: Record<string, string> = { HIGH: 'border-t-risk-high', MEDIUM: 'border-t-risk-moderate', LOW: 'border-t-risk-low', UNKNOWN: 'border-t-risk-unknown-edge' };

/** Card-resumo do ponto crítico (5 estados). A classe vem da API; o front não reclassifica e UNKNOWN nunca mostra porcentagem. */
export const PointCard: React.FC<Props> = ({ point, series, rain, now, onClose, onOpenAnalysis, isAdmin = false, alerta, alertaLoading = false, alertaError = false }) => {
  const [tab, setTab] = useState<Tab>('alerta');
  const id = useId();
  const chip = alertChipOf(alertaLoading || alertaError ? null : alerta, isAdmin);
  const p = point.floodPrediction;
  const state = pointCardState(p);
  const unknown = isUnknownState(state);
  const level = p?.riskLevel ?? 'UNKNOWN';
  const used = rain?.candidates.find((c) => c.stationId === rain.usedStationId);
  const stationText = used && rain?.valueMm != null ? `${used.name} · ${distanceText(used.distanceM)}` : 'nenhuma estação';
  const reason = reasonOf(state, p, used?.name ?? null);
  const top = contributorRows(p?.contributors, 1, p?.imputedFeatures)[0];
  const agg = point.liveData?.historicalAggregates;
  const tide = point.tideHeight ?? point.liveData?.tideHeight ?? null;
  const tiles: Array<{ l: string; v: string; s: string; warn: boolean }> = [
    { l: 'Chuva agora', v: rain?.valueMm != null && used ? `${num(rain.valueMm, 1)} mm/h` : '—', s: stationText, warn: rain?.valueMm == null },
    { l: 'Chuva 3 h', v: agg?.rain3h != null ? `${num(agg.rain3h, 1)} mm` : missingAccText(used != null), s: 'medida · Cemaden', warn: agg?.rain3h == null },
    { l: 'Maré', v: tide != null ? `${num(tide, 2)} m` : '—', s: point.tideSource === 'HARMONIC' ? 'maré · reserva harmônica' : point.tideUnit ?? 'DHN (NR)', warn: false },
  ];
  const tilesEl = (
    <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((t) => (
          <div key={t.l} data-testid="tile" className="rounded-lg bg-muted px-2 py-[7px]">
            <div className="text-[10px] leading-[13px] text-muted-foreground">{t.l}</div>
            <div className={cn('font-mono text-[13px] font-bold leading-[18px]', t.warn && 'text-warning')}>{t.v}</div>
            <div className="truncate text-[10px] leading-[13px] text-muted-foreground">{t.s}</div>
          </div>
        ))}
      </div>
  );
  return (
    <section role="dialog" aria-label={`Resumo do ponto ${point.name}`} data-state={state}
      className={cn('flex w-[320px] max-w-full min-h-0 shrink overflow-y-auto overscroll-contain scroll [scrollbar-gutter:stable] flex-col gap-2.5 rounded-[14px] border border-t-4 border-border bg-popover py-3.5 pl-3.5 pr-1 text-foreground shadow-elevation-overlay', tab === 'alerta' ? CHIP_EDGE_CLASS[chip.tone] : TOP[level] ?? TOP.UNKNOWN, (tab === 'alerta' ? chip.dashed : unknown) && '[border-top-style:dashed]')}>
      <div className="flex items-center justify-between gap-2">
        <span data-testid="alerta-chip" data-chip={chip.kind} className={cn('inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-bold', CHIP_TONE_CLASS[chip.tone], chip.dashed && 'border-dashed')}>{chip.label}</span>
        {onClose && <button type="button" onClick={onClose} aria-label="Fechar resumo do ponto" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" aria-hidden="true" /></button>}
      </div>
      <div>
        <p className="m-0 text-base font-extrabold leading-[22px]">{point.name}</p>
        <p className="m-0 text-xs leading-4 text-muted-foreground">{point.municipality ?? 'Recife'}{point.description ? ` · ${point.description}` : ''}</p>
      </div>
      <div role="tablist" aria-label="Alerta ou experimental" className="flex gap-1 self-start rounded-lg border border-border p-0.5">
        {(['alerta', 'experimental'] as const).map((t) => (
          <button key={t} type="button" role="tab" id={`${id}-${t}`} aria-selected={tab === t} aria-controls={`${id}-p-${t}`}
            className={cn('h-7 rounded-md px-2.5 text-xs font-bold', tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')} onClick={() => setTab(t)}>
            {t === 'alerta' ? 'Alerta' : 'Experimental'}
          </button>
        ))}
      </div>
      {tab === 'alerta' ? (
        <div role="tabpanel" id={`${id}-p-alerta`} aria-labelledby={`${id}-alerta`} className="flex flex-col gap-2 pr-2.5">
          {isAdmin ? (
            <PointAlertPanel alerta={alerta} pointName={point.name} isLoading={alertaLoading} isError={alertaError} />
          ) : (
            <p data-testid="alerta-oculto" className="m-0 rounded-lg border border-dashed border-border bg-muted p-2.5 text-xs leading-4 text-muted-foreground">
              O alerta de chuva por ponto está em teste e ainda não é oficial. Enquanto isso, veja a chuva medida e o aviso oficial do INMET no painel "Agora na RMR".
            </p>
          )}
          {!isAdmin && tilesEl}
        </div>
      ) : (
        <div role="tabpanel" id={`${id}-p-experimental`} aria-labelledby={`${id}-experimental`} data-testid="aba-experimental" className="flex flex-col gap-2.5">
          <p data-testid="rotulo-sintetico" className="m-0 rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-[11px] font-bold text-warning">
            Risco de alagamento em 6 h do logreg_v3, treinado com rótulo SINTÉTICO: não validado contra alagamento real.
          </p>
          <div><RiskBadge level={level} probability={p?.floodProbability} /></div>
      <p className="m-0 text-[13px] leading-[18px]">{meaningOf(state)}</p>
      <p data-testid="point-reason" className="m-0 rounded-lg bg-muted px-2 py-1.5 text-xs leading-4"><strong>{reason.label}</strong> {reason.text}</p>
      <PointProbabilityChart items={series} now={now} width={292} height={56} fallbackThresholds={p?.riskThresholds} />
      {tilesEl}
      {top && !unknown && (
        <div data-testid="top-contributor" className="flex justify-between gap-2 text-xs leading-4">
          <span className="text-muted-foreground">Mais pesou: <strong className="text-foreground">{top.label}</strong>{top.valueText ? ` (${top.valueText})` : ''}</span>
          <span className="font-mono font-bold">{top.ppText}</span>
        </div>
      )}
      {!unknown && <SyntheticWarning prediction={p} className="text-[11px] leading-[15px]" />}
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={onOpenAnalysis} className="h-10 flex-1 cursor-pointer rounded-[10px] border-0 bg-primary text-[13px] font-bold text-primary-foreground hover:opacity-90">Análise completa</button>
        <Link to={`/pontos/${point.slug}`} aria-label="Abrir a página do ponto" className="flex size-10 items-center justify-center rounded-[10px] border border-border text-foreground"><ExternalLink className="size-4" aria-hidden="true" /></Link>
      </div>
      <p className="m-0 text-[10px] leading-[13px] text-muted-foreground">
        {unknown
          ? `Sem previsão válida agora${p?.lastValidIssuedAt ? ` · última válida ${formatHoraCurta(p.lastValidIssuedAt)}` : ''}${p?.modelVersion ? ` · ${p.modelVersion}` : ''}`
          : `Emitida ${formatHoraCurta(p?.issuedAt) ?? '—'}${p?.validUntil ? ` · válida até ${formatHoraCurta(p.validUntil)}` : ''}${p?.modelVersion ? ` · ${p.modelVersion}` : ''}${p?.rainSource === 'MEASURED' ? ' · chuva medida' : ''}`}
      </p>
    </section>
  );
};
