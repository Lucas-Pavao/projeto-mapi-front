import React from 'react';
import { CloudRain, TriangleAlert, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRecife } from '@/features/map/utils/datetime';
import type { SensorFreshness } from '../schemas/sensor.schema';
import { SENSOR_TYPE_LABEL, SENSOR_TYPE_UNIT, formatAge } from '../utils/age';

/** Cartão de um sensor: valor com unidade, hora da leitura e, se velha, "sem resposta" (nunca o último valor como se fosse atual). */
export const SensorCard: React.FC<{ sensor: SensorFreshness }> = ({ sensor: s }) => {
  const Icon = s.type === 'PRECIPITATION' ? CloudRain : Waves;
  const unit = s.unit || SENSOR_TYPE_UNIT[s.type];
  return (
    <li data-stale={s.stale} className={cn('flex flex-col gap-1 rounded-xl border bg-card p-4', s.stale ? 'border-warning/50' : 'border-border')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-body-strong text-foreground">{s.stationName || s.sensorId}</p>
          <p className="break-words text-code text-muted-foreground">{s.sensorId}{s.municipality ? ` · ${s.municipality}` : ''}{s.source ? ` · ${s.source}` : ''}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-2xs font-bold text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" /> {SENSOR_TYPE_LABEL[s.type]}
        </span>
      </div>
      <p className={cn('text-reading-lg', s.stale ? 'text-muted-foreground' : 'text-foreground')}>
        {s.value != null ? s.value.toLocaleString('pt-BR') : '—'} <span className="text-body text-muted-foreground">{unit}</span>
      </p>
      <p className="text-caption text-muted-foreground">
        Leitura de {formatRecife(s.observedAt) ?? '—'} ({formatAge(s.ageSeconds)})
      </p>
      {s.stale && (
        <p role="status" className="flex items-center gap-1 text-caption font-bold text-warning">
          <TriangleAlert className="size-3.5" aria-hidden="true" /> Sem resposta recente: este valor pode não valer mais.
        </p>
      )}
    </li>
  );
};
