import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PanelTitle } from '@/features/operacao/components/Panel';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { TEXT_CLASS, fmt1, listLineOf } from '@/features/alagamento/utils/alagamentoText';
import { FloodLevelBadge } from '@/features/alagamento/components/FloodLevelBadge';

const SHEET_CLASS = { ALERTA: 'text-risk-high-text', ATENCAO: 'text-risk-moderate-text', SEM_ALERTA: 'text-risk-low-text', SEM_DADO: 'text-risk-unknown-text' } as const;

/**
 * Lista lateral de pontos críticos (5.5, 5.10): nome, bairro e, para o ADMIN, o nível do alerta por regressão com a lâmina
 * de agora. Sem porcentagem. Visitante: só nome e bairro.
 */
export const PointList: React.FC<{ points: FloodPointResponseDTO[] | undefined; current: string; alagamentoBySlug?: ReadonlyMap<string, AlagamentoPonto> }> = ({ points, current, alagamentoBySlug }) => (
  <aside aria-label="Pontos críticos" className="flex min-h-0 w-full shrink-0 flex-col gap-1 rounded-2xl border border-border bg-card p-3 lg:w-[17.5rem]">
    <Link to="/map" className="flex items-center gap-1.5 px-1.5 pb-2.5 pt-1 text-[13px] text-primary no-underline hover:text-foreground">
      <ChevronLeft className="size-4" aria-hidden="true" />Voltar ao mapa
    </Link>
    <PanelTitle className="mx-1.5 mb-1.5">Pontos críticos</PanelTitle>
    <ul className="m-0 flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0 max-lg:max-h-72">
      {(points ?? []).filter((p) => p.active).map((p) => {
        const a = alagamentoBySlug?.get(p.slug);
        const line = alagamentoBySlug ? listLineOf(a) : null;
        const on = p.slug === current;
        return (
          <li key={p.slug}>
            <Link
              to={`/pontos/${p.slug}`}
              aria-current={on ? 'page' : undefined}
              className={cn('flex items-center gap-2.5 rounded-[10px] p-2 text-left text-foreground no-underline hover:bg-muted', on && 'bg-secondary')}
            >
              <FloodLevelBadge level={alagamentoBySlug ? (a?.level ?? 'SEM_DADO') : null} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] font-bold leading-[18px]">{p.name}</span>
                <span className="text-[12px] leading-4 text-muted-foreground">
                  {line ? <span className={cn('font-bold', TEXT_CLASS[line.tone])}>{line.label}</span> : p.basinName ?? p.municipality ?? ''}
                </span>
              </span>
              {alagamentoBySlug && (
                <span data-testid="point-sheet-now" className={cn('flex-none font-mono text-sm font-bold', SHEET_CLASS[a?.level ?? 'SEM_DADO'])}>{a?.hNowCm == null ? '—' : `${fmt1(a.hNowCm)} cm`}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  </aside>
);
