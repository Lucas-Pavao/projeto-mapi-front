import React from 'react';
import { MapPin } from 'lucide-react';
import type { FloodPointResponseDTO } from '@/features/map/types';
import { cn } from '@/lib/utils';

interface AdminPointListProps {
  points: FloodPointResponseDTO[];
  selectedSlug: string | null;
  togglingSlug: string | null;
  onSelect: (p: FloodPointResponseDTO) => void;
  onToggle: (p: FloodPointResponseDTO) => void;
}

const coord = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

/** Lista de pontos cadastrados: seleção para editar e interruptor de ativo (entra ou não no ciclo de previsão). */
export const AdminPointList: React.FC<AdminPointListProps> = ({ points, selectedSlug, togglingSlug, onSelect, onToggle }) => (
  <ul aria-label="Pontos críticos" className="custom-scrollbar m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto p-2">
    {points.map((p) => {
      const pluv = p.sensorConfig?.pluviometerStationIds?.length ?? 0;
      const river = p.sensorConfig?.riverLevelStationIds?.length ?? 0;
      return (
        <li key={p.id} data-slug={p.slug} data-active={p.active} className={cn('flex items-center gap-3 rounded-xl p-2.5', p.slug === selectedSlug ? 'bg-secondary' : 'bg-transparent', !p.active && 'opacity-80')}>
          <button type="button" onClick={() => onSelect(p)} aria-label={`Editar ${p.name}`} aria-pressed={p.slug === selectedSlug} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 border-0 bg-transparent p-0 text-left text-foreground">
            <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-secondary text-primary"><MapPin className="size-[18px]" aria-hidden="true" /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm leading-5 font-bold">{p.name}</span>
              <span className="truncate font-mono text-[11px] leading-4 text-muted-foreground">{p.slug} · {coord(p.latitude)}, {coord(p.longitude)}</span>
              <span className="text-xs leading-4 text-muted-foreground">{p.municipality ?? 'Município não informado'} · {pluv} pluviômetro(s) ligado(s){river > 0 ? ' · rio' : ''}</span>
            </span>
          </button>
          <label className="flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold">
            <input type="checkbox" role="switch" checked={p.active} disabled={togglingSlug === p.slug} onChange={() => onToggle(p)} aria-label={`${p.name}: ponto ativo`} className="m-0 size-4 accent-primary" />
            ativo
          </label>
        </li>
      );
    })}
  </ul>
);
