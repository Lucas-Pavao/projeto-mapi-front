import React from 'react';
import { actionErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import type { DataHealth } from '../schemas/admin.schema';

const n = (v: number) => v.toLocaleString('pt-BR');

interface IntegrityPanelProps {
  data: DataHealth[] | undefined;
  error: unknown;
  pending: boolean;
  /** Horário (Recife) da última checagem, já formatado ("14h02"). */
  checkedAt: string | null;
  names: Record<string, string>;
}

/** Integridade por ponto (check-integrity): contagens reais de clima, sensores e alagamentos, com o estado devolvido pela API. */
export const IntegrityPanel: React.FC<IntegrityPanelProps> = ({ data, error, pending, checkedAt, names }) => {
  const max = {
    w: Math.max(1, ...(data ?? []).map((h) => h.totalWeatherRecords)),
    s: Math.max(1, ...(data ?? []).map((h) => h.totalSensorRecords)),
    f: Math.max(1, ...(data ?? []).map((h) => h.totalFloodEvents)),
  };
  return (
    <section aria-label="Integridade por ponto" className="flex min-h-80 min-w-0 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-3.5 lg:col-span-4 lg:min-h-0">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground">INTEGRIDADE POR PONTO</h2>
        {checkedAt && <span className="font-mono text-[11px] text-muted-foreground">checado às {checkedAt}</span>}
      </div>
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
        {pending && <p role="status" className="m-0 text-body text-muted-foreground">Verificando…</p>}
        {!!error && <p role="alert" className="m-0 text-body text-destructive">{actionErrorMessage(error, 'verificar a integridade')}</p>}
        {!data && !pending && !error && <p className="m-0 text-body text-muted-foreground">A verificação lê o banco e pode demorar; rode só quando precisar (botão Checar integridade).</p>}
        {data?.length === 0 && <p className="m-0 text-body text-muted-foreground">Nenhum ponto no relatório.</p>}
        {data?.map((h) => {
          const ok = h.status.toUpperCase() === 'OK';
          const bars: Array<[string, number, number, string]> = [['clima', h.totalWeatherRecords, max.w, 'registros de clima'], ['sensores', h.totalSensorRecords, max.s, 'registros de sensores'], ['alagam.', h.totalFloodEvents, max.f, 'alagamentos']];
          return (
            <div key={h.slug} data-health={h.slug} className="flex flex-col gap-1.5 rounded-xl bg-muted p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold">{names[h.slug] ?? h.slug}</span>
                <span className={cn('h-5 rounded-full border px-2 text-[10px] leading-[18px] font-bold', ok ? 'border-success text-success' : 'border-warning text-warning')}>{h.status}</span>
              </div>
              <div className="flex h-[30px] items-end gap-1">
                {bars.map(([label, v, m, title]) => (
                  <div key={label} title={`${n(v)} ${title}`} className="flex flex-1 flex-col items-center gap-0.5">
                    <span className="w-full rounded-[3px]" style={{ height: `${Math.max(2, Math.round((v / m) * 24))}px`, background: v > 0 ? 'var(--primary)' : 'var(--border)' }} />
                    <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground">{n(h.totalWeatherRecords)} de clima · {n(h.totalSensorRecords)} de sensores · {n(h.totalFloodEvents)} alagamentos</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
