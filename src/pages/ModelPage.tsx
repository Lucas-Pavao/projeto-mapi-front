import React from 'react';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { useModelEvaluation } from '@/features/model/hooks/useModelEvaluation';
import { EvaluationView, ModelHeader } from '@/features/model/components/EvaluationView';
import { parseEvaluationResult } from '@/features/model/schemas/model.schema';
import { httpStatus } from '@/lib/apiError';

const SUBTITLE = 'Avaliação F1 pré-registrada · os números vêm do arquivo congelado, sem recálculo';

export const ModelPage: React.FC = () => {
  const query = useModelEvaluation();
  const unavailable = query.isError && httpStatus(query.error) === 503;
  const hasContent = query.data !== undefined && Object.keys(query.data.result).length > 0;
  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full">
      {!hasContent && <ModelHeader subtitle={SUBTITLE} />}
      {unavailable ? (
        <>
          <EmptyState title="Avaliação indisponível." hint="O servidor não entrega o arquivo quando ele está ausente ou o hash não confere. Avise a equipe técnica." />
        </>
      ) : (
        <QueryState
          query={query}
          what="a avaliação"
          isEmpty={(d) => Object.keys(d.result).length === 0}
          emptyTitle="A avaliação veio vazia."
        >
          {(d) => <EvaluationView evaluation={d} result={parseEvaluationResult(d.result)} />}
        </QueryState>
      )}
    </div>
  );
};
export default ModelPage;
