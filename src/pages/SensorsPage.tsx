import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useSensorsLatest } from '@/features/sensors/hooks/useSensorsLatest';
import { formatRecife } from '@/features/map/utils/datetime';

const TYPE_LABEL = { PRECIPITATION: 'Chuva', RIVER_LEVEL: 'Nível do rio' } as const;

export const SensorsPage: React.FC = () => {
  const query = useSensorsLatest();
  return (
    <PageShell title="Sensores" description="Última leitura de cada sensor e há quanto tempo ela chegou.">
      <QueryState query={query} what="sensores" emptyTitle="Nenhum sensor com leitura.">
        {(items) => (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <li key={s.sensorId} className="rounded-xl border border-border bg-card p-4">
                <p className="font-mono text-xs text-muted-foreground">{s.sensorId}</p>
                <p className="text-sm font-semibold text-foreground">{TYPE_LABEL[s.type]}</p>
                <p className="font-mono text-2xl font-semibold text-foreground">{s.value != null ? s.value.toLocaleString('pt-BR') : '—'}</p>
                <p className="text-xs text-muted-foreground">
                  Atualizado às {formatRecife(s.observedAt) ?? '—'}
                  {s.stale && <span className="ml-2 font-bold text-warning">Sem leitura recente</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageShell>
  );
};
export default SensorsPage;
