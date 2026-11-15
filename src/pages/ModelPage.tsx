import React, { useState } from 'react';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { useModelEvaluation } from '@/features/model/hooks/useModelEvaluation';
import { EvaluationView, ModelHeader } from '@/features/model/components/EvaluationView';
import { ModelV2View } from '@/features/model/components/ModelV2View';
import { loadModelCard } from '@/features/model/schemas/modelCard.schema';
import { parseEvaluationResult } from '@/features/model/schemas/model.schema';
import { httpStatus } from '@/lib/apiError';
import { cn } from '@/lib/utils';

const SUBTITLE = 'Avaliação F1 pré-registrada · os números vêm do arquivo congelado, sem recálculo';
const CARD = loadModelCard();

type Tab = 'v2' | 'f1';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'v2', label: 'xgb_v2 · rótulo sintético' },
  { id: 'f1', label: 'F1 · balde × rótulo real' },
];

const Tabs: React.FC<{ tab: Tab; onTab: (t: Tab) => void }> = ({ tab, onTab }) => (
  <div role="tablist" aria-label="Avaliações" className="flex gap-0.5 self-start rounded-[10px] bg-muted p-1">
    {TABS.map((t) => (
      <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={tab === t.id} aria-controls="model-panel" onClick={() => onTab(t.id)}
        className={cn('h-8 cursor-pointer rounded-lg border-0 px-3 text-xs font-bold', tab === t.id ? 'bg-card text-foreground' : 'bg-transparent text-muted-foreground')}>
        {t.label}
      </button>
    ))}
  </div>
);

const F1Tab: React.FC = () => {
  const query = useModelEvaluation();
  const unavailable = query.isError && httpStatus(query.error) === 503;
  const hasContent = query.data !== undefined && Object.keys(query.data.result).length > 0;
  return (
    <>
      {!hasContent && <ModelHeader subtitle={SUBTITLE} />}
      {unavailable ? (
        <EmptyState title="Avaliação indisponível." hint="O servidor não entrega o arquivo quando ele está ausente ou o hash não confere. Avise a equipe técnica." />
      ) : (
        <QueryState query={query} what="a avaliação" isEmpty={(d) => Object.keys(d.result).length === 0} emptyTitle="A avaliação veio vazia.">
          {(d) => <EvaluationView evaluation={d} result={parseEvaluationResult(d.result)} />}
        </QueryState>
      )}
    </>
  );
};

export const ModelPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('v2');
  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full">
      {tab === 'v2' && (
        <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">Modelo em produção · {CARD?.modelVersion ?? 'xgb_v2'}</h1>
            <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">Chuva medida (Cemaden) · limiares escolhidos na validação · dados do cartão do modelo</p>
          </div>
        </header>
      )}
      <Tabs tab={tab} onTab={setTab} />
      <div id="model-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex min-h-0 flex-1 flex-col gap-4">
        {tab === 'f1' ? <F1Tab /> : CARD ? <ModelV2View card={CARD} /> : <EmptyState title="Cartão do modelo inválido." hint="O arquivo xgb_v2_model_card.json não bate com o contrato. Avise a equipe técnica." />}
      </div>
    </div>
  );
};
export default ModelPage;
