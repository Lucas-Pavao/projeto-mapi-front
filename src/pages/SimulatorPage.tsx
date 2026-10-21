import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/query-state';

export const SimulatorPage: React.FC = () => (
  <PageShell title="Simulador" description="Simulação do balde M1a num ponto. É ilustrativa: não é previsão.">
    <EmptyState title="Nenhuma simulação ainda." hint="Escolha um ponto e informe a chuva por hora. O formulário chega na F2." />
  </PageShell>
);
export default SimulatorPage;
