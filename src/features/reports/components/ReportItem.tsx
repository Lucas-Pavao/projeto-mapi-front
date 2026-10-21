import React from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, CircleX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRecife } from '@/features/map/utils/datetime';
import { cn } from '@/lib/utils';
import type { FloodReport, ReportStatus, WaterDepth } from '../schemas/report.schema';

export const WATER_DEPTH_LABEL: Record<WaterDepth, string> = {
  ANKLE: 'Até o tornozelo',
  KNEE: 'Até o joelho',
  WAIST: 'Até a cintura',
  ABOVE_WAIST: 'Acima da cintura',
};

const STATUS = {
  PENDING: { label: 'Pendente', Icon: Clock, tone: 'text-warning border-warning/40 bg-warning/10' },
  CONFIRMED: { label: 'Confirmado', Icon: CircleCheck, tone: 'text-success border-success/40 bg-success/10' },
  DISCARDED: { label: 'Descartado', Icon: CircleX, tone: 'text-muted-foreground border-border bg-muted' },
} satisfies Record<ReportStatus, { label: string; Icon: React.ComponentType<{ className?: string }>; tone: string }>;

interface Props {
  report: FloodReport;
  onConfirm: (r: FloodReport) => void;
  onDiscard: (r: FloodReport) => void;
}

/** Um relato da fila. Texto do morador é dado: sempre renderizado como texto, nunca como HTML. */
export const ReportItem: React.FC<Props> = ({ report: r, onConfirm, onDiscard }) => {
  const st = STATUS[r.status];
  return (
    <li data-report-id={r.id} data-status={r.status} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-2xs font-bold', st.tone)}>
          <st.Icon className="size-3.5" aria-hidden="true" /> {st.label}
        </span>
        <span className="text-body-strong text-foreground">Relato #{r.id}</span>
        <span className="ml-auto text-caption text-muted-foreground">Visto em {formatRecife(r.observedAt) ?? '—'}</span>
      </div>
      <p className="text-body text-foreground">
        {r.waterDepth ? WATER_DEPTH_LABEL[r.waterDepth] : 'Altura da água não informada'}
        {r.description ? <span className="text-muted-foreground"> · “{r.description}”</span> : null}
      </p>
      <p className="text-caption text-muted-foreground">
        <span className="text-code">{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
        {' · '}
        {r.nearestPointSlug ? (
          <>Ponto mais próximo: <Link className="font-semibold text-primary hover:underline" to={`/pontos/${r.nearestPointSlug}`}>{r.nearestPointSlug}</Link> a {r.nearestPointDistanceM ?? '—'} m</>
        ) : 'sem ponto crítico por perto'}
        {' · enviado em '}{formatRecife(r.createdAt) ?? '—'}
      </p>
      {r.status === 'PENDING' ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="h-11 px-4 md:h-8" onClick={() => onConfirm(r)} aria-label={`Confirmar relato ${r.id}`}>Confirmar</Button>
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={() => onDiscard(r)} aria-label={`Descartar relato ${r.id}`}>Descartar</Button>
        </div>
      ) : (
        <p className="text-caption text-muted-foreground">
          Revisado por {r.reviewedBy ?? '—'} em {formatRecife(r.reviewedAt) ?? '—'}
          {r.status === 'CONFIRMED' && r.floodEventId != null ? ` · evento de alagamento #${r.floodEventId}` : ''}
          {r.status === 'DISCARDED' && r.discardReason ? ` · motivo: ${r.discardReason}` : ''}
        </p>
      )}
    </li>
  );
};
