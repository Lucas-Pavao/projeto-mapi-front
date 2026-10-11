import React, { useState } from 'react';
import { ChevronUp, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TerrainLegend } from './TerrainLegend';
import type { TerrainStatus } from '../utils/terrain';

interface TerrainControlProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  status?: TerrainStatus;
  className?: string;
}

function startsOpen(): boolean {
  try {
    return typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 768px)').matches : true;
  } catch {
    return true;
  }
}

/**
 * Interruptor rotulado da camada de terreno + legenda (visível só com a camada ligada). Em celular
 * o cartão começa recolhido num botão de ícone (abre sob demanda); em tela larga começa aberto.
 * Se a camada falhar com o cartão recolhido, ele se abre para mostrar o erro.
 */
export const TerrainControl: React.FC<TerrainControlProps> = ({ enabled, onChange, status = 'off', className }) => {
  const [expanded, setExpanded] = useState(startsOpen);
  const shown = expanded || (enabled && status === 'error');

  if (!shown) {
    return (
      <section aria-label="Terreno (hipsometria)" data-terrain-status={status} className="self-end">
        <button
          type="button"
          aria-expanded={false}
          aria-label={`Terreno (hipsometria), ${enabled ? 'ligado' : 'desligado'}. Abrir controle`}
          title="Terreno (hipsometria)"
          onClick={() => setExpanded(true)}
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-2xl border bg-black/40 shadow-2xl shadow-black/50 backdrop-blur-xl hover:bg-white/10',
            enabled ? 'border-primary/40 bg-white/10 text-primary' : 'border-white/10 text-zinc-400',
          )}
        >
          <Mountain className="h-5 w-5" aria-hidden="true" />
          {enabled && <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />}
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="terrain-control-title"
      data-terrain-status={status}
      className={cn('rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl shadow-black/50', className)}
    >
      <div className="flex items-center">
        <h2 id="terrain-control-title" className="m-0 min-w-0 flex-1">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => onChange(!enabled)}
            className="flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-2xs font-black uppercase tracking-widest text-white"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Mountain className="h-4 w-4 shrink-0" aria-hidden="true" />
              Terreno (hipsometria)
            </span>
            <span
              aria-hidden="true"
              className={cn('relative h-4 w-7 shrink-0 rounded-full border border-white/30 transition-colors', enabled ? 'bg-emerald-600' : 'bg-zinc-700')}
            >
              <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', enabled ? 'left-3.5' : 'left-0.5')} />
            </span>
          </button>
        </h2>
        <button
          type="button"
          aria-expanded
          aria-controls="terrain-control-body"
          aria-label="Recolher controle de terreno"
          onClick={() => setExpanded(false)}
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-300 hover:bg-white/10"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div id="terrain-control-body">
        <div aria-live="polite">
          {enabled && status === 'loading' && <p className="px-3 pb-2 text-2xs text-zinc-300">Carregando terreno…</p>}
          {enabled && status === 'error' && (
            <p role="alert" className="px-3 pb-2 text-2xs text-red-300">
              Não foi possível carregar o terreno. O restante do mapa segue funcionando.
            </p>
          )}
        </div>
        {enabled && status !== 'error' && <TerrainLegend />}
      </div>
    </section>
  );
};
