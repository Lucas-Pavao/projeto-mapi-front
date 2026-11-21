import React from 'react';
import { OnlyInDetail } from '@/lib/detailMode';
import type { AlagamentoPonto } from '../schemas/alagamento.schema';
import { HCRIT_CM, fmt1 } from '../utils/alagamentoText';

type Step = NonNullable<AlagamentoPonto['explanation']>['decomposition'][number];

const W = 444;
const PAD = { l: 34, r: 8, t: 8, b: 18 };

/**
 * Balde a cada 10 min (5.4): 3 h medidas antes de agora e o horizonte servido depois. Em cima, entrada de água (barras),
 * saída pela drenagem (linha) e capacidade da galeria (tracejado), em m³/h; embaixo, a lâmina com a linha de 15 cm.
 */
export const BaldeChart: React.FC<{ steps: readonly Step[]; capacityM3H: number | null | undefined }> = ({ steps, capacityM3H }) => {
  if (steps.length === 0) return <p className="m-0 text-sm text-muted-foreground">sem decomposição neste ciclo</p>;
  const n = steps.length;
  const iw = W - PAD.l - PAD.r;
  const x = (i: number) => PAD.l + (i + 0.5) * (iw / n);
  const bw = Math.max(1, iw / n - 1.5);
  const now = steps.findIndex((s) => s.kind === 'previsto');
  const nowX = now < 0 ? null : PAD.l + now * (iw / n);
  // vazões
  const H1 = 130;
  const qmax = Math.max(1, capacityM3H ?? 0, ...steps.map((s) => Math.max(s.inflowM3H ?? 0, s.outflowM3H ?? 0))) * 1.1;
  const y1 = (v: number) => PAD.t + (H1 - PAD.t - PAD.b) * (1 - v / qmax);
  const out = steps.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y1(s.outflowM3H ?? 0).toFixed(1)}`).join(' ');
  // lâmina
  const H2 = 110;
  const smax = Math.max(HCRIT_CM * 1.4, ...steps.map((s) => s.sheetCm ?? 0)) * 1.05;
  const y2 = (v: number) => PAD.t + (H2 - PAD.t - PAD.b) * (1 - v / smax);
  const sheet = steps.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y2(s.sheetCm ?? 0).toFixed(1)}`).join(' ');
  const maxIn = Math.max(...steps.map((s) => s.inflowM3H ?? 0));
  const maxSheet = Math.max(...steps.map((s) => s.sheetCm ?? 0));
  const tick = (i: number) => `${steps[i].minutesFromNow > 0 ? '+' : ''}${Math.round(steps[i].minutesFromNow / 60)} h`;
  const ticks = [0, now < 0 ? n - 1 : now, n - 1].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <div className="flex flex-col gap-2">
      <svg data-testid="balde-vazoes" viewBox={`0 0 ${W} ${H1}`} className="w-full" role="img"
        aria-label={`Entrada de água máxima ${fmt1(maxIn)} m³/h; capacidade da galeria ${fmt1(capacityM3H) ?? 'sem dado'} m³/h; ${n} passos de 10 min`}>
        <text x={2} y={PAD.t + 8} className="fill-muted-foreground text-[9px]">m³/h</text>
        {steps.map((s, i) => (
          <rect key={i} x={x(i) - bw / 2} width={bw} y={y1(s.inflowM3H ?? 0)} height={Math.max(0, H1 - PAD.b - y1(s.inflowM3H ?? 0))}
            className={s.kind === 'medido' ? 'fill-primary' : 'fill-primary/45'} />
        ))}
        <path d={out} fill="none" className="stroke-success" strokeWidth={2} />
        {capacityM3H != null && <line x1={PAD.l} x2={W - PAD.r} y1={y1(capacityM3H)} y2={y1(capacityM3H)} className="stroke-warning" strokeDasharray="5 4" strokeWidth={1.5} />}
        {nowX != null && <line x1={nowX} x2={nowX} y1={PAD.t} y2={H1 - PAD.b} className="stroke-foreground" strokeWidth={1} />}
        {ticks.map((i) => <text key={i} x={x(i)} y={H1 - 4} textAnchor="middle" className="fill-muted-foreground text-[9px]">{i === now ? 'agora' : tick(i)}</text>)}
      </svg>
      <svg data-testid="balde-lamina" viewBox={`0 0 ${W} ${H2}`} className="w-full" role="img"
        aria-label={`Lâmina máxima ${fmt1(maxSheet)} cm; alagamento a partir de ${HCRIT_CM} cm`}>
        <text x={2} y={PAD.t + 8} className="fill-muted-foreground text-[9px]">cm</text>
        <line x1={PAD.l} x2={W - PAD.r} y1={y2(HCRIT_CM)} y2={y2(HCRIT_CM)} className="stroke-destructive" strokeWidth={1.5} />
        <text x={PAD.l - 4} y={y2(HCRIT_CM) + 3} textAnchor="end" className="fill-destructive text-[9px]">15</text>
        <path d={sheet} fill="none" className="stroke-primary" strokeWidth={2.5} />
        {nowX != null && <line x1={nowX} x2={nowX} y1={PAD.t} y2={H2 - PAD.b} className="stroke-foreground" strokeWidth={1} />}
      </svg>
      <OnlyInDetail>
        <p data-testid="balde-legenda" className="m-0 text-xs leading-4 text-muted-foreground">
          Barras: entrada de água por passo de 10 min (cheia = chuva medida; clara = chuva prevista espalhada por igual). Linha verde: saída pela
          galeria. Tracejado laranja: capacidade da galeria (IDF, TR 5 anos, 10 min). Embaixo: lâmina na rua; linha vermelha em 15 cm.
        </p>
      </OnlyInDetail>
    </div>
  );
};
