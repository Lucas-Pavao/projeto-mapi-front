import React, { useMemo, useState } from 'react';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { useNotices } from '@/hooks/useNotices';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useReports, useReviewReport } from '@/features/reports/hooks/useReports';
import { ReportQueue, type QueueTab } from '@/features/reports/components/ReportQueue';
import { ReportDetail } from '@/features/reports/components/ReportDetail';
import { ConfirmReportDialog, DiscardReportDialog } from '@/features/reports/components/ReviewDialogs';
import type { FloodReport, ReportReview } from '@/features/reports/schemas/report.schema';
import { PageFrame } from '@/features/operacao/components/Panel';
import { actionErrorMessage, httpStatus } from '@/lib/apiError';
import type { Severity } from '@/lib/apiSchemas';

/** Lê os 100 relatos mais recentes de qualquer situação (a API limita o tamanho da página). */
const SIZE = 100;
const dayKey = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Recife' }) : '');

export const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState<QueueTab>('PENDING');
  const [picked, setPicked] = useState<number | null>(null);
  const query = useReports('ALL', 0, SIZE);
  const points = useFloodPoints();
  const review = useReviewReport();
  const { notices, notify, dismiss } = useNotices();
  const [dialog, setDialog] = useState<{ kind: 'confirm' | 'discard'; report: FloodReport } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const names = useMemo(() => new Map((points.data ?? []).map((p) => [p.slug, p.name])), [points.data]);
  const all = useMemo(() => query.data?.content ?? [], [query.data]);

  const counts = useMemo(() => ({
    PENDING: all.filter((r) => r.status === 'PENDING').length,
    CONFIRMED: all.filter((r) => r.status === 'CONFIRMED').length,
    DISCARDED: all.filter((r) => r.status === 'DISCARDED').length,
    ALL: all.length,
  }), [all]);
  const today = dayKey(new Date().toISOString());
  const confirmedToday = all.filter((r) => r.status === 'CONFIRMED' && dayKey(r.reviewedAt) === today).length;
  const events = all.filter((r) => r.status === 'CONFIRMED' && r.floodEventId != null).length;

  const items = all.filter((r) => tab === 'ALL' || r.status === tab);
  const current = items.find((r) => r.id === picked) ?? items[0] ?? null;
  const nextPending = (from: number | null) => all.find((r) => r.status === 'PENDING' && r.id !== from) ?? null;

  const submit = (body: ReportReview, report: FloodReport, close: boolean) => {
    setFormError(null);
    review.mutate(
      { id: report.id, body },
      {
        onSuccess: () => {
          notify('success', body.status === 'CONFIRMED' ? 'Relato confirmado e evento de alagamento criado.' : 'Relato descartado.');
          if (close) setDialog(null);
          if (tab === 'PENDING') setPicked(nextPending(report.id)?.id ?? null);
        },
        onError: (e) => {
          const msg = httpStatus(e) === 409 ? 'Este relato já foi revisado por outra pessoa. A fila foi atualizada.' : actionErrorMessage(e, 'revisar o relato');
          if (httpStatus(e) === 409 || !close) { notify('error', msg); setDialog(null); } else setFormError(msg);
        },
      },
    );
  };
  const confirm = (r: FloodReport, severity: Severity) => {
    if (!r.nearestPointSlug) { setFormError(null); setDialog({ kind: 'confirm', report: r }); return; } // sem ponto sugerido: escolher no formulário
    submit({ status: 'CONFIRMED', floodPointSlug: r.nearestPointSlug, severity }, r, false);
  };

  const stats = [
    { label: 'aguardando', value: counts.PENDING, tone: 'text-warning' },
    { label: 'confirmados hoje', value: confirmedToday, tone: 'text-success' },
    { label: 'descartados', value: counts.DISCARDED, tone: '' },
    { label: 'eventos de alagamento criados', value: events, tone: 'text-primary' },
  ];

  return (
    <PageFrame className="lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
      <div className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
        <div className="col-span-2 flex flex-col justify-center lg:col-span-1">
          <h1 className="m-0 text-[24px] font-extrabold leading-[30px]">Relatos para confirmar</h1>
          <p className="m-0 text-[13px] text-muted-foreground">Confirmar cria um evento de alagamento no ponto, assinado por você; descartar exige um motivo.</p>
        </div>
        {stats.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card px-3.5 py-3">
            <div className={`font-mono text-[24px] font-extrabold leading-7 ${k.tone}`}>{k.value}</div>
            <div className="text-[12px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <QueryState query={query} what="os relatos" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhum relato recebido." emptyHint="Relatos novos aparecem aqui assim que alguém enviar.">
        {(data) => (
          <>
            <ReportQueue items={items} names={names} selected={current?.id ?? null} tab={tab} counts={counts} onTab={(t) => { setTab(t); setPicked(null); }} onPick={setPicked} />
            <section aria-label="Relato selecionado" className="flex min-h-0 min-w-0 flex-col gap-3.5 overflow-y-auto rounded-2xl border border-border bg-card p-[18px] lg:col-span-7">
              {current ? (
                <ReportDetail
                  key={current.id} report={current} pointName={current.nearestPointSlug ? (names.get(current.nearestPointSlug) ?? current.nearestPointSlug) : null}
                  saving={review.isPending} hasNext={items.some((r) => r.status === 'PENDING' && r.id !== current.id)}
                  onConfirm={confirm} onDiscard={(r) => { setFormError(null); setDialog({ kind: 'discard', report: r }); }}
                  onSkip={() => setPicked(items.find((r) => r.status === 'PENDING' && r.id !== current.id)?.id ?? null)}
                />
              ) : (
                <p className="m-0 text-[14px] text-muted-foreground">{tab === 'PENDING' ? 'Nenhum relato aguardando. Relatos novos aparecem aqui.' : 'Nenhum relato nesta lista.'}</p>
              )}
              <p className="m-0 mt-auto text-[12px] leading-[17px] text-muted-foreground">
                Ao confirmar, o relato vira um evento de alagamento com hora e local, mas não entra nos rótulos da avaliação do modelo.
                {data.totalElements > SIZE && ` Mostrando os ${SIZE} relatos mais recentes de ${data.totalElements}.`}
              </p>
            </section>
          </>
        )}
      </QueryState>
      {dialog?.kind === 'confirm' && (
        <ConfirmReportDialog report={dialog.report} points={(points.data ?? []).filter((p) => p.active).map((p) => ({ slug: p.slug, name: p.name }))} saving={review.isPending} error={formError} onSubmit={(b) => submit(b, dialog.report, true)} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'discard' && <DiscardReportDialog report={dialog.report} saving={review.isPending} error={formError} onSubmit={(b) => submit(b, dialog.report, true)} onClose={() => setDialog(null)} />}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </PageFrame>
  );
};
export default ReportsPage;
