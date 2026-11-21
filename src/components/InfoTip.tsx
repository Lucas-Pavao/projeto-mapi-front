import React, { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  /** Texto da explicação: vai no aria-label e no balão. */
  text: string;
  className?: string;
  /** Lado do balão em relação ao botão. */
  side?: 'top' | 'bottom';
  /** Alinhamento do balão: centro do botão, ou encostado à direita (ⓘ na borda direita do card). */
  align?: 'center' | 'end';
}

/**
 * Ícone ⓘ das telas enxutas (seção 5.11): botão de 16 px com "i". O texto explicativo sai do corpo do card e fica aqui.
 * Teclado: foco abre, Esc fecha. Mouse: hover abre. Toque: um toque abre, outro fecha. O texto está sempre no aria-label.
 */
export const InfoTip: React.FC<Props> = ({ text, className, side = 'top', align = 'center' }) => {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setPinned(false); setOpen(false); }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [pinned]);

  return (
    <span ref={ref} className={cn('relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={text}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        data-testid="info-tip"
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/60 text-[10px] font-bold leading-none text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => { if (!pinned) setOpen(false); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { if (!pinned) setOpen(false); }}
        onClick={() => { setPinned((p) => !p); setOpen((o) => !pinned || !o); }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setPinned(false); setOpen(false); } }}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'absolute z-50 w-64 max-w-[80vw] rounded-md border border-border bg-popover px-3 py-2 text-xs font-normal leading-snug text-popover-foreground shadow-lg',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2',
          )}
        >
          {text}
        </span>
      )}
    </span>
  );
};
