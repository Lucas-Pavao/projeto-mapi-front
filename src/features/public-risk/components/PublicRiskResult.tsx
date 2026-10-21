import React from 'react';
import { CloudRain, MapPinOff } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { degradationText, showsExperimentalLabel } from '@/components/risk/risk';
import { formatRecife } from '@/features/map/utils/datetime';
import type { PublicRisk } from '../schemas/public-risk.schema';

/** Texto fixo de aviso (ADR 0013): o modelo não está validado e a classe não é garantia. */
export const PUBLIC_WARNING =
  'Esta é uma estimativa experimental de um modelo que ainda não foi validado. A classe de risco não confirma nem descarta alagamento no local. Em caso de chuva forte, siga as orientações da Defesa Civil.';

export const NO_POINT_TEXT = 'Não há ponto monitorado perto deste endereço.';

/** Resultado da consulta pública. Classe sempre com ícone, rótulo e selo experimental; UNKNOWN sem %, com motivo. */
export const PublicRiskResult: React.FC<{ risk: PublicRisk }> = ({ risk }) => {
  const p = risk.nearestPoint;
  return (
    <div className="flex flex-col gap-3">
      {p === null ? (
        <section aria-label="Sem ponto por perto" className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4">
          <MapPinOff className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="text-title text-foreground">{NO_POINT_TEXT}</p>
          <p className="text-body text-muted-foreground">Isto não significa risco baixo: sem ponto por perto, o MAPi não tem previsão para este local.</p>
        </section>
      ) : (
        <section aria-label="Risco perto de você" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="text-title text-foreground">{p.name}</p>
            <p className="text-caption text-muted-foreground">a cerca de {p.distanceM} m do ponto consultado</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* A resposta pública não traz probabilidade: só a classe (ADR 0013). */}
            <RiskBadge level={p.riskLevel} className="text-sm" />
            {showsExperimentalLabel({ riskLevel: p.riskLevel, modelValidationStatus: risk.modelValidationStatus }) && <ExperimentalBadge />}
          </div>
          <p className="text-body text-foreground">{risk.meaning}</p>
          {p.riskLevel === 'UNKNOWN' && (
            <p data-testid="unknown-reason" className="rounded-lg border border-dashed border-border p-3 text-body text-muted-foreground">
              Motivo: {degradationText(p.degradationReason)}.
            </p>
          )}
          <p className="text-caption text-muted-foreground">
            Previsão emitida em {formatRecife(p.issuedAt) ?? '—'}{p.validUntil ? `, válida até ${formatRecife(p.validUntil)}` : ''}.
          </p>
        </section>
      )}
      <section aria-label="Chuva na última hora" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <CloudRain className="size-5 shrink-0 text-chart-1" aria-hidden="true" />
        <p className="text-body text-foreground">
          {risk.rainLastHourMm != null ? (
            <>Choveu <span className="text-reading">{risk.rainLastHourMm.toLocaleString('pt-BR')} mm</span> na última hora fechada{risk.rainStationId ? <> (pluviômetro <span className="text-code">{risk.rainStationId}</span>)</> : null}.</>
          ) : (
            'Sem leitura de chuva da última hora num pluviômetro próximo.'
          )}
        </p>
      </section>
      <p role="note" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-body text-warning">{PUBLIC_WARNING}</p>
    </div>
  );
};
