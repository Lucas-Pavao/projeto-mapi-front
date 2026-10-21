import React, { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { Button } from '@/components/ui/button';
import { useNotices } from '@/hooks/useNotices';
import { useLiveStream } from '@/features/live/hooks/useLiveStream';
import type { LiveEvent } from '@/features/live/schemas/live-event.schema';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { useAckAlert } from '@/features/alerts/hooks/useAlertRules';
import { applyLiveAlert } from '@/features/alerts/utils/liveAlerts';
import { AlertItem } from '@/features/alerts/components/AlertItem';
import { RulesPanel } from '@/features/alerts/components/RulesPanel';
import type { AlertStatusFilter } from '@/features/alerts/services/alerts.service';
import { actionErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

const STATUS: ReadonlyArray<{ value: AlertStatusFilter; label: string }> = [
  { value: 'OPEN', label: 'Abertos' },
  { value: 'ACKNOWLEDGED', label: 'Reconhecidos' },
  { value: 'ALL', label: 'Todos' },
];
const PAGE_SIZE = 20;

const LIVE_TEXT = { open: 'Ao vivo', connecting: 'Conectando…', error: 'Sem atualização ao vivo', closed: 'Sem atualização ao vivo' } as const;

export const AlertsPage: React.FC = () => {
  const [tab, setTab] = useState<'alertas' | 'regras'>('alertas');
  const [status, setStatus] = useState<AlertStatusFilter>('OPEN');
  const [page, setPage] = useState(0);
  const qc = useQueryClient();
  const { notices, notify, dismiss } = useNotices();
  const query = useAlerts(status, { page, size: PAGE_SIZE });
  const ack = useAckAlert();
  const [ackingId, setAckingId] = useState<number | null>(null);

  // Reentrega após reconexão não deve avisar duas vezes do mesmo alerta.
  const announced = useRef(new Set<number>());
  const onEvent = useCallback(
    (ev: LiveEvent) => {
      if (ev.type !== 'alert') return;
      applyLiveAlert(qc, ev.data);
      if (!ev.data.acknowledgedAt && !announced.current.has(ev.data.id)) {
        announced.current.add(ev.data.id);
        notify('info', `Novo alerta: ${ev.data.title}`);
      }
    },
    [qc, notify],
  );
  const { status: liveStatus } = useLiveStream({ onEvent });

  const doAck = (id: number) => {
    setAckingId(id);
    ack.mutate(id, {
      onSuccess: () => notify('success', 'Alerta reconhecido.'),
      onError: (e) => notify('error', actionErrorMessage(e, 'reconhecer o alerta')),
      onSettled: () => setAckingId(null),
    });
  };

  const tabBtn = (id: 'alertas' | 'regras', label: string) => (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={tab === id}
      aria-controls={`panel-${id}`}
      onClick={() => setTab(id)}
      className={cn('h-11 border-b-2 px-4 text-body-strong md:h-9', tab === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
    >
      {label}
    </button>
  );

  return (
    <PageShell
      title="Alertas"
      description="Alertas disparados pelas regras. Reconhecer avisa os outros operadores de que alguém já viu."
      actions={
        <span data-live-status={liveStatus} className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-2xs font-bold', liveStatus === 'open' ? 'text-success' : 'text-muted-foreground')}>
          <Radio className="size-3.5" aria-hidden="true" /> {LIVE_TEXT[liveStatus]}
        </span>
      }
    >
      <div role="tablist" aria-label="Alertas e regras" className="flex border-b border-border">
        {tabBtn('alertas', 'Alertas')}
        {tabBtn('regras', 'Regras')}
      </div>
      {tab === 'alertas' ? (
        <div role="tabpanel" id="panel-alertas" aria-labelledby="tab-alertas" className="flex flex-col gap-3">
          <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
            {STATUS.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={status === s.value}
                onClick={() => { setStatus(s.value); setPage(0); }}
                className={cn('h-11 rounded-full border px-4 text-body-strong md:h-8', status === s.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted')}
              >
                {s.label}
              </button>
            ))}
          </div>
          <QueryState
            query={query}
            what="os alertas"
            isEmpty={(d) => d.content.length === 0}
            emptyTitle={status === 'OPEN' ? 'Nenhum alerta aberto.' : 'Nenhum alerta nesta lista.'}
            emptyHint="Quando uma regra disparar, o alerta aparece aqui."
          >
            {(data) => (
              <>
                <ul className="flex flex-col gap-2" aria-label="Lista de alertas">
                  {data.content.map((a) => (
                    <AlertItem key={a.id} alert={a} canAck acking={ackingId === a.id} onAck={doAck} />
                  ))}
                </ul>
                {data.totalElements > PAGE_SIZE && (
                  <nav aria-label="Páginas" className="flex items-center justify-between gap-2">
                    <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                    <span className="text-caption text-muted-foreground">Página {page + 1} de {Math.ceil(data.totalElements / PAGE_SIZE)} · {data.totalElements} alertas</span>
                    <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={(page + 1) * PAGE_SIZE >= data.totalElements} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                  </nav>
                )}
              </>
            )}
          </QueryState>
        </div>
      ) : (
        <div role="tabpanel" id="panel-regras" aria-labelledby="tab-regras"><RulesPanel notify={notify} /></div>
      )}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </PageShell>
  );
};
export default AlertsPage;
