import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/query-state';

export const SimulatorPage: React.FC = () => (
  <PageShell title="Simulador" description="Simulação do balde M1a num ponto. É ilustrativa: não é previsão.">
    <EmptyState title="Nenhuma simulação ainda." hint="Disponível em breve." />
  </PageShell>
);
export default SimulatorPage;
