import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CEMADEN_ATTRIBUTION, measuredKind, measuredText, recifeWithReference } from '../utils/measuredRain';
import type { StationAccumulation } from '../schemas/measuredRain.schema';

interface Props {
  station: StationAccumulation;
  computedAtUtc: string | null;
  stale: boolean;
  onClose: () => void;
}

const WINDOWS: ReadonlyArray<[string, keyof StationAccumulation]> = [
  ['1 h', 'acc1hMm'], ['3 h', 'acc3hMm'], ['6 h', 'acc6hMm'], ['12 h', 'acc12hMm'], ['24 h', 'acc24hMm'],
  ['48 h', 'acc48hMm'], ['72 h', 'acc72hMm'], ['96 h', 'acc96hMm'], ['120 h', 'acc120hMm'],
];

/** Detalhe da estação canônica: acumulados medidos, hora da última leitura em horário de Recife, apelidos e citação. */
export const MeasuredRainDetail: React.FC<Props> = ({ station, computedAtUtc, stale, onClose }) => {
  const last = recifeWithReference(station.lastReadingUtc);
  const computed = recifeWithReference(computedAtUtc);
  return (
    <div className="flex w-[300px] max-w-full flex-col gap-3 rounded-2xl border border-border bg-popover p-3.5 text-popover-foreground shadow-elevation-overlay">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 text-2xs font-bold text-chart-1">Chuva medida · pluviômetro</p>
          <h3 className="m-0 truncate text-sm font-bold">{station.name ?? station.canonicalId}</h3>
          <p className="m-0 text-2xs text-muted-foreground">{station.municipality}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={onClose} aria-label="Fechar estação">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      {station.status === 'NO_DATA' ? (
        <p role="status" className="m-0 rounded-lg border-2 border-dashed border-risk-unknown-edge px-3 py-2 text-xs text-muted-foreground">
          Sem dado: a estação não enviou leitura nas janelas consultadas. Isso não significa que não choveu.
        </p>
      ) : (
        <dl className="m-0 grid grid-cols-3 gap-1.5">
          {WINDOWS.map(([label, key]) => {
            const v = station[key] as number | null;
            const kind = measuredKind(v);
            return (
              <div key={label} className={kind === 'no-data' ? 'rounded-lg border border-dashed border-risk-unknown-edge px-2 py-1' : 'rounded-lg border border-border px-2 py-1'}>
                <dt className="text-2xs text-muted-foreground">{label}</dt>
                <dd className="m-0 font-mono text-xs font-bold">{measuredText(v)}</dd>
              </div>
            );
          })}
        </dl>
      )}

      <div className="flex flex-col gap-0.5 text-2xs text-muted-foreground">
        <span>Última leitura: {last ?? 'sem leitura nos últimos 5 dias'}</span>
        {computed && <span>Acumulados calculados pelo Cemaden às {computed}{stale ? ' — desatualizado' : ''}</span>}
      </div>

      {station.aliases.length > 0 && (
        <div className="text-2xs text-muted-foreground">
          <span className="font-bold">Códigos de origem: </span>
          {station.aliases.join(', ')}
        </div>
      )}
      <p className="m-0 border-t border-border pt-2 text-[10px] font-bold tracking-wide text-muted-foreground">{CEMADEN_ATTRIBUTION}</p>
    </div>
  );
};
