import React from 'react';
import { X, CheckCircle2, TriangleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notice } from '@/hooks/useNotices';

// Cores de sistema (success/info/destructive). Nunca comunicam risco de alagamento.
const KIND = {
  success: { Icon: CheckCircle2, tone: 'border-success/60 text-success', role: 'status' as const },
  info: { Icon: Info, tone: 'border-info/60 text-info', role: 'status' as const },
  error: { Icon: TriangleAlert, tone: 'border-destructive/60 text-destructive', role: 'alert' as const },
};

/**
 * Região viva de notificações. O contêiner é `aria-live="polite"`; erros usam role="alert"
 * (anunciados na hora). Não rouba foco e não bloqueia a página. `className` reposiciona.
 */
export const NoticeRegion: React.FC<{ notices: Notice[]; onDismiss: (id: number) => void; className?: string }> = ({ notices, onDismiss, className }) => (
  <div
    aria-live="polite"
    aria-relevant="additions"
    className={cn(
      'pointer-events-none fixed inset-x-2 bottom-20 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2',
      className,
    )}
  >
    {notices.map((n) => {
      const { Icon, tone, role } = KIND[n.kind];
      return (
        <div
          key={n.id}
          role={role}
          className={cn('pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-popover px-4 py-3 text-sm shadow-elevation-overlay', tone)}
        >
          <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-popover-foreground">{n.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(n.id)}
            aria-label="Dispensar notificação"
            className="-m-2 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      );
    })}
  </div>
);
