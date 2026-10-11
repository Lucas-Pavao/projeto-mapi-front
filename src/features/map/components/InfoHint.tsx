import React, { useId } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Dica curta acessível: aparece com foco ou hover; o texto fica no DOM para leitor de tela. */
export const InfoHint: React.FC<{ text: string; label: string; className?: string }> = ({ text, label, className }) => {
  const id = useId();
  return (
    <span className={cn('group/hint relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="rounded-full p-0.5 text-zinc-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-60 rounded-md border border-white/15 bg-zinc-900 p-2 text-2xs font-normal normal-case leading-snug tracking-normal text-zinc-200 not-italic shadow-lg group-hover/hint:block group-focus-within/hint:block"
      >
        {text}
      </span>
    </span>
  );
};
