import React, { useRef, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form-field';
import { useIngestionRuns, useIngestionSources, useIntegrityCheck } from '@/features/admin/hooks/useAdminData';
import { SourceCard } from '@/features/admin/components/SourceCard';
import { isProblem } from '@/features/admin/utils/ingestion';
import { formatRecife } from '@/features/map/utils/datetime';
import { actionErrorMessage } from '@/lib/apiError';

const PAGE_SIZE = 20;

const Runs: React.FC<{ sources: string[]; source: string; onSource: (s: string) => void }> = ({ sources, source, onSource }) => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const query = useIngestionRuns({ source, status, page, size: PAGE_SIZE });
  return (
    <section id="execucoes" aria-label="Execuções de ingestão" className="flex flex-col gap-3">
      <h2 className="text-title text-foreground">Execuções</h2>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-body-strong text-foreground">Fonte
          <Select value={source} onChange={(e) => { onSource(e.target.value); setPage(0); }} className="min-w-44">
            <option value="">Todas</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-body-strong text-foreground">Situação
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="min-w-44">
            <option value="">Todas</option>
            <option value="SUCCEEDED">Sucesso</option>
            <option value="FAILED">Falha</option>
            <option value="RUNNING">Em andamento</option>
          </Select>
        </label>
      </div>
      <QueryState query={query} what="as execuções" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhuma execução com estes filtros.">
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[40rem] text-left text-body">
                <caption className="sr-only">Execuções de ingestão, da mais recente para a mais antiga</caption>
                <thead>
                  <tr className="border-b border-border text-caption text-muted-foreground">
                    <th scope="col" className="p-2 font-medium">Início</th>
                    <th scope="col" className="p-2 font-medium">Fonte</th>
                    <th scope="col" className="p-2 font-medium">Tipo</th>
                    <th scope="col" className="p-2 font-medium">Situação</th>
                    <th scope="col" className="p-2 text-right font-medium">Lidos</th>
                    <th scope="col" className="p-2 text-right font-medium">Válidos</th>
                    <th scope="col" className="p-2 text-right font-medium">Quarentena</th>
                    <th scope="col" className="p-2 font-medium">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((r) => (
                    <tr key={r.id} data-run-id={r.id} className="border-b border-border/60 align-top">
                      <td className="p-2 text-reading text-foreground">{formatRecife(r.startedAt) ?? '—'}</td>
                      <td className="p-2 text-foreground">{r.source ?? '—'}</td>
                      <td className="p-2 text-caption text-muted-foreground">{[r.kind, r.mode].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="p-2 text-foreground">{r.status ?? '—'}</td>
                      <td className="p-2 text-right text-reading">{r.fetched ?? '—'}</td>
                      <td className="p-2 text-right text-reading">{r.valid ?? '—'}</td>
                      <td className="p-2 text-right text-reading">{r.quarantined ?? '—'}</td>
                      <td className="max-w-64 break-words p-2 text-caption text-destructive">{r.errorSummary ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalElements > PAGE_SIZE && (
              <nav aria-label="Páginas" className="flex items-center justify-between gap-2">
                <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span className="text-caption text-muted-foreground">Página {page + 1} de {Math.ceil(data.totalElements / PAGE_SIZE)}</span>
                <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={(page + 1) * PAGE_SIZE >= data.totalElements} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </nav>
            )}
          </>
        )}
      </QueryState>
    </section>
  );
};

export const AdminDataPage: React.FC = () => {
  const sources = useIngestionSources();
  const integrity = useIntegrityCheck();
  const [source, setSource] = useState('');
  const runsRef = useRef<HTMLDivElement>(null);

  return (
    <PageShell title="Dados" description="Estado da ingestão por fonte, execuções recentes e integridade dos dados por ponto.">
      <QueryState query={sources} what="as fontes" emptyTitle="Nenhuma fonte cadastrada.">
        {(items) => {
          const problems = items.filter((s) => isProblem(s.status)).length;
          return (
            <>
              <p className="text-caption text-muted-foreground" aria-live="polite">
                {items.length} fonte{items.length === 1 ? '' : 's'}{problems > 0 ? `, ${problems} com atraso, falha ou quarentena` : ', todas em dia'}.
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Fontes de dados">
                {items.map((s) => (
                  <SourceCard key={s.source} source={s} onShowRuns={(name) => { setSource(name); runsRef.current?.scrollIntoView?.({ block: 'start' }); }} />
                ))}
              </ul>
              <div ref={runsRef}><Runs sources={items.map((s) => s.source)} source={source} onSource={setSource} /></div>
            </>
          );
        }}
      </QueryState>

      <section aria-label="Integridade por ponto" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-title text-foreground">Integridade por ponto</h2>
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={integrity.isPending} onClick={() => integrity.mutate()}>
            {integrity.isPending ? 'Verificando…' : 'Verificar agora'}
          </Button>
        </div>
        {integrity.isError && <p role="alert" className="text-body text-destructive">{actionErrorMessage(integrity.error, 'verificar a integridade')}</p>}
        {integrity.data && (integrity.data.length === 0 ? (
          <p className="text-body text-muted-foreground">Nenhum ponto no relatório.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[32rem] text-left text-body">
              <caption className="sr-only">Registros por ponto</caption>
              <thead><tr className="border-b border-border text-caption text-muted-foreground">
                <th scope="col" className="p-2 font-medium">Ponto</th><th scope="col" className="p-2 text-right font-medium">Clima</th><th scope="col" className="p-2 text-right font-medium">Sensores</th><th scope="col" className="p-2 text-right font-medium">Alagamentos</th><th scope="col" className="p-2 font-medium">Situação</th>
              </tr></thead>
              <tbody>
                {integrity.data.map((h) => (
                  <tr key={h.slug} className="border-b border-border/60">
                    <td className="p-2 text-code text-foreground">{h.slug}</td>
                    <td className="p-2 text-right text-reading">{h.totalWeatherRecords}</td>
                    <td className="p-2 text-right text-reading">{h.totalSensorRecords}</td>
                    <td className="p-2 text-right text-reading">{h.totalFloodEvents}</td>
                    <td className="p-2 text-foreground">{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {!integrity.data && !integrity.isPending && !integrity.isError && <p className="text-body text-muted-foreground">A verificação lê o banco e pode demorar; rode só quando precisar.</p>}
      </section>
    </PageShell>
  );
};
export default AdminDataPage;
