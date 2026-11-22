import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { hasRole, parseRole } from '@/lib/roles';
import { useAlagamentoPontos } from '@/features/alagamento/hooks/useAlagamentoPontos';
import { FloodChip } from '@/features/alagamento/components/AlertaRegressao';
import { usePoint } from '@/features/points/hooks/usePoint';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { formatRecife } from '@/features/map/utils/datetime';
import { cn } from '@/lib/utils';
import type { Severity } from '@/lib/apiSchemas';
import type { FloodReport } from '../schemas/report.schema';
import { SEVERITY_LABEL, WATER_DEPTH_LABEL } from '../utils/labels';

const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

interface Props {
  report: FloodReport;
  pointName: string | null;
  saving: boolean;
  hasNext: boolean;
  onConfirm: (r: FloodReport, severity: Severity) => void;
  onDiscard: (r: FloodReport) => void;
  onSkip: () => void;
}

/** Relato selecionado: onde, quanto, o alerta experimental do ponto agora e a decisão do operador. */
export const ReportDetail: React.FC<Props> = ({ report: r, pointName, saving, hasNext, onConfirm, onDiscard, onSkip }) => {
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const point = usePoint(r.nearestPointSlug ?? '');
  const { user } = useAuth();
  // Alerta por regressão em modo sombra: só o ADMIN compara o relato com o nível do ponto.
  const isAdmin = hasRole(parseRole(user?.role), 'ADMIN');
  const al = useAlagamentoPontos(isAdmin);
  const lvl = r.nearestPointSlug ? al.data?.find((x) => x.slug === r.nearestPointSlug) ?? null : null;
  const rain3 = point.data?.liveData?.historicalAggregates?.rain3h ?? null;
  const disagree = lvl?.level === 'SEM_ALERTA';
  const hint = !r.nearestPointSlug ? 'Sem ponto crítico por perto: ao confirmar, você escolhe o ponto.'
    : !isAdmin ? 'O alerta de alagamento está em teste: confira a chuva e o rio antes de confirmar.'
      : !lvl ? 'Alerta do ponto ainda não calculado.'
        : lvl.level === 'SEM_DADO' ? `Alerta sem dado (${lvl.reasonText ?? 'motivo não informado'}): nada a comparar.`
          : disagree ? 'O relato contradiz o alerta experimental do ponto (sem alerta). Registre com cuidado: quem confirma assina o evento; o alerta não está calibrado.'
            : 'O relato concorda com o alerta experimental do ponto.';
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="font-mono text-[12px] font-semibold text-muted-foreground">#{r.id} · visto {formatHoraCurta(r.observedAt) ?? '—'} · enviado {formatRecife(r.createdAt) ?? '—'}</div>
          <h2 className="m-0 mt-0.5 text-[22px] font-extrabold leading-7">{pointName ?? 'Sem ponto crítico por perto'}</h2>
          <p className="m-0 mt-0.5 text-[14px] text-muted-foreground">
            {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
            {r.nearestPointSlug && <> · a {r.nearestPointDistanceM ?? '—'} m do ponto <Link to={`/pontos/${r.nearestPointSlug}`} className="text-primary hover:underline">{r.nearestPointSlug}</Link></>}
          </p>
        </div>
        <span className="inline-flex h-[30px] items-center rounded-full border-[1.5px] border-info px-3 text-[12px] font-extrabold text-info">Relata alagamento</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="box-border flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_10px,transparent_10px,transparent_20px)] p-3 text-center text-[12px] text-muted-foreground">
          Sem foto: a API ainda não recebe imagens do relato.
        </div>
        <div className="flex flex-col gap-2">
          <dl className="m-0 grid grid-cols-3 gap-2">
            <div className="rounded-[10px] bg-muted p-2.5"><dt className="text-[11px] text-muted-foreground">Altura relatada</dt><dd className="m-0 text-[15px] font-extrabold">{r.waterDepth ? WATER_DEPTH_LABEL[r.waterDepth] : 'não informada'}</dd></div>
            <div className="rounded-[10px] bg-muted p-2.5">
              <dt className="text-[11px] text-muted-foreground">Alerta do ponto agora</dt>
              <dd className="m-0 mt-0.5 flex flex-wrap items-center gap-1">
                {lvl ? <FloodChip ponto={lvl} /> : <span className="font-mono text-[15px] font-extrabold">{isAdmin ? '—' : 'em teste'}</span>}
              </dd>
            </div>
            <div className="rounded-[10px] bg-muted p-2.5"><dt className="text-[11px] text-muted-foreground">Chuva 3 h</dt><dd className="m-0 font-mono text-[15px] font-extrabold">{rain3 != null ? `${num(rain3)} mm` : '—'}</dd></div>
          </dl>
          <p className="m-0 rounded-[10px] bg-muted px-3 py-2.5 text-[14px] leading-5">{r.description ? `“${r.description}”` : 'Sem descrição do relator.'}</p>
          <p className={cn('m-0 text-[12px] leading-[17px]', disagree ? 'text-warning' : 'text-muted-foreground')}>{hint}</p>
        </div>
      </div>
      {r.status === 'PENDING' ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-extrabold">Gravidade observada</span>
          <div role="radiogroup" aria-label="Gravidade" className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            {SEVERITIES.map((s) => (
              <button
                key={s} type="button" role="radio" aria-checked={severity === s} onClick={() => setSeverity(s)}
                className={cn('h-11 cursor-pointer rounded-[10px] border-2 text-[13px] font-bold leading-4 text-foreground md:h-10', severity === s ? 'border-primary bg-primary/15' : 'border-border bg-transparent')}
              >{SEVERITY_LABEL[s]}</button>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            <Button type="button" size="lg" className="h-11 md:h-9" disabled={saving} onClick={() => onConfirm(r, severity)} aria-label={`Confirmar relato ${r.id}`}>Confirmar e registrar evento</Button>
            <Button type="button" variant="outline" size="lg" className="h-11 text-foreground md:h-9" disabled={saving} onClick={() => onDiscard(r)} aria-label={`Descartar relato ${r.id}`}>Descartar</Button>
            <Button type="button" variant="ghost" size="lg" className="h-11 md:h-9" disabled={!hasNext} onClick={onSkip}>Pular</Button>
          </div>
        </div>
      ) : (
        <p role="status" className={cn('m-0 rounded-[10px] border p-3 text-[14px] font-bold', r.status === 'CONFIRMED' ? 'border-success text-success' : 'border-border text-muted-foreground')}>
          {r.status === 'CONFIRMED'
            ? `Evento registrado${r.floodEventId != null ? ` (#${r.floodEventId})` : ''}${r.nearestPointSlug ? ` em ${r.nearestPointSlug}` : ''} · confirmado por ${r.reviewedBy ?? '—'} em ${formatRecife(r.reviewedAt) ?? '—'}`
            : `Relato descartado por ${r.reviewedBy ?? '—'} em ${formatRecife(r.reviewedAt) ?? '—'}${r.discardReason ? ` · motivo: ${r.discardReason}` : ''}. Não vira evento.`}
        </p>
      )}
    </>
  );
};
