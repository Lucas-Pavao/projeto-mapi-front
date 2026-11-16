import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { num } from '@/features/operacao/utils/format';
import { RIVER_STATE_LABEL, riverState, trendText, type RiverLevels, type RiverState } from '../utils/river';

const EDGE: Record<RiverState, string> = { NORMAL: 'border-primary text-primary', PRE_ALERT: 'border-warning text-warning', ALERT: 'border-risk-moderate text-risk-moderate-text', FLOOD: 'border-risk-high-edge text-risk-high-text', NO_READING: 'border-dashed border-muted-foreground text-muted-foreground' };
const TOP: Record<RiverState, string> = { NORMAL: 'border-t-primary', PRE_ALERT: 'border-t-warning', ALERT: 'border-t-risk-moderate', FLOOD: 'border-t-risk-high-edge', NO_READING: 'border-t-muted-foreground' };

interface Props {
  name: string;
  riverName?: string | null;
  stationId: string;
  levelM: number | null;
  /** cm/h; null = a série não cobre a última hora. */
  trendCmH: number | null;
  levels: RiverLevels;
  onClose?: () => void;
}

/** Card da régua do rio (APAC): nível, tendência e as cotas oficiais. O rio fica fora do modelo xgb_v2. */
export const RiverCard: React.FC<Props> = ({ name, riverName, stationId, levelM, trendCmH, levels, onClose }) => {
  const state = riverState(levelM, levels);
  const hasLevels = levels.pre != null || levels.alert != null || levels.flood != null;
  const scale = Math.max(levels.flood ?? 0, levels.alert ?? 0, levels.pre ?? 0, levelM ?? 0) * 1.2 || 1;
  const pos = (v: number) => `${(Math.min(1, v / scale) * 100).toFixed(1)}%`;
  const p1 = levels.pre != null ? pos(levels.pre) : null;
  const p2 = levels.alert != null ? pos(levels.alert) : null;
  const p3 = levels.flood != null ? pos(levels.flood) : null;
  const a = p1 ?? p2 ?? p3 ?? '100%';
  const b = p3 ?? p2 ?? '100%';
  const stops = `var(--risk-low) 0 ${a}, var(--risk-moderate) ${a} ${b}, var(--risk-high) ${b} 100%`;
  return (
    <section role="dialog" aria-label={`Régua do rio ${riverName ?? name}`} data-state={state}
      className={cn('flex w-[300px] max-w-full min-h-0 shrink overflow-y-auto overscroll-contain scroll [scrollbar-gutter:stable] flex-col gap-2.5 rounded-[14px] border border-t-4 border-border bg-popover py-3.5 pl-3.5 pr-1 text-foreground shadow-elevation-overlay', TOP[state])}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span data-testid="river-state" className={cn('inline-flex h-[22px] items-center rounded-full border-[1.5px] px-2 text-[11px] font-bold leading-[14px]', EDGE[state])}>{RIVER_STATE_LABEL[state]}</span>
          <p className="m-0 mt-1.5 text-base font-extrabold leading-[22px]">{riverName ? `${/^rio\b/i.test(riverName) ? riverName : `Rio ${riverName}`} · ${name}` : name}</p>
          <p className="m-0 text-xs text-muted-foreground">Régua de nível APAC · <span className="font-mono">{stationId}</span></p>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Fechar card do rio" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" aria-hidden="true" /></button>}
      </div>
      <div className="flex items-baseline gap-2">
        <span data-testid="river-level" className={cn('font-mono text-[26px] font-extrabold leading-8', levelM == null && 'text-muted-foreground')}>{levelM == null ? '—' : `${num(levelM, 2)} m`}</span>
        <span data-testid="river-trend" className="text-xs text-muted-foreground">{levelM == null ? 'sem leitura' : trendText(trendCmH)}</span>
      </div>
      {hasLevels ? (
        <>
          <div className="relative h-3 rounded-full" role="img" aria-label={`Nível ${levelM == null ? 'sem leitura' : `${num(levelM, 2)} m`} na régua: pré-alerta ${num(levels.pre, 2)}, alerta ${num(levels.alert, 2)}, inundação ${num(levels.flood, 2)} m`} style={{ background: `linear-gradient(90deg, ${stops})` }}>
            {levelM != null && <span data-testid="river-marker" className="absolute -inset-y-1 -ml-px w-[3px] rounded-sm bg-foreground" style={{ left: pos(levelM) }} />}
          </div>
          <div className="flex flex-wrap justify-between gap-x-2 font-mono text-[10px] leading-[14px] text-muted-foreground" data-testid="river-cotas">
            <span>pré {num(levels.pre, 2)}</span><span>alerta {num(levels.alert, 2)}</span><span>inundação {num(levels.flood, 2)} m</span>
          </div>
        </>
      ) : <p className="m-0 text-xs text-muted-foreground">A APAC não informou as cotas desta régua: só o nível é mostrado.</p>}
      <p className="m-0 text-xs leading-[17px] text-muted-foreground">Fica fora do modelo xgb_v2: é mostrado para a operação, não entra na probabilidade dos pontos.</p>
      <Link to="/sensores" className="flex h-10 items-center justify-center rounded-[10px] bg-primary text-[13px] font-bold text-primary-foreground no-underline hover:text-primary-foreground hover:opacity-90">Ver série do rio</Link>
    </section>
  );
};
