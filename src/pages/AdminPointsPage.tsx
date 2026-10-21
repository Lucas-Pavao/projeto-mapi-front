import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';

export const AdminPointsPage: React.FC = () => {
  const query = useFloodPoints();
  return (
    <PageShell title="Pontos" description="Pontos críticos cadastrados. Edição e cadastro chegam na F2.">
      <QueryState query={query} what="os pontos" emptyTitle="Nenhum ponto cadastrado.">
        {(points) => (
          <ul className="grid gap-2 sm:grid-cols-2">
            {points.map((p) => (
              <li key={p.id}>
                <Link to={`/pontos/${p.slug}`} className="flex min-h-11 flex-col justify-center rounded-xl border border-border bg-card p-4 hover:bg-muted">
                  <span className="text-body-strong text-foreground">{p.name}</span>
                  <span className="text-caption text-muted-foreground">{p.municipality ?? 'Município não informado'} · {p.active ? 'ativo' : 'inativo'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageShell>
  );
};
export default AdminPointsPage;
