import React from 'react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { RISK_MEANING, degradationText, showsExperimentalLabel } from '@/components/risk/risk';
import { formatRecife } from '@/features/map/utils/datetime';
import type { PredictionSummary } from '../schemas/prediction.schema';

/**
 * Risco atual do ponto. Classe sempre com ícone e rótulo (RiskBadge) e rótulo experimental ao lado.
 * UNKNOWN: sem porcentagem, com o motivo da degradação e a última previsão válida.
 */
export const RiskNowCard: React.FC<{ prediction: PredictionSummary | null }> = ({ prediction }) => {
  if (!prediction) {
    return (
      <section aria-label="Risco atual" className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-title text-foreground">Risco atual</h2>
        <p className="mt-2 text-body text-muted-foreground">Nenhuma previsão registrada para este ponto nas últimas 24 h.</p>
      </section>
    );
  }
  const unknown = prediction.riskLevel === 'UNKNOWN';
  return (
    <section aria-label="Risco atual" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-title text-foreground">Risco atual</h2>
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge level={prediction.riskLevel} probability={prediction.probability} className="text-sm" />
        {showsExperimentalLabel(prediction) && <ExperimentalBadge />}
      </div>
      <p className="text-body text-muted-foreground">{RISK_MEANING[prediction.riskLevel]}</p>
      {unknown && (
        <dl className="grid gap-1 rounded-lg border border-dashed border-border p-3 text-body" data-testid="unknown-detail">
          <div className="flex flex-wrap gap-x-2"><dt className="font-semibold text-foreground">Motivo:</dt><dd className="text-muted-foreground">{degradationText(prediction.degradationReason)}</dd></div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-foreground">Última previsão válida:</dt>
            <dd className="text-muted-foreground">{prediction.lastValidIssuedAt ? formatRecife(prediction.lastValidIssuedAt) : 'nenhuma registrada'}</dd>
          </div>
        </dl>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-caption text-muted-foreground sm:grid-cols-4">
        <div><dt>Emitida em</dt><dd className="text-reading text-foreground">{formatRecife(prediction.issuedAt) ?? '—'}</dd></div>
        <div><dt>Válida até</dt><dd className="text-reading text-foreground">{formatRecife(prediction.validUntil) ?? '—'}</dd></div>
        <div><dt>Horizonte</dt><dd className="text-reading text-foreground">{prediction.horizonHours != null ? `${prediction.horizonHours} h` : '—'}</dd></div>
        <div><dt>Modelo</dt><dd className="text-reading text-foreground">{prediction.modelVersion ?? '—'}</dd></div>
      </dl>
    </section>
  );
};
