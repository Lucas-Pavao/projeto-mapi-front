import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/query-state';

export const ReportPage: React.FC = () => (
  <PageShell title="Relatório" description="Relatório de situação para impressão, no tema claro.">
    <EmptyState title="Nenhum relatório gerado." hint="Disponível em breve." />
  </PageShell>
);
export default ReportPage;
