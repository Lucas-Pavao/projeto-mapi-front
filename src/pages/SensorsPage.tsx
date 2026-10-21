import React, { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useSensorsLatest } from '@/features/sensors/hooks/useSensorsLatest';
import { SensorCard } from '@/features/sensors/components/SensorCard';
import { SENSOR_TYPE_LABEL } from '@/features/sensors/utils/age';
import type { SensorType } from '@/features/sensors/schemas/sensor.schema';
import { cn } from '@/lib/utils';

const FILTERS: ReadonlyArray<{ value: SensorType | undefined; label: string }> = [
  { value: undefined, label: 'Todos' },
  { value: 'PRECIPITATION', label: SENSOR_TYPE_LABEL.PRECIPITATION },
  { value: 'RIVER_LEVEL', label: SENSOR_TYPE_LABEL.RIVER_LEVEL },
];

export const SensorsPage: React.FC = () => {
  const [type, setType] = useState<SensorType | undefined>(undefined);
  const query = useSensorsLatest(type);
  return (
    <PageShell title="Sensores" description="Última leitura de cada sensor e há quanto tempo ela chegou. Sensor sem resposta recente aparece destacado.">
      <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={type === f.value}
            onClick={() => setType(f.value)}
            className={cn('h-11 rounded-full border px-4 text-body-strong md:h-8', type === f.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <QueryState query={query} what="sensores" emptyTitle="Nenhum sensor com leitura." emptyHint={type ? 'Tente outro tipo ou volte para Todos.' : 'Quando a coleta trouxer leituras, elas aparecem aqui.'}>
        {(items) => {
          const stale = items.filter((s) => s.stale).length;
          return (
            <>
              <p className="text-caption text-muted-foreground" aria-live="polite">
                {items.length} sensor{items.length === 1 ? '' : 'es'}{stale > 0 ? `, ${stale} sem resposta recente` : ', todos respondendo'}.
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => <SensorCard key={s.sensorId} sensor={s} />)}
              </ul>
            </>
          );
        }}
      </QueryState>
    </PageShell>
  );
};
export default SensorsPage;
