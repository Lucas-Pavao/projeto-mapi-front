import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { useModelEvaluation } from '@/features/model/hooks/useModelEvaluation';
import { EvaluationView } from '@/features/model/components/EvaluationView';
import { parseEvaluationResult } from '@/features/model/schemas/model.schema';
import { httpStatus } from '@/lib/apiError';

export const ModelPage: React.FC = () => {
  const query = useModelEvaluation();
  const unavailable = query.isError && httpStatus(query.error) === 503;
  return (
    <PageShell
      title="Modelo"
      description="Avaliação congelada do modelo de previsão. Os números vêm do arquivo de avaliação, sem recálculo."
      actions={<Link to="/modelo/simulador" className="inline-flex h-11 items-center rounded-lg border border-border bg-background px-3 text-body-strong text-foreground hover:bg-muted md:h-8">Abrir o simulador do balde</Link>}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ExperimentalBadge />
        <p className="text-caption text-muted-foreground">Enquanto o modelo for NOT_VALIDATED, toda classe de risco no MAPi é experimental.</p>
      </div>
      {unavailable ? (
        <EmptyState title="Avaliação indisponível." hint="O servidor não entrega o arquivo quando ele está ausente ou o hash não confere. Avise a equipe técnica." />
      ) : (
        <QueryState query={query} what="a avaliação" isEmpty={(d) => Object.keys(d.result).length === 0} emptyTitle="A avaliação veio vazia.">
          {(d) => <EvaluationView evaluation={d} result={parseEvaluationResult(d.result)} />}
        </QueryState>
      )}
    </PageShell>
  );
};
export default ModelPage;
