import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QueryState } from '@/components/ui/query-state';
import { Select } from '@/components/ui/form-field';
import { formatRecife } from '@/features/map/utils/datetime';
import { cn } from '@/lib/utils';
import { useIngestionRuns } from '../hooks/useAdminData';

const PAGE_SIZE = 20;
const n = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR'));

const runColor = (status: string | null | undefined) => {
  const s = (status ?? '').toUpperCase();
  if (s === 'SUCCEEDED') return 'var(--success)';
  if (s === 'FAILED') return 'var(--destructive)';
  if (s === 'RUNNING') return 'var(--info)';
  return 'var(--muted-foreground)';
};

interface RunsPanelProps {
  sources: string[];
  source: string;
  onSource: (s: string) => void;
  /** Botão "Checar integridade" (GET sob demanda). */
  integrityBusy: boolean;
  onCheckIntegrity: () => void;
}


/** Execuções de ingestão (INGESTION_RUN): filtros, ação de checagem e a tabela com progresso e contagens. */
export const RunsPanel: React.FC<RunsPanelProps> = ({ sources, source, onSource, integrityBusy, onCheckIntegrity }) => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const query = useIngestionRuns({ source, status, page, size: PAGE_SIZE });
  return (
    <section id="execucoes" aria-label="Execuções de ingestão" className="flex min-h-96 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-8 lg:min-h-0">
      <div className="flex flex-col gap-2.5 border-b border-border px-[18px] py-3.5">
        <h2 className="m-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground">EXECUÇÕES DE INGESTÃO (INGESTION_RUN)</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="runs-fonte">Fonte</label>
          <Select id="runs-fonte" aria-label="Fonte" value={source} onChange={(e) => { onSource(e.target.value); setPage(0); }} className="h-11 w-44 md:h-[34px]">
            <option value="">Todas as fontes</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select aria-label="Situação" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="h-11 w-44 md:h-[34px]">
            <option value="">Todas as situações</option>
            <option value="SUCCEEDED">Sucesso</option>
            <option value="FAILED">Falha</option>
            <option value="RUNNING">Em andamento</option>
          </Select>
          <button type="button" onClick={onCheckIntegrity} disabled={integrityBusy} className="flex h-11 items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 text-xs leading-4 font-bold text-foreground disabled:opacity-55 md:h-[34px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" /></svg>
            {integrityBusy ? 'Checando…' : 'Checar integridade'}
          </button>
        </div>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
        <QueryState query={query} what="as execuções" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhuma execução com estes filtros.">
          {(data) => (
            <>
              <table className="w-full min-w-[46rem] table-fixed border-collapse text-left">
                <caption className="sr-only">Execuções de ingestão, da mais recente para a mais antiga</caption>
                <colgroup><col className="w-[90px]" /><col className="w-[24%]" /><col className="w-[110px]" /><col className="w-[22%]" /><col className="w-[70px]" /><col className="w-[70px]" /><col className="w-[70px]" /><col className="w-[70px]" /></colgroup>
                <thead>
                  <tr className={cn('border-b border-border text-[11px] font-bold tracking-[0.04em] text-muted-foreground')}>
                    <th scope="col" className="px-2 py-2 pl-[18px]">ID</th>
                    <th scope="col" className="px-2 py-2">FONTE · TIPO</th>
                    <th scope="col" className="px-2 py-2">STATUS</th>
                    <th scope="col" className="px-2 py-2">PROGRESSO</th>
                    <th scope="col" className="px-2 py-2 text-right">BUSCADOS</th>
                    <th scope="col" className="px-2 py-2 text-right">VÁLIDOS</th>
                    <th scope="col" className="px-2 py-2 text-right">QUARENT.</th>
                    <th scope="col" className="px-2 py-2 pr-[18px] text-right">LACUNAS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((r) => {
                    const fg = runColor(r.status);
                    const running = (r.status ?? '').toUpperCase() === 'RUNNING';
                    return (
                      <tr key={r.id} data-run-id={r.id} className="border-b border-border text-[13px] align-middle">
                        <td className="px-2 py-[9px] pl-[18px] font-mono text-xs text-muted-foreground" title={`${r.id}${r.startedAt ? ` · início ${formatRecife(r.startedAt)}` : ''}`}>{r.id.slice(0, 4)}…</td>
                        <td className="px-2 py-[9px]"><strong>{r.source ?? '—'}</strong> <span className="text-muted-foreground">· {[r.kind, r.mode].filter(Boolean).join(' / ') || '—'}</span>{r.errorSummary && <span className="text-destructive"> · {r.errorSummary}</span>}</td>
                        <td className="px-2 py-[9px] text-xs font-bold" style={{ color: fg }}><span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className={cn('size-2 rounded-full', running && 'animate-pulse')} style={{ background: fg }} />{r.status ?? '—'}</span></td>
                        <td className="px-2 py-[9px]" aria-hidden="true"><span className="block h-1.5 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full', running && 'animate-pulse')} style={{ width: r.status ? '100%' : '0%', background: fg }} /></span></td>
                        <td className="px-2 py-[9px] text-right font-mono">{n(r.fetched)}</td>
                        <td className="px-2 py-[9px] text-right font-mono">{n(r.valid)}</td>
                        <td className={cn('px-2 py-[9px] text-right font-mono', (r.quarantined ?? 0) > 0 && 'text-warning')}>{n(r.quarantined)}</td>
                        <td className="px-2 py-[9px] pr-[18px] text-right font-mono">{n(r.gaps)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.totalElements > PAGE_SIZE && (
                <nav aria-label="Páginas" className="flex items-center justify-between gap-2 p-3">
                  <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                  <span className="text-caption text-muted-foreground">Página {page + 1} de {Math.ceil(data.totalElements / PAGE_SIZE)}</span>
                  <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={(page + 1) * PAGE_SIZE >= data.totalElements} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                </nav>
              )}
            </>
          )}
        </QueryState>
      </div>
    </section>
  );
};
