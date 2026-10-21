import React, { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { Button } from '@/components/ui/button';
import { useNotices } from '@/hooks/useNotices';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useReports, useReviewReport } from '@/features/reports/hooks/useReports';
import { ReportItem } from '@/features/reports/components/ReportItem';
import { ConfirmReportDialog, DiscardReportDialog } from '@/features/reports/components/ReviewDialogs';
import type { ReportStatusFilter } from '@/features/reports/services/reports.service';
import type { FloodReport, ReportReview } from '@/features/reports/schemas/report.schema';
import { actionErrorMessage, httpStatus } from '@/lib/apiError';
import { cn } from '@/lib/utils';

const FILTERS: ReadonlyArray<{ value: ReportStatusFilter; label: string }> = [
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'DISCARDED', label: 'Descartados' },
  { value: 'ALL', label: 'Todos' },
];
const PAGE_SIZE = 20;

export const ReportsPage: React.FC = () => {
  const [status, setStatus] = useState<ReportStatusFilter>('PENDING');
  const [page, setPage] = useState(0);
  const query = useReports(status, page, PAGE_SIZE);
  const points = useFloodPoints();
  const review = useReviewReport();
  const { notices, notify, dismiss } = useNotices();
  const [dialog, setDialog] = useState<{ kind: 'confirm' | 'discard'; report: FloodReport } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = (body: ReportReview) => {
    if (!dialog) return;
    setFormError(null);
    review.mutate(
      { id: dialog.report.id, body },
      {
        onSuccess: () => {
          notify('success', body.status === 'CONFIRMED' ? 'Relato confirmado e evento de alagamento criado.' : 'Relato descartado.');
          setDialog(null);
        },
        onError: (e) => {
          const msg = httpStatus(e) === 409 ? 'Este relato já foi revisado por outra pessoa. A fila foi atualizada.' : actionErrorMessage(e, 'revisar o relato');
          if (httpStatus(e) === 409) {
            notify('error', msg);
            setDialog(null);
          } else setFormError(msg);
        },
      },
    );
  };

  return (
    <PageShell title="Relatos" description="Relatos de alagamento enviados por moradores. Confirmar cria um evento de alagamento no ponto; descartar exige um motivo.">
      <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={status === f.value}
            onClick={() => { setStatus(f.value); setPage(0); }}
            className={cn('h-11 rounded-full border px-4 text-body-strong md:h-8', status === f.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <QueryState query={query} what="os relatos" isEmpty={(d) => d.content.length === 0} emptyTitle={status === 'PENDING' ? 'Nenhum relato pendente.' : 'Nenhum relato nesta lista.'} emptyHint="Relatos novos aparecem aqui assim que alguém enviar.">
        {(data) => (
          <>
            <ul className="flex flex-col gap-2" aria-label="Relatos">
              {data.content.map((r) => (
                <ReportItem key={r.id} report={r} onConfirm={(x) => { setFormError(null); setDialog({ kind: 'confirm', report: x }); }} onDiscard={(x) => { setFormError(null); setDialog({ kind: 'discard', report: x }); }} />
              ))}
            </ul>
            {data.totalElements > PAGE_SIZE && (
              <nav aria-label="Páginas" className="flex items-center justify-between gap-2">
                <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span className="text-caption text-muted-foreground">Página {page + 1} de {Math.ceil(data.totalElements / PAGE_SIZE)} · {data.totalElements} relatos</span>
                <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={(page + 1) * PAGE_SIZE >= data.totalElements} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </nav>
            )}
          </>
        )}
      </QueryState>
      {dialog?.kind === 'confirm' && (
        <ConfirmReportDialog report={dialog.report} points={(points.data ?? []).filter((p) => p.active).map((p) => ({ slug: p.slug, name: p.name }))} saving={review.isPending} error={formError} onSubmit={submit} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'discard' && <DiscardReportDialog report={dialog.report} saving={review.isPending} error={formError} onSubmit={submit} onClose={() => setDialog(null)} />}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </PageShell>
  );
};
export default ReportsPage;
