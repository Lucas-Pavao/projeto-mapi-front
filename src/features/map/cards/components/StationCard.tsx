import React from 'react';
import { Link } from 'react-router-dom';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import { CEMADEN_ATTRIBUTION } from '@/features/sensors/schemas/station.schema';
import type { StationCardData } from '../schemas/stationCard.schema';
import {
  TONE_BORDER, TONE_TEXT, TONE_TINT, TONE_TOP, accText, aliasText, liveText, monthText, nowText, pedText, quarantineText, roleTag, sourceClass, sourceText, stateMeta, stateNote,
} from '../utils/stationCardView';

const BAR_W = 292;
const BAR_H = 50;

const Bars: React.FC<{ blocks: StationCardData['blocks']; name: string }> = ({ blocks, name }) => {
  const slot = BAR_W / Math.max(1, blocks.length);
  const max = Math.max(1, ...blocks.map((b) => b.mm ?? 0));
  const withValue = blocks.filter((b) => b.mm != null).length;
  return (
    <svg viewBox={`0 0 ${BAR_W} ${BAR_H + 4}`} role="img" aria-label={`Chuva a cada 10 minutos nas últimas 3 horas em ${name}: ${withValue} de ${blocks.length} blocos com valor`} className="block h-[54px] w-full" data-testid="station-bars">
      {blocks.map((b, i) => {
        const x = i * slot + 1;
        const w = slot - 2.5;
        if (b.mm == null || b.source == null) {
          // Bloco sem dado: contorno tracejado, nunca barra de zero.
          return <rect key={b.endUtc} data-block="gap" x={x} y={2} width={w} height={BAR_H} rx={2} fill="transparent" stroke="var(--warning)" strokeDasharray="3 2" opacity={0.8} />;
        }
        const h = Math.max(1.5, (b.mm / max) * BAR_H);
        const fill = b.peakRemoved ? 'var(--muted-foreground)' : b.source === 'CEMADEN_PED' ? 'var(--primary)' : 'var(--chart-3)';
        return <rect key={b.endUtc} data-block={b.peakRemoved ? 'peak' : b.source} x={x} y={BAR_H + 2 - h} width={w} height={h} rx={2} fill={fill} />;
      })}
    </svg>
  );
};

interface Props {
  card: StationCardData;
  onClose?: () => void;
  /** Abre o ponto crítico da lista "entra na chuva de". */
  onOpenPoint?: (slug: string) => void;
}

/** Card do pluviômetro (B6): 8 estados, uma nota por vez, nada vira zero. Reutilizado no popup do mapa e na folha do celular. */
export const StationCard: React.FC<Props> = ({ card: c, onClose, onOpenPoint }) => {
  const meta = stateMeta(c);
  const note = stateNote(c);
  const now = nowText(c);
  const month = monthText(c);
  const name = c.name ?? c.canonicalId;
  const first = c.blocks[0];
  const last = c.blocks[c.blocks.length - 1];
  return (
    <section role="dialog" aria-label={`Pluviômetro ${name}`} data-state={c.state} data-pedonly={c.pedOnly}
      className={cn('flex w-[320px] max-w-full min-h-0 shrink overflow-y-auto overscroll-contain scroll [scrollbar-gutter:stable] flex-col gap-3 rounded-[14px] border border-t-4 border-border bg-popover py-3.5 pl-3.5 pr-1 text-foreground shadow-elevation-overlay', TONE_TOP[meta.tone])}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span data-testid="state-chip" className={cn('inline-flex min-h-[22px] items-center gap-1.5 rounded-full border-[1.5px] px-2 py-[3px] text-[11px] font-bold leading-[14px]', TONE_BORDER[meta.tone], TONE_TEXT[meta.tone], meta.dashed && 'border-dashed')}>
            <span aria-hidden="true" className={cn('size-[7px] shrink-0 rounded-full border-[1.5px]', TONE_BORDER[meta.tone], meta.dashed ? 'bg-transparent' : 'bg-current')} />
            {meta.label}
          </span>
          {c.pedOnly && c.state !== 'NORMAL' && <span data-testid="ped-only-tag" className="ml-1.5 inline-flex h-[22px] items-center rounded-full border border-primary px-2 text-[11px] font-bold text-primary">só PED</span>}
          <p className="m-0 mt-1.5 text-base font-extrabold leading-[22px]">{name}</p>
          <p className="m-0 text-xs leading-4 text-muted-foreground">Pluviômetro Cemaden · <span className="font-mono">{c.canonicalId}</span></p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar card do pluviômetro" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex items-end justify-between gap-2.5">
        <div><div className="text-[11px] leading-[14px] text-muted-foreground">Chuva agora</div><div data-testid="now" className={cn('font-mono text-[26px] font-extrabold leading-8', now.warn && 'text-warning')}>{now.value}</div></div>
        <div className="text-right"><div className="text-[11px] leading-[14px] text-muted-foreground">valor exibido vem de</div><div data-testid="source" className={cn('text-[13px] font-bold leading-[18px]', sourceClass(c))}>{sourceText(c)}</div></div>
      </div>

      <div>
        <Bars blocks={c.blocks} name={name} />
        <div className="flex justify-between font-mono text-[10px] leading-[14px] text-muted-foreground"><span>{formatHoraCurta(first?.endUtc) ?? '—'}</span><span>últimas 3 h</span><span>{formatHoraCurta(last?.endUtc) ?? '—'}</span></div>
        <div className="mt-0.5 flex gap-2.5 text-[10px] leading-[14px] text-muted-foreground">
          <span><span aria-hidden="true" className="inline-block size-2 rounded-sm bg-primary" /> PED</span>
          <span><span aria-hidden="true" className="inline-block size-2 rounded-sm bg-chart-3" /> ao vivo</span>
          <span><span aria-hidden="true" className="inline-block size-2 rounded-sm border border-dashed border-warning" /> sem dado</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-muted p-2"><div className="text-[11px] leading-[14px] text-muted-foreground">Ao vivo (CEMADEN)</div><div data-testid="live" className="font-mono text-[13px] font-bold leading-[18px]">{liveText(c)}</div></div>
        <div className="rounded-lg bg-muted p-2"><div className="text-[11px] leading-[14px] text-muted-foreground">PED (CEMADEN_PED)</div><div data-testid="ped" className="font-mono text-[13px] font-bold leading-[18px]">{pedText(c)}</div></div>
      </div>

      <div className="grid grid-cols-3 gap-1.5" data-testid="accs">
        {([['1 h', c.acc1hMm], ['3 h', c.acc3hMm], ['24 h', c.acc24hMm]] as const).map(([l, v]) => (
          <div key={l} className="min-w-0 rounded-lg border border-border px-2 py-1.5"><div className="text-[10px] leading-[13px] text-muted-foreground">{l}</div><div className={cn('truncate text-[13px] font-bold leading-[18px]', v == null ? 'font-sans text-warning' : 'font-mono')}>{accText(v)}</div></div>
        ))}
      </div>

      {note && (
        <div role="status" data-testid="note" className={cn('flex gap-2 rounded-[10px] border-[1.5px] px-2.5 py-2 text-xs leading-[17px]', TONE_BORDER[note.tone], TONE_TINT[note.tone])}>
          <Info className={cn('mt-px size-4 shrink-0', TONE_TEXT[note.tone])} aria-hidden="true" />
          <span><strong>{note.title}</strong> {note.text}</span>
        </div>
      )}

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 text-xs leading-4">
        <dt className="text-muted-foreground">Checagem do mês</dt><dd className={cn('m-0 font-bold', TONE_TEXT[month.tone])}>{month.text}</dd>
        <dt className="text-muted-foreground">Quarentena hoje</dt><dd className="m-0">{quarantineText(c.quarantineToday)}</dd>
        <dt className="text-muted-foreground">Aliases</dt><dd className="m-0 font-mono text-[11px]">{aliasText(c)}</dd>
      </dl>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-extrabold tracking-[.06em] text-muted-foreground">ENTRA NA CHUVA DE</span>
        {c.uses.length === 0 && <span className="text-xs text-muted-foreground">Nenhum ponto crítico a até 5 km.</span>}
        {c.uses.map((u) => {
          const tag = roleTag(u);
          const label = <><span className="font-semibold">{u.name}</span> <span className="whitespace-nowrap font-mono font-normal text-muted-foreground">{u.distanceM < 1000 ? `${Math.round(u.distanceM)} m` : `${(u.distanceM / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`}</span></>;
          return (
            <div key={u.slug} data-use={u.role} className="flex items-center justify-between gap-2 text-xs leading-4">
              {onOpenPoint ? <button type="button" onClick={() => onOpenPoint(u.slug)} className="cursor-pointer border-0 bg-transparent p-0 text-left text-foreground hover:underline">{label}</button> : <span>{label}</span>}
              <span className={cn('inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-bold', tag.className)}>{tag.text}</span>
            </div>
          );
        })}
      </div>

      <Link to="/sensores" className="flex h-10 items-center justify-center rounded-[10px] bg-primary text-[13px] font-bold text-primary-foreground no-underline hover:text-primary-foreground hover:opacity-90">Ver série e divergências</Link>
      <p className="m-0 text-[9px] leading-3 tracking-[.02em] text-muted-foreground">
        {c.attribution ?? CEMADEN_ATTRIBUTION} · {c.state === 'NO_RESPONSE' ? (c.lastReadingUtc ? `última leitura ${formatHoraCurta(c.lastReadingUtc)}` : 'sem leitura em 30 dias') : `atualizado ${c.lastReadingUtc ? formatHoraCurta(c.lastReadingUtc) : '—'}`}
      </p>
    </section>
  );
};
