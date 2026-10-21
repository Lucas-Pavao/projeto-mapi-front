import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { formatProbability, getRiskVisual } from '@/components/risk/risk';
import { cn } from '@/lib/utils';
import { PanelTitle } from '@/features/operacao/components/Panel';
import type { FloodPointResponseDTO } from '@/features/map/types';

/** Lista lateral de pontos críticos: marcador de risco, nome, bairro e probabilidade (UNKNOWN sem %). */
export const PointList: React.FC<{ points: FloodPointResponseDTO[] | undefined; current: string }> = ({ points, current }) => (
  <aside aria-label="Pontos críticos" className="flex min-h-0 w-full shrink-0 flex-col gap-1 rounded-2xl border border-border bg-card p-3 lg:w-[280px]">
    <Link to="/map" className="flex items-center gap-1.5 px-1.5 pb-2.5 pt-1 text-[13px] text-primary no-underline hover:text-foreground">
      <ChevronLeft className="size-4" aria-hidden="true" />Voltar ao mapa
    </Link>
    <PanelTitle className="mx-1.5 mb-1.5">Pontos críticos</PanelTitle>
    <ul className="m-0 flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0 max-lg:max-h-72">
      {(points ?? []).filter((p) => p.active).map((p) => {
        const level = p.floodPrediction?.riskLevel;
        const pct = formatProbability(level, p.floodPrediction?.floodProbability);
        const on = p.slug === current;
        return (
          <li key={p.slug}>
            <Link
              to={`/pontos/${p.slug}`}
              aria-current={on ? 'page' : undefined}
              className={cn('flex items-center gap-2.5 rounded-[10px] p-2 text-left text-foreground no-underline hover:bg-muted', on && 'bg-secondary')}
            >
              <RiskBadge level={level} variant="marker" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-bold leading-[18px]">{p.name}</span>
                <span className="truncate text-[12px] leading-4 text-muted-foreground">{p.basinName ?? p.municipality ?? ''}</span>
              </span>
              <span className={cn('font-mono text-[14px] font-bold leading-[18px]', getRiskVisual(level).text)}>{pct ?? '—'}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  </aside>
);
