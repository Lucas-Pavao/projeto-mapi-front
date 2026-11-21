import { LeanTip } from '@/components/LeanTip';
import { OnlyInDetail } from '@/lib/detailMode';
import React, { useRef, useState } from 'react';
import { QueryState } from '@/components/ui/query-state';
import { useIngestionSources, useIntegrityCheck } from '@/features/admin/hooks/useAdminData';
import { SourceCard } from '@/features/admin/components/SourceCard';
import { RunsPanel } from '@/features/admin/components/RunsPanel';
import { DataSidePanel } from '@/features/admin/components/DataSidePanel';
import { AlertaLatencyPanel } from '@/features/alerta/components/AlertaLatencyPanel';
import { groupSources, isProblem } from '@/features/admin/utils/ingestion';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { AlagamentoSourceCards } from '@/features/alagamento/components/AlagamentoSourceCards';

const recifeClock = () => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' }).format(new Date()).replace(':', 'h');

export const AdminDataPage: React.FC = () => {
  const sources = useIngestionSources();
  const integrity = useIntegrityCheck();
  const points = useFloodPoints();
  const [source, setSource] = useState('');
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const runsRef = useRef<HTMLDivElement>(null);
  const names = Object.fromEntries((points.data ?? []).map((p) => [p.slug, p.name]));
  const check = () => integrity.mutate(undefined, { onSuccess: () => setCheckedAt(recifeClock()) });
  const groups = sources.data ? groupSources(sources.data) : null;
  const problems = groups?.filter((s) => isProblem(s.status)).length ?? 0;

  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 flex items-center gap-2 text-2xl leading-[30px] font-extrabold text-foreground">Saúde dos dados<LeanTip text="Coleta agendada na API: cada leitura passa por validação e quarentena antes de entrar na série consolidada. Só o administrador vê esta tela." /></h1>
          <OnlyInDetail><p className="m-0 text-[13px] text-muted-foreground">Coleta agendada na API · pipeline raw_observation → validação/quarentena → observation (ADR 0006) · perfil ADMIN</p></OnlyInDetail>
        </div>
        {groups && (
          <span aria-live="polite" className="text-[13px] text-muted-foreground">
            <strong className="text-foreground">{groups.length - problems}</strong> de {groups.length} {groups.length === 1 ? 'fonte em dia' : 'fontes em dia'}
            {problems > 0 && <span className="sr-only">, {problems} com atraso, falha ou quarentena</span>}
          </span>
        )}
      </div>
      <QueryState query={sources} what="as fontes" emptyTitle="Nenhuma fonte cadastrada.">
        {(items) => {
          const now = sources.dataUpdatedAt;
          return (
            <>
              <ul aria-label="Fontes de dados" className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                {groupSources(items).map((s) => (
                  <SourceCard key={s.source} source={s} now={now} onShowRuns={(name) => { setSource(name); runsRef.current?.scrollIntoView?.({ block: 'start' }); }} />
                ))}
                <AlagamentoSourceCards />
              </ul>
              <div ref={runsRef} className="grid min-h-96 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
                <RunsPanel sources={items.map((s) => s.source)} source={source} onSource={setSource} integrityBusy={integrity.isPending} onCheckIntegrity={check} />
                <DataSidePanel key={integrity.data || integrity.isPending || integrity.error ? 'i' : 'm'} initialTab={integrity.data || integrity.isPending || integrity.error ? 'integridade' : 'meses'} data={integrity.data} error={integrity.error} pending={integrity.isPending} checkedAt={checkedAt} names={names} />
              </div>
              <AlertaLatencyPanel />
            </>
          );
        }}
      </QueryState>
    </div>
  );
};
export default AdminDataPage;
