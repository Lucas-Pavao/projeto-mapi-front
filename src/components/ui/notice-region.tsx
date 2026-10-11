import React from 'react';
import { X, CheckCircle2, TriangleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notice } from '@/hooks/useNotices';

const KIND = {
  success: { Icon: CheckCircle2, tone: 'border-emerald-500/50 text-emerald-300', role: 'status' as const },
  info: { Icon: Info, tone: 'border-sky-500/50 text-sky-300', role: 'status' as const },
  error: { Icon: TriangleAlert, tone: 'border-red-500/60 text-red-300', role: 'alert' as const },
};

/**
 * Região viva de notificações. O contêiner é `aria-live="polite"`; erros usam role="alert"
 * (anunciados na hora). Não rouba foco e não bloqueia a página.
 */
export const NoticeRegion: React.FC<{ notices: Notice[]; onDismiss: (id: number) => void }> = ({ notices, onDismiss }) => (
  <div
    aria-live="polite"
    aria-relevant="additions"
    className="pointer-events-none fixed inset-x-2 bottom-20 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2"
  >
    {notices.map((n) => {
      const { Icon, tone, role } = KIND[n.kind];
      return (
        <div
          key={n.id}
          role={role}
          className={cn('pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-zinc-950/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl', tone)}
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-white">{n.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(n.id)}
            aria-label="Dispensar notificação"
            className="rounded-md p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      );
    })}
  </div>
);
