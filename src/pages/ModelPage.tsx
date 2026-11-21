import React, { useState } from 'react';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { useModelEvaluation } from '@/features/model/hooks/useModelEvaluation';
import { EvaluationView, ModelHeader } from '@/features/model/components/EvaluationView';
import { RainForecastView } from '@/features/model/components/RainForecastView';
import { RegressaoView } from '@/features/model/components/RegressaoView';
import { AlertaConferenciaPanel } from '@/features/alerta/components/AlertaConferenciaPanel';
import { useAuth } from '@/hooks/useAuth';
import { OnlyInDetail } from '@/lib/detailMode';
import { hasRole, parseRole } from '@/lib/roles';
import { loadRainCard } from '@/features/model/schemas/rainForecast.schema';
import { loadRegressaoCard } from '@/features/model/schemas/regressaoCard.schema';
import { parseEvaluationResult } from '@/features/model/schemas/model.schema';
import { httpStatus } from '@/lib/apiError';
import { cn } from '@/lib/utils';

const SUBTITLE = 'Avaliação F1 pré-registrada · os números vêm do arquivo congelado, sem recálculo';
const RAIN_CARD = loadRainCard();
const REG_CARD = loadRegressaoCard();

type Tab = 'regressao' | 'chuva' | 'alerta' | 'f1';
/** Abas da tela Modelo (5.7). Saíram "v2 × v3 · rótulo sintético" e "xgb_v2 · rótulo sintético" (decisão de 20/11). */
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'regressao', label: 'Alagamento por regressão' },
  { id: 'chuva', label: 'Previsão de chuva · dado medido' },
  { id: 'alerta', label: 'Alerta por ponto · conferência' },
  { id: 'f1', label: 'Avaliação F1' },
];
const seg = 'h-8 cursor-pointer rounded-lg border-0 px-3 text-xs font-bold';

const Tabs: React.FC<{ tab: Tab; onTab: (t: Tab) => void; admin: boolean }> = ({ tab, onTab, admin }) => (
  <div role="tablist" aria-label="Avaliações" className="flex shrink-0 flex-wrap gap-0.5 self-start rounded-[10px] bg-muted p-1 [header_&]:self-center">
    {/* Alerta por ponto em modo sombra: só ADMIN (ADR 0026 da API). */}
    {TABS.filter((t) => admin || t.id !== 'alerta').map((t) => (
      <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={tab === t.id} aria-controls="model-panel" onClick={() => onTab(t.id)}
        className={cn(seg, tab === t.id ? 'bg-card text-foreground' : 'bg-transparent text-muted-foreground')}>
        {t.label}
      </button>
    ))}
  </div>
);

const F1Tab: React.FC<{ nav: React.ReactNode }> = ({ nav }) => {
  const query = useModelEvaluation();
  const unavailable = query.isError && httpStatus(query.error) === 503;
  const hasContent = query.data !== undefined && Object.keys(query.data.result).length > 0;
  return (
    <>
      {!hasContent && <ModelHeader subtitle={SUBTITLE} nav={nav} />}
      {unavailable ? (
        <EmptyState title="Avaliação indisponível." hint="O servidor não entrega o arquivo quando ele está ausente ou o hash não confere. Avise a equipe técnica." />
      ) : (
        <QueryState query={query} what="a avaliação" isEmpty={(d) => Object.keys(d.result).length === 0} emptyTitle="A avaliação veio vazia.">
          {(d) => <EvaluationView evaluation={d} result={parseEvaluationResult(d.result)} nav={nav} />}
        </QueryState>
      )}
    </>
  );
};

const TITLE: Record<Tab, string> = {
  regressao: 'Alagamento por regressão · experimental',
  chuva: `Previsão de chuva · ${RAIN_CARD?.modelVersion ?? 'rain_v1'}`,
  alerta: 'Alerta por ponto · em teste',
  f1: 'Avaliação F1',
};
const SUB: Record<Tab, string> = {
  regressao: 'Chuva prevista (rain_v1) → balde a 10 min → regra fixa de 15 cm · alerta em 1, 3 e 6 h',
  chuva: 'Chuva das próximas 1, 3 e 6 h no ponto · conferida todo dia contra a chuva medida (Cemaden)',
  alerta: 'Conferência diária dos alertas da véspera contra a chuva medida (Cemaden) · modo sombra',
  f1: SUBTITLE,
};

export const ModelPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('regressao');
  const { user } = useAuth();
  const admin = hasRole(parseRole(user?.role), 'ADMIN');
  const nav = <Tabs tab={tab} onTab={setTab} admin={admin} />;
  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:min-h-full">
      {tab !== 'f1' && (
        <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">{TITLE[tab]}</h1>
            <OnlyInDetail><p className="m-0 text-[13px] leading-[18px] text-muted-foreground">{SUB[tab]}</p></OnlyInDetail>
          </div>
          {nav}
        </header>
      )}
      <div id="model-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex min-h-0 flex-1 flex-col gap-4">
        {tab === 'f1' ? <F1Tab nav={nav} />
          : tab === 'alerta' && admin ? <AlertaConferenciaPanel />
          : tab === 'chuva' ? (RAIN_CARD ? <RainForecastView card={RAIN_CARD} /> : <EmptyState title="Cartão do modelo de chuva inválido." hint="O arquivo rain_v1_card.json não bate com o contrato. Avise a equipe técnica." />)
          : REG_CARD ? <RegressaoView card={REG_CARD} /> : <EmptyState title="Cartão do alerta por regressão inválido." hint="O arquivo regressao_card.json não bate com o contrato. Avise a equipe técnica." />}
      </div>
    </div>
  );
};
export default ModelPage;
