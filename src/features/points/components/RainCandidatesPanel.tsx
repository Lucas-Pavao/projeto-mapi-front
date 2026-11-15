import React from 'react';
import { Link } from 'react-router-dom';
import { Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { cn } from '@/lib/utils';
import type { UseQueryResult } from '@tanstack/react-query';
import type { RainCandidates } from '../schemas/rain-candidates.schema';
import { candidateStatus, candidateValue, distanceText, ROLE_TAG } from '../utils/rainCandidates';

/** B3: estações até 5 km e qual delas deu a chuva do ponto (maior valor entre as válidas; reprovada no mês não entra). */
export const RainCandidatesPanel: React.FC<{ query: UseQueryResult<RainCandidates> }> = ({ query }) => {
  const data = query.data;
  return (
    <Panel aria-label="Chuva medida no ponto" data-testid="rain-candidates" className="min-h-0 gap-2">
      <div className="flex items-baseline justify-between">
        <PanelTitle>Chuva do ponto · estações até {data ? distanceText(data.radiusM) : '5 km'}</PanelTitle>
        <Link to="/sensores" className="text-[12px] text-primary hover:text-foreground">Estações</Link>
      </div>
      {query.isError && <p role="alert" className="m-0 text-[12px] leading-4 text-warning">Não foi possível carregar as estações candidatas.</p>}
      {query.isPending && <p className="m-0 text-[12px] leading-4 text-muted-foreground">Carregando estações…</p>}
      {data && data.candidates.length === 0 && <p className="m-0 text-[12px] leading-4 text-muted-foreground">Nenhuma estação do Cemaden dentro do raio: o ponto fica sem dado de chuva medida.</p>}
      {data?.candidates.map((c) => {
        const used = c.role === 'USED';
        const out = c.role === 'EXCLUDED';
        return (
          <div key={c.stationId} data-role={c.role}
               className={cn('grid grid-cols-[14px_1fr_auto_auto] items-center gap-2 rounded-lg border px-2 py-1.5 text-[12px] leading-4', used ? 'border-primary bg-primary/10' : 'border-border', out && 'opacity-70')}>
            <span aria-hidden="true" className={cn('size-2.5 rounded-full', used ? 'bg-primary' : out ? 'bg-destructive' : 'bg-chart-3')} />
            <span><strong>{c.name}</strong> <span className="text-muted-foreground">· {distanceText(c.distanceM)} · {candidateStatus(c)}</span></span>
            <span className="font-mono">{candidateValue(c)}</span>
            <span className={cn('text-[11px] font-bold', used ? 'text-primary' : out ? 'text-destructive' : 'text-muted-foreground')}>{ROLE_TAG[c.role]}</span>
          </div>
        );
      })}
      <p className="m-0 mt-auto text-[11px] leading-[15px] text-muted-foreground">
        Vale o maior valor entre as válidas; reprovada no mês não entra; hora sem valor fica sem dado, nunca zero (ADRs 0018, 0022, 0023).
        {data && <> {data.attribution}.</>}
      </p>
    </Panel>
  );
};
