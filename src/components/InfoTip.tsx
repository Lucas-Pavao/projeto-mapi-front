import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { TIP_W as W, tipPosition } from '@/lib/tipPosition';

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
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return; // ao reabrir, o layout effect recalcula antes de pintar
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect();
      if (!b) return;
      setPos(tipPosition(b, tipRef.current?.offsetHeight ?? 60, window.innerWidth, window.innerHeight, side, align));
    };
    place();
    // segunda passada com a altura real do balão
    const raf = requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [open, side, align]);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && !tipRef.current?.contains(t)) { setPinned(false); setOpen(false); }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [pinned]);

  return (
    <span ref={ref} className={cn('relative inline-flex align-middle', className)}>
      <button
        ref={btnRef}
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
      {open && createPortal(
        <span
          ref={tipRef}
          role="tooltip"
          id={id}
          style={pos ? { left: pos.left, top: pos.top, width: pos.width } : { left: -9999, top: 0, width: W }}
          className="pointer-events-none fixed z-[1000] rounded-md border border-border bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-popover-foreground shadow-lg"
        >
          {text}
        </span>,
        document.body,
      )}
    </span>
  );
};
