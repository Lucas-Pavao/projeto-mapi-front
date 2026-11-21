import React from 'react';
import { InfoTip } from '@/components/InfoTip';
import { useAuth } from '@/hooks/useAuth';
import { OnlyInDetail } from '@/lib/detailMode';
import { hasRole, parseRole } from '@/lib/roles';
import { useAlagamentoPontos } from '../hooks/useAlagamentoPontos';
import { AlertaRegressao, FloodChip } from './AlertaRegressao';
import { ExperimentalTag } from './RegressaoCard';
import { RegressaoDetalhes } from './RegressaoDetalhes';

export const VISITOR_TEXT = 'O alerta de alagamento por regressão é experimental: enquanto a validação não for aprovada, só o administrador vê.';

/** Selo do visitante: o nível não aparece, só a etiqueta com ⓘ. */
export const VisitorChip: React.FC = () => (
  <span data-testid="flood-chip" data-level="VISITOR" className="inline-flex min-h-7 items-center gap-1.5 self-start rounded-full border border-warning/60 bg-warning/10 px-2.5 text-sm font-bold text-warning">
    Alerta experimental<InfoTip text={VISITOR_TEXT} side="bottom" />
  </span>
);

/**
 * Bloco do alerta por regressão para a folha do celular e o popup do mapa (seções 5.2 e 5.6): o mesmo conteúdo do card
 * (selo, lâmina e chuva agora, previsão de lâmina; técnico só em Detalhes). Visitante: só a etiqueta. Leitura em falha ou
 * sem cálculo tem estado próprio, nunca "Sem alerta".
 */
export const PointRegressaoBlock: React.FC<{ slug: string }> = ({ slug }) => {
  const { user } = useAuth();
  const isAdmin = hasRole(parseRole(user?.role), 'ADMIN');
  const q = useAlagamentoPontos(isAdmin);
  if (!isAdmin) return <VisitorChip />;
  const ponto = q.data?.find((a) => a.slug === slug);
  if (q.isLoading || !ponto) {
    const text = q.isLoading ? 'Lendo o alerta de alagamento…' : q.isError ? 'Não foi possível ler o alerta de alagamento agora.' : 'Alerta de alagamento ainda não calculado para este ponto.';
    return (
      <div data-testid="regressao-bloco" data-state={q.isLoading ? 'loading' : q.isError ? 'error' : 'absent'} className="flex flex-col gap-2">
        <span data-testid="flood-chip" data-level="SEM_DADO" className="inline-flex min-h-7 items-center gap-1.5 self-start rounded-full border border-dashed border-muted-foreground/50 bg-muted px-2.5 text-sm font-bold text-muted-foreground">
          {q.isLoading ? 'Lendo…' : 'Alerta sem leitura'}
          <InfoTip text="Sem leitura não é sem alerta: o nível deste ponto é desconhecido até o próximo ciclo." side="bottom" />
        </span>
        <p className="m-0 text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }
  return (
    <div data-testid="regressao-bloco" data-level={ponto.level} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FloodChip ponto={ponto} />
        {ponto.experimental && <ExperimentalTag />}
      </div>
      <AlertaRegressao ponto={ponto} showChip={false} />
      <OnlyInDetail><RegressaoDetalhes ponto={ponto} /></OnlyInDetail>
    </div>
  );
};
