import React from 'react';
import { OnlyInDetail } from '@/lib/detailMode';
import type { AlagamentoPonto } from '../schemas/alagamento.schema';
import { HCRIT_CM, fmt1 } from '../utils/alagamentoText';

type Step = NonNullable<AlagamentoPonto['explanation']>['decomposition'][number];

const W = 640;
const H = 90;

/**
 * Lâmina a cada 10 min na página do ponto (prancha "PontoDetalhe"): gráfico baixo e sem rótulos, esticado na largura
 * (preserveAspectRatio none: nenhum texto dentro do SVG para não deformar). Tracejado: 15 cm; linha vertical: agora.
 */
export const SheetSparkline: React.FC<{ steps: readonly Step[] }> = ({ steps }) => {
  if (steps.length === 0) return <p className="m-0 text-xs text-muted-foreground">sem decomposição neste ciclo</p>;
  const n = steps.length;
  const smax = Math.max(HCRIT_CM * 1.6, ...steps.map((s) => s.sheetCm ?? 0)) * 1.05;
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - 2 - (H - 4) * (v / smax);
  const pts = steps.map((s, i) => `${x(i).toFixed(1)},${y(s.sheetCm ?? 0).toFixed(1)}`);
  const now = steps.findIndex((s) => s.kind === 'previsto');
  const nowX = now < 0 ? null : x(now);
  const maxSheet = Math.max(...steps.map((s) => s.sheetCm ?? 0));
  return (
    <div className="flex min-h-[60px] flex-1 flex-col gap-1">
      <svg data-testid="balde-lamina" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block min-h-[60px] w-full flex-1" role="img"
        aria-label={`Lâmina estimada a cada 10 min, antes e depois de agora: máxima ${fmt1(maxSheet)} cm; alagamento a partir de ${HCRIT_CM} cm`}>
        <line x1={0} x2={W} y1={y(HCRIT_CM)} y2={y(HCRIT_CM)} className="stroke-risk-high-edge" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} className="fill-destructive/15" />
        <polyline points={pts.join(' ')} fill="none" className="stroke-destructive" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        {nowX != null && <line x1={nowX} x2={nowX} y1={0} y2={H} className="stroke-foreground" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
      </svg>
      <OnlyInDetail>
        <p data-testid="balde-legenda" className="m-0 text-[11px] leading-[15px] text-muted-foreground">Lâmina do balde (cm), cenário provável. Esquerda: chuva medida; direita da linha: chuva prevista. Tracejado: 15 cm.</p>
      </OnlyInDetail>
    </div>
  );
};
