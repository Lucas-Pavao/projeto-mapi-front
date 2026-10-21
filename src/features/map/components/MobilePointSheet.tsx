import React, { useId, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { RISK_MEANING, getRiskVisual, showsExperimentalLabel } from '@/components/risk/risk';
import { scaleLinear } from '@/components/charts/chartMath';
import { usePredictionSeries } from '@/features/points/hooks/usePredictionSeries';
import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';
import { PredictionUnavailableNotice } from './PredictionUnavailableNotice';
import { fmtNum } from '../utils/overview';
import { formatRecife } from '../utils/datetime';

interface Props {
  point: FloodPointResponseDTO;
  status: PreciseDataResponse | null;
  isFetchingStatus: boolean;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onReport: () => void;
}

const W = 354;
const H = 90;
const nav = 'flex size-11 items-center justify-center rounded-[10px] border border-border bg-transparent text-foreground';
const tile = 'rounded-xl bg-muted p-3';
const tileLabel = 'text-[11px] text-muted-foreground';
const tileValue = 'font-mono text-lg leading-6 font-extrabold';

/** Probabilidade ao longo do dia: bandas de risco, área e linha (o dado nulo abre buraco) e a marca de agora. */
const ProbabilityChart: React.FC<{ slug: string }> = ({ slug }) => {
  const series = usePredictionSeries(slug, 24);
  const m = useMemo(() => {
    const items = [...(series.data?.items ?? [])].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
    const from = Date.parse(series.data?.from ?? '') || 0;
    const to = Date.parse(series.data?.to ?? '') || 1;
    const x = scaleLinear(from, to, 0, W);
    const y = scaleLinear(0, 1, H, 0);
    const runs: Array<Array<[number, number]>> = [];
    let cur: Array<[number, number]> = [];
    for (const i of items) {
      const t = Date.parse(i.issuedAt);
      if (i.riskLevel === 'UNKNOWN' || i.probability == null || !Number.isFinite(t)) {
        if (cur.length) runs.push(cur);
        cur = [];
      } else cur.push([x(t), y(i.probability)]);
    }
    if (cur.length) runs.push(cur);
    const vals = items.filter((i) => i.riskLevel !== 'UNKNOWN' && i.probability != null).map((i) => i.probability as number);
    return {
      lines: runs.filter((r) => r.length > 1).map((r) => r.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')),
      areas: runs.filter((r) => r.length > 1).map((r) => `${r[0][0].toFixed(1)},${H} ${r.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')} ${r[r.length - 1][0].toFixed(1)},${H}`),
      nowX: x(to),
      label: vals.length ? `Probabilidade nas últimas 24 horas: de ${Math.round(Math.min(...vals) * 100)}% a ${Math.round(Math.max(...vals) * 100)}%` : 'Probabilidade nas últimas 24 horas: sem previsão válida na janela',
    };
  }, [series.data]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={m.label} className="block h-[90px] w-full">
      <rect x={0} y={0} width={W} height={18} fill="var(--risk-high)" opacity={0.12} />
      <rect x={0} y={18} width={W} height={27} fill="var(--risk-moderate)" opacity={0.1} />
      {m.areas.map((p) => <polygon key={p.slice(0, 30)} points={p} fill="var(--primary)" opacity={0.2} />)}
      {m.lines.map((p) => <polyline key={p.slice(0, 30)} points={p} fill="none" stroke="var(--primary)" strokeWidth={2.5} />)}
      <line x1={m.nowX} x2={m.nowX} y1={0} y2={H} stroke="var(--foreground)" strokeWidth={1.5} />
    </svg>
  );
};

/** Detalhe do ponto no celular (MobilePonto.dc.html): folha de até 640 px sobre o mapa, com anterior/próximo e "Reportar cenário no local". */
export const MobilePointSheet: React.FC<Props> = ({ point, status, isFetchingStatus, index, total, onPrev, onNext, onBack, onReport }) => {
  const titleId = useId();
  const prediction = status?.floodPrediction ?? point.floodPrediction;
  const precise = status?.preciseData;
  const level = prediction?.riskLevel;
  const unknown = !getRiskVisual(level).showsProbability;
  const valid = formatRecife(prediction?.validUntil)?.slice(-5).replace(':', 'h');
  const dash = isFetchingStatus ? '…' : '—';
  const rain3h = precise?.historicalAggregates?.rain3h;
  const tide = precise?.tideHeightTabuaMare;
  const now = precise?.precipitation;
  const contributors = [...(prediction?.contributors ?? [])].sort((a, b) => b.contribution - a.contribution).slice(0, 3);
  const clock = formatRecife(new Date().toISOString())?.slice(-5).replace(':', 'h');
  return (
    <ModalDialog label="Detalhe do ponto" labelledBy={titleId} onClose={onBack} className="pointer-events-none fixed inset-0 z-[60]">
      <button type="button" onClick={onBack} aria-label="Voltar ao mapa" className="pointer-events-auto absolute left-3 top-3 flex size-12 items-center justify-center rounded-[14px] border border-border bg-popover text-foreground shadow-elevation-overlay">
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <span className="pointer-events-auto absolute right-3 top-3 mt-2 flex h-8 items-center gap-1.5 rounded-full border border-border bg-popover px-3 font-mono text-xs font-bold">
        <span aria-hidden="true" className="live-dot size-2 rounded-full bg-success" />
        {clock}
      </span>
      <section className="scroll pointer-events-auto absolute inset-x-0 bottom-0 box-border flex h-[min(640px,calc(100dvh-204px))] flex-col gap-3.5 rounded-t-[18px] border-t border-border bg-card px-[18px] pb-5 pt-2 shadow-elevation-overlay">
        <span aria-hidden="true" className="h-[5px] w-11 shrink-0 self-center rounded-full bg-input" />
        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrev} aria-label="Ponto anterior" className={nav}><ChevronLeft className="size-[18px]" aria-hidden="true" /></button>
          <div className="flex-1 text-center text-xs text-muted-foreground">ponto {index + 1} de {total}</div>
          <button type="button" onClick={onNext} aria-label="Próximo ponto" className={nav}><ChevronRight className="size-[18px]" aria-hidden="true" /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <RiskBadge level={level} probability={prediction?.floodProbability} className="self-start" />
          <h1 id={titleId} className="m-0 text-2xl leading-[30px] font-extrabold">{point.name}</h1>
          <p className="m-0 text-[13px] text-muted-foreground">{point.municipality ?? 'Recife'}{valid ? ` · válida até ${valid}` : ''}</p>
          {showsExperimentalLabel(prediction) && <ExperimentalBadge className="self-start" />}
        </div>
        <ProbabilityChart slug={point.slug} />
        {unknown ? <PredictionUnavailableNotice prediction={prediction} className="space-y-0.5 text-[15px] leading-[22px]" /> : <p className="m-0 text-[15px] leading-[22px]">{RISK_MEANING[level ?? 'UNKNOWN']}</p>}
        <div className="grid grid-cols-2 gap-2">
          <div className={tile}><div className={tileLabel}>Chuva 3 h</div><div className={tileValue}>{rain3h != null ? `${fmtNum(rain3h)} mm` : dash}</div></div>
          <div className={tile}><div className={tileLabel}>Chuva agora</div><div className={tileValue}>{now != null ? `${fmtNum(now)} mm/h` : dash}</div></div>
          <div className={tile}><div className={tileLabel}>Maré</div><div className={tileValue}>{tide != null ? `${fmtNum(tide, 2)} m` : dash}</div></div>
          <div className={tile}><div className={tileLabel}>Mecanismo</div><div className="text-[13px] leading-[17px] font-bold">{point.description ?? '—'}</div></div>
        </div>
        {contributors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold tracking-[.06em] text-muted-foreground">O QUE MAIS PESOU</span>
            {contributors.map((c) => (
              <div key={c.featureId} className="flex flex-col gap-[3px]">
                <div className="flex justify-between text-[13px]"><span>{c.label}</span><span className="font-mono font-bold">{Math.round(c.contribution * 100)}%</span></div>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, c.contribution * 100))}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={onReport} className="flex h-[52px] flex-none items-center justify-center rounded-[10px] bg-primary text-[15px] font-extrabold text-primary-foreground">
          Reportar cenário no local
        </button>
      </section>
    </ModalDialog>
  );
};
