import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { useNotices } from '@/hooks/useNotices';
import { useLiveStream } from '@/features/live/hooks/useLiveStream';
import type { LiveEvent } from '@/features/live/schemas/live-event.schema';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { useAckAlert } from '@/features/alerts/hooks/useAlertRules';
import { applyLiveAlert } from '@/features/alerts/utils/liveAlerts';
import { GROUPS, countByGroup, inGroup, type AlertGroup } from '@/features/alerts/utils/alertGroups';
import { AlertItem } from '@/features/alerts/components/AlertItem';
import { QuickRules } from '@/features/alerts/components/QuickRules';
import { RulesPanel } from '@/features/alerts/components/RulesPanel';
import { PageFrame } from '@/features/operacao/components/Panel';
import { actionErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

/** A Central lê os 100 alertas mais recentes (abertos e reconhecidos); a API limita o tamanho da página. */
const SIZE = 100;
const LIVE_TEXT = { open: 'Ao vivo', connecting: 'Conectando…', error: 'Sem atualização ao vivo', closed: 'Sem atualização ao vivo' } as const;
const NEW_WINDOW_MS = 30 * 60_000;

export const AlertsPage: React.FC = () => {
  const [group, setGroup] = useState<AlertGroup>('all');
  const [allRules, setAllRules] = useState(false);
  const qc = useQueryClient();
  const { notices, notify, dismiss } = useNotices();
  const query = useAlerts('ALL', { page: 0, size: SIZE });
  const ack = useAckAlert();
  const [acking, setAcking] = useState<ReadonlySet<number>>(new Set());
  const [now] = useState(() => Date.now());

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

  const content = useMemo(() => query.data?.content ?? [], [query.data]);
  const unread = content.filter((a) => !a.acknowledgedAt);

  const doAck = (id: number, quiet = false) =>
    new Promise<void>((resolve) => {
      setAcking((s) => new Set(s).add(id));
      ack.mutate(id, {
        onSuccess: () => { if (!quiet) notify('success', 'Alerta reconhecido.'); },
        onError: (e) => notify('error', actionErrorMessage(e, 'reconhecer o alerta')),
        onSettled: () => { setAcking((s) => { const n = new Set(s); n.delete(id); return n; }); resolve(); },
      });
    });
  const ackAll = async () => {
    const ids = unread.map((a) => a.id);
    await Promise.all(ids.map((id) => doAck(id, true)));
    notify('success', `${ids.length} alerta${ids.length === 1 ? '' : 's'} reconhecido${ids.length === 1 ? '' : 's'}.`);
  };

  const items = content.filter((a) => inGroup(a, group));
  const latest = content[0];

  return (
    <PageFrame className="lg:grid lg:grid-cols-12 lg:grid-rows-1">
      <section aria-label="Alertas" className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-7 lg:min-h-0">
        <div className="flex flex-col gap-3 border-b border-border px-[18px] py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="m-0 flex-1 text-[24px] font-extrabold leading-[30px]">Central de alertas</h1>
            <span className="text-[13px] text-muted-foreground" aria-live="polite"><strong className="font-mono text-foreground">{unread.length}</strong> não lidos de {query.data?.totalElements ?? content.length}</span>
            <Button type="button" variant="outline" className="h-11 text-[14px] md:h-8" disabled={unread.length === 0 || acking.size > 0} onClick={() => void ackAll()}>Marcar todos como lidos</Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div role="radiogroup" aria-label="Filtrar" className="flex flex-wrap gap-1.5">
              {GROUPS.map((g) => {
                const on = group === g.value;
                return (
                  <button
                    key={g.value} type="button" role="radio" aria-checked={on} onClick={() => setGroup(g.value)}
                    className={cn('h-11 cursor-pointer rounded-full border px-3 text-[12px] font-bold leading-4 md:h-[30px]', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent text-foreground')}
                  >
                    {g.label} <span className="font-mono opacity-80">{countByGroup(content, g.value)}</span>
                  </button>
                );
              })}
            </div>
            <span data-live-status={liveStatus} className={cn('ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold', liveStatus === 'open' ? 'text-success' : 'text-muted-foreground')}>
              <Radio className="size-3.5" aria-hidden="true" /> {LIVE_TEXT[liveStatus]}
            </span>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <QueryState query={query} what="os alertas" isEmpty={(d) => d.content.length === 0} emptyTitle="Nada por aqui ainda." emptyHint="Quando a chuva, o rio ou a maré passarem das regras, os alertas aparecem aqui.">
            {(data) => (
              <>
                {items.length === 0 && <p className="m-0 p-6 text-center text-[14px] text-muted-foreground">Nenhum alerta neste filtro.</p>}
                <ul aria-label="Lista de alertas" className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto p-2">
                  {items.map((a) => <AlertItem key={a.id} alert={a} canAck acking={acking.has(a.id)} isNew={now - Date.parse(a.triggeredAt) <= NEW_WINDOW_MS} onAck={doAck} />)}
                </ul>
                {data.totalElements > SIZE && <p className="m-0 border-t border-border px-4 py-2 text-[12px] text-muted-foreground">Mostrando os {SIZE} alertas mais recentes de {data.totalElements}.</p>}
              </>
            )}
          </QueryState>
        </div>
      </section>
      <QuickRules notify={notify} latest={latest} onAll={() => setAllRules(true)} />
      {allRules && (
        <DialogPanel title="Todas as regras" description="Regras por ponto ou estação, limiares e fontes." onClose={() => setAllRules(false)} className="sm:max-w-3xl">
          <RulesPanel notify={notify} />
        </DialogPanel>
      )}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </PageFrame>
  );
};
export default AlertsPage;
