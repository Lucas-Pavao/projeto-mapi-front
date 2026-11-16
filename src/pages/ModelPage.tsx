import React, { useState } from 'react';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { useModelEvaluation } from '@/features/model/hooks/useModelEvaluation';
import { EvaluationView, ModelHeader } from '@/features/model/components/EvaluationView';
import { ModelV2View } from '@/features/model/components/ModelV2View';
import { CompareV2V3 } from '@/features/model/components/CompareV2V3';
import { RainForecastView } from '@/features/model/components/RainForecastView';
import { loadRainCard } from '@/features/model/schemas/rainForecast.schema';
import { loadModelCardV3 } from '@/features/model/schemas/modelCardV3.schema';
import { loadModelCard } from '@/features/model/schemas/modelCard.schema';
import { parseEvaluationResult } from '@/features/model/schemas/model.schema';
import { httpStatus } from '@/lib/apiError';
import { cn } from '@/lib/utils';

const SUBTITLE = 'Avaliação F1 pré-registrada · os números vêm do arquivo congelado, sem recálculo';
const CARD = loadModelCard();
const CARD_V3 = loadModelCardV3();
const RAIN_CARD = loadRainCard();

type Tab = 'v3' | 'chuva' | 'v2' | 'f1';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'v3', label: 'v2 × v3 · rótulo sintético' },
  { id: 'chuva', label: 'Previsão de chuva · dado medido' },
  { id: 'v2', label: 'xgb_v2 · rótulo sintético' },
  { id: 'f1', label: 'F1 · balde × rótulo real' },
];

const Tabs: React.FC<{ tab: Tab; onTab: (t: Tab) => void }> = ({ tab, onTab }) => (
  <div role="tablist" aria-label="Avaliações" className="flex shrink-0 gap-0.5 self-start rounded-[10px] bg-muted p-1 [header_&]:self-center">
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
  const [tab, setTab] = useState<Tab>('v3');
  const title = tab === 'chuva' ? `Previsão de chuva · ${RAIN_CARD?.modelVersion ?? 'rain_v1'}` : tab === 'v3' ? `Modelo em produção · ${CARD_V3?.modelVersion ?? 'v3'}` : `Modelo anterior · ${CARD?.modelVersion ?? 'xgb_v2'}`;
  const subtitle = tab === 'chuva' ? 'Chuva das próximas 1, 3 e 6 h no ponto · conferida todo dia contra a chuva medida (Cemaden)' : tab === 'v3'
    ? `Alagamento nas próximas ${CARD_V3?.horizonHours ?? 6} h · chuva medida (Cemaden) · v2 ao lado para comparar`
    : 'Chuva medida (Cemaden) · limiares escolhidos na validação · dados do cartão do modelo';
  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:min-h-full">
      {tab !== 'f1' && (
        <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">{title}</h1>
            <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">{subtitle}</p>
          </div>
          {/* Protótipo (ModeloV2): as abas ficam no cabeçalho, à direita. */}
          <Tabs tab={tab} onTab={setTab} />
        </header>
      )}
      {tab === 'f1' && <Tabs tab={tab} onTab={setTab} />}
      <div id="model-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex min-h-0 flex-1 flex-col gap-4">
        {tab === 'f1' ? <F1Tab />
          : tab === 'chuva' ? (RAIN_CARD ? <RainForecastView card={RAIN_CARD} /> : <EmptyState title="Cartão do modelo de chuva inválido." hint="O arquivo rain_v1_card.json não bate com o contrato. Avise a equipe técnica." />)
          : tab === 'v3' ? (CARD && CARD_V3 ? <CompareV2V3 v2={CARD} v3={CARD_V3} /> : <EmptyState title="Cartão do modelo inválido." hint="v3_model_card.json ou xgb_v2_model_card.json não bate com o contrato. Avise a equipe técnica." />)
          : CARD ? <ModelV2View card={CARD} /> : <EmptyState title="Cartão do modelo inválido." hint="O arquivo xgb_v2_model_card.json não bate com o contrato. Avise a equipe técnica." />}
      </div>
    </div>
  );
};
export default ModelPage;
