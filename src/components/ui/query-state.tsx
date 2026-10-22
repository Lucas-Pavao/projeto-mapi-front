import React from 'react';
import { CircleAlert, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
}

interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** Decide se o dado carregado conta como vazio. Padrão: array sem itens. */
  isEmpty?: (data: T) => boolean;
  /** Rótulo do que está carregando, em minúsculas ("alertas"). */
  what: string;
  emptyTitle?: string;
  emptyHint?: string;
  children: (data: T) => React.ReactNode;
}

// col-span-full e w-full: o estado ocupa o lugar do conteúdo inteiro, mesmo quando a página é grade ou linha flex.
const box = 'col-span-full flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-6 text-center';

/** Estados de tela para dados de servidor: carregando, erro (com nova tentativa), vazio e conteúdo. */
export function QueryState<T>({ query, isEmpty, what, emptyTitle, emptyHint, children }: QueryStateProps<T>) {
  if (query.isPending) {
    return (
      <div role="status" className={box}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="text-body text-muted-foreground">Carregando {what}…</p>
      </div>
    );
  }
  if (query.isError || query.data === undefined) {
    return (
      <div role="alert" className={box}>
        <CircleAlert className="size-5 text-destructive" aria-hidden="true" />
        <p className="text-body-strong text-foreground">Não foi possível carregar {what}.</p>
        <p className="text-caption text-muted-foreground">Confira a conexão e tente de novo.</p>
        <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={() => void query.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }
  const empty = isEmpty ? isEmpty(query.data) : Array.isArray(query.data) && query.data.length === 0;
  if (empty) {
    return (
      <div className={box}>
        <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-body-strong text-foreground">{emptyTitle ?? `Nenhum item em ${what}.`}</p>
        {emptyHint && <p className="text-caption text-muted-foreground">{emptyHint}</p>}
      </div>
    );
  }
  return <>{children(query.data)}</>;
}

/** Estado vazio avulso, para telas que dependem de uma escolha do usuário antes de consultar. */
export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className={box}>
    <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
    <p className="text-body-strong text-foreground">{title}</p>
    {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
  </div>
);
