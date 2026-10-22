import React from 'react';
import { TideDatumNotice } from '@/components/TideDatumNotice';
import { SPRING_M, hm, minutesAbove, type DayExtreme, type DaySummary } from '../utils/tideTable';

const m2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const W = 720;
const H = 300;

interface TideDayProps {
  title: string;
  curve: Array<number | null>;
  summary: DaySummary | null;
  /** Preamares e baixa-mares do dia, na ordem da tábua. */
  extremes: DayExtreme[];
  /** Minuto do dia em Recife, se o dia selecionado é hoje. */
  nowMinute: number | null;
}

/** Curva do dia selecionado (interpolada entre os pontos da tábua), as preamares e baixa-mares, resumo e a explicação do refluxo. */
export const TideDay: React.FC<TideDayProps> = ({ title, curve, summary, extremes, nowMinute }) => {
  const vals = curve.filter((v): v is number => v != null);
  const mn = Math.min(-0.2, (vals.length ? Math.min(...vals) : 0) - 0.2);
  const mx = Math.max(2.6, (vals.length ? Math.max(...vals) : 0) + 0.2);
  const y = (v: number) => (H - ((v - mn) / (mx - mn)) * H).toFixed(1);
  const x = (i: number) => ((i / (curve.length - 1)) * W).toFixed(1);
  const segs: string[][] = [];
  curve.forEach((v, i) => {
    if (v == null) { segs.push([]); return; }
    if (segs.length === 0) segs.push([]);
    segs[segs.length - 1].push(`${x(i)},${y(v)}`);
  });
  const lines = segs.filter((s) => s.length > 1);
  const y2 = y(SPRING_M);
  const above = minutesAbove(curve, SPRING_M);
  const curX = nowMinute == null ? null : ((nowMinute / 1440) * W).toFixed(1);
  const curIdx = nowMinute == null ? -1 : Math.min(curve.length - 1, Math.round((nowMinute / 1440) * (curve.length - 1)));
  const curV = curIdx >= 0 ? curve[curIdx] : null;
  const stats: Array<[string, string]> = summary
    ? [[`${m2(summary.range)} m`, 'amplitude do dia'], [curve.some((v) => v != null) ? hm(above) : '—', `acima de ${m2(SPRING_M).replace(',00', ',0')} m`]]
    : [];
  const clock = (min: number) => hm(min).replace(/^(\d)h/, '0$1h');
  const ex = (min: number) => ((min / 1440) * W).toFixed(1);
  return (
    <section aria-label="Curva do dia" className="flex min-h-0 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4 lg:col-span-7">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">curva interpolada entre os pontos da tábua</span>
      </div>
      <div className="relative min-h-56 flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Maré ao longo do dia selecionado" className="absolute top-0 left-0 w-[calc(100%-44px)] h-[calc(100%-20px)] overflow-visible">
          <rect x="0" y="0" width={W} height={y2} fill="var(--warning)" opacity="0.08" />
          <line x1="0" x2={W} y1={y2} y2={y2} stroke="var(--warning)" strokeWidth="1.5" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          {lines.map((s, i) => (
            <React.Fragment key={i}>
              <polygon points={`${s[0].split(',')[0]},${H} ${s.join(' ')} ${s[s.length - 1].split(',')[0]},${H}`} fill="var(--sand)" opacity="0.25" />
              <polyline points={s.join(' ')} fill="none" stroke="var(--sand)" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </React.Fragment>
          ))}
          {extremes.map((e) => (
            <circle key={`${e.kind}-${e.min}`} cx={ex(e.min)} cy={y(e.v)} r="4" fill={e.kind === 'PREAMAR' ? 'var(--sand)' : 'var(--card)'} stroke="var(--sand)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          ))}
          {curX && <line x1={curX} x2={curX} y1="0" y2={H} stroke="var(--foreground)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
          {curX && curV != null && <ellipse cx={curX} cy={y(curV)} rx="5" ry="7" fill="var(--sand)" stroke="var(--card)" strokeWidth="2" />}
        </svg>
        <span className="absolute right-0 font-mono text-[11px] leading-4 font-bold text-warning" style={{ top: `calc((100% - 20px) * ${(1 - (SPRING_M - mn) / (mx - mn)).toFixed(3)} - 8px)` }}>{m2(SPRING_M)}</span>
        <div aria-hidden="true" className="absolute right-11 bottom-0 left-0 flex justify-between font-mono text-[11px] leading-4 text-muted-foreground"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div>
      </div>
      {extremes.length > 0 && (
        <ol aria-label="Preamares e baixa-mares do dia" className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
          {extremes.map((e) => (
            <li key={`${e.kind}-${e.min}`} className="rounded-[10px] bg-muted p-2.5">
              <div className="font-mono text-[17px] leading-[22px] font-bold">{m2(e.v)} m</div>
              <div className="text-[11px] text-muted-foreground">{e.kind === 'PREAMAR' ? 'preamar' : 'baixa-mar'} · {clock(e.min)}</div>
            </li>
          ))}
        </ol>
      )}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {stats.map(([v, l]) => <div key={l} className="rounded-[10px] bg-muted p-2.5"><div className="font-mono text-[17px] leading-[22px] font-bold">{v}</div><div className="text-[11px] text-muted-foreground">{l}</div></div>)}
        </div>
      )}
      <p className="m-0 text-[13px] leading-[18px]"><strong>Por que importa:</strong> com a maré acima da saída da galeria, a água da chuva não escoa e pode voltar pela rede (refluxo). É o mecanismo dominante na Av. Agamenon Magalhães (Derby).</p>
      <TideDatumNotice compact />
    </section>
  );
};
