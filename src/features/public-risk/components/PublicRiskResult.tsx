import React from 'react';
import { MapPinOff } from 'lucide-react';
import { formatRecife } from '@/features/map/utils/datetime';
import type { FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';
import { CHIP_CLASS, DOT_CLASS, toneOf } from '@/features/alagamento/utils/alagamentoText';
import { cn } from '@/lib/utils';
import type { PublicRisk } from '../schemas/public-risk.schema';
import { HEADLINE, NO_POINT_TEXT, PUBLIC_WARNING } from '../utils/headlines';

const CHIP: Record<FloodLevel, string> = { ALERTA: 'Alerta', ATENCAO: 'Atenção', SEM_ALERTA: 'Sem alerta', SEM_DADO: 'Sem dado' };

const Tile: React.FC<{ label: string; value: string; sub?: string | null }> = ({ label, value, sub }) => (
  <div className="rounded-xl bg-muted p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-mono text-lg font-extrabold">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
  </div>
);

const hhmm = (iso: string | null | undefined) => (iso ? (formatRecife(iso) ?? '—').split(' ').at(-1) ?? '—' : '—');

/** Resultado da consulta pública pelo alerta por regressão. Sem probabilidade; sem dado e em teste nunca viram "sem alerta". */
export const PublicRiskResult: React.FC<{ risk: PublicRisk }> = ({ risk }) => {
  const p = risk.nearestPoint;
  const rain = risk.rainLastHourMm != null ? `${risk.rainLastHourMm.toLocaleString('pt-BR')} mm` : '—';
  const rainSub = risk.rainLastHourMm != null ? (risk.rainStationId ? `pluviômetro ${risk.rainStationId}` : null) : 'Sem leitura de chuva da última hora num pluviômetro próximo.';
  const tone = p ? toneOf(p.level) : 'muted';
  const headline = !p ? NO_POINT_TEXT : risk.inTest ? 'O alerta de alagamento ainda está em teste.' : HEADLINE[p.level];
  return (
    <div className="flex flex-col gap-3.5">
      {p === null ? (
        <section aria-label="Sem ponto por perto" className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px]">
          <MapPinOff className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="m-0 text-[22px] leading-[30px] font-extrabold text-foreground">{NO_POINT_TEXT}</p>
          <p className="m-0 text-[15px] leading-[22px]">Sem ponto monitorado por perto, o MAPi não tem alerta para este local. Isto não quer dizer que está seguro.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><Tile label="Chuva na última hora" value={rain} sub={rainSub} /></div>
        </section>
      ) : (
        <section aria-label="Alerta perto de você" aria-live="polite" className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px]">
          <div className="flex flex-wrap items-center gap-3">
            {!risk.inTest && (
              <span data-testid="public-chip" data-level={p.level} className={cn('inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-sm font-bold', CHIP_CLASS[tone], p.level === 'SEM_DADO' && 'border-dashed')}>
                <span aria-hidden="true" className={cn('size-2 rounded-full', DOT_CLASS[tone])} />{CHIP[p.level]}
              </span>
            )}
            <span className="text-[13px] text-muted-foreground">ponto monitorado mais perto: <strong className="text-foreground">{p.name}</strong> · a cerca de {p.distanceM} m do ponto consultado</span>
          </div>
          <p data-testid="public-headline" className="m-0 text-[22px] leading-[30px] font-extrabold text-foreground">{headline}</p>
          {risk.inTest && <p className="m-0 text-[15px] leading-[22px]">Enquanto isso, fique de olho na chuva e no aviso oficial do INMET. Isto não quer dizer que está seguro.</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Tile label="Chuva na última hora" value={rain} sub={rainSub} />
            <Tile label="Distância do ponto" value={`${p.distanceM.toLocaleString('pt-BR')} m`} />
            {!risk.inTest && <Tile label="Alerta emitido" value={hhmm(p.issuedAt)} />}
          </div>
          <span className="w-fit rounded-md border border-warning/70 px-2 text-xs font-bold text-warning">Experimental</span>
        </section>
      )}
      <p role="note" className="m-0 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] leading-[18px] text-warning">{PUBLIC_WARNING}</p>
    </div>
  );
};
