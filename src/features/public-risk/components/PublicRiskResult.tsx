import React from 'react';
import { MapPinOff } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { degradationText, showsExperimentalLabel } from '@/components/risk/risk';
import { formatRecife } from '@/features/map/utils/datetime';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';
import type { PublicRisk } from '../schemas/public-risk.schema';

/**
 * Texto fixo de aviso (ADR 0013): o modelo não está validado e a classe não é garantia.
 * TODO(F3-PUBLICO-TELEFONE): acrescentar o telefone oficial da Defesa Civil quando for informado (pergunta 52).
 * Até lá o texto não traz número nenhum, de propósito.
 */
export const PUBLIC_WARNING =
  'Esta é uma estimativa experimental de um modelo que ainda não foi validado. A classe de risco não confirma nem descarta alagamento no local. Em caso de chuva forte, siga as orientações da Defesa Civil.';

export const NO_POINT_TEXT = 'Não há ponto monitorado perto deste endereço.';

const HEADLINE: Record<RiskLevel, string> = {
  LOW: 'Risco baixo de alagamento perto de você.',
  MEDIUM: 'Risco moderado de alagamento perto de você.',
  HIGH: 'Risco alto de alagamento perto de você.',
  UNKNOWN: 'Sem previsão para este local agora.',
};

const Tile: React.FC<{ label: string; value: string; sub?: string | null }> = ({ label, value, sub }) => (
  <div className="rounded-xl bg-muted p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-mono text-lg font-extrabold">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
  </div>
);

const hhmm = (iso: string) => (formatRecife(iso) ?? '—').split(' ').at(-1) ?? '—';

/** Resultado da consulta pública. Classe sempre com ícone, rótulo e selo experimental; UNKNOWN sem %, com motivo. */
export const PublicRiskResult: React.FC<{ risk: PublicRisk }> = ({ risk }) => {
  const p = risk.nearestPoint;
  const rain = risk.rainLastHourMm != null ? `${risk.rainLastHourMm.toLocaleString('pt-BR')} mm` : '—';
  const rainSub = risk.rainLastHourMm != null ? (risk.rainStationId ? `pluviômetro ${risk.rainStationId}` : null) : 'Sem leitura de chuva da última hora num pluviômetro próximo.';
  return (
    <div className="flex flex-col gap-3.5">
      {p === null ? (
        <section aria-label="Sem ponto por perto" className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px]">
          <MapPinOff className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="m-0 text-[22px] leading-[30px] font-extrabold text-foreground">{NO_POINT_TEXT}</p>
          <p className="m-0 text-[15px] leading-[22px]">Isto não significa risco baixo: sem ponto por perto, o MAPi não tem previsão para este local.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><Tile label="Chuva na última hora" value={rain} sub={rainSub} /></div>
        </section>
      ) : (
        <section aria-label="Risco perto de você" aria-live="polite" className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px]">
          <div className="flex flex-wrap items-center gap-3">
            {/* A resposta pública não traz probabilidade: só a classe (ADR 0013). */}
            <RiskBadge level={p.riskLevel} className="text-sm" />
            <span className="text-[13px] text-muted-foreground">ponto monitorado mais perto: <strong className="text-foreground">{p.name}</strong> · a cerca de {p.distanceM} m do ponto consultado</span>
          </div>
          <p className="m-0 text-[22px] leading-[30px] font-extrabold text-foreground">{HEADLINE[p.riskLevel]}</p>
          <p className="m-0 text-[15px] leading-[22px] text-foreground">{risk.meaning}</p>
          {p.riskLevel === 'UNKNOWN' && (
            <p data-testid="unknown-reason" className="m-0 rounded-lg border border-dashed border-border p-3 text-body text-muted-foreground">
              Motivo: {degradationText(p.degradationReason)}.
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Tile label="Chuva na última hora" value={rain} sub={rainSub} />
            <Tile label="Distância do ponto" value={`${p.distanceM.toLocaleString('pt-BR')} m`} />
            <Tile label="Previsão emitida" value={hhmm(p.issuedAt)} sub={p.validUntil ? `válida até ${hhmm(p.validUntil)}` : null} />
          </div>
          {showsExperimentalLabel({ riskLevel: p.riskLevel, modelValidationStatus: risk.modelValidationStatus }) && <ExperimentalBadge className="w-full" />}
          <p className="sr-only">Previsão emitida em {formatRecife(p.issuedAt) ?? '—'}{p.validUntil ? `, válida até ${formatRecife(p.validUntil)}` : ''}.</p>
        </section>
      )}
      <p role="note" className="m-0 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] leading-[18px] text-warning">{PUBLIC_WARNING}</p>
    </div>
  );
};
