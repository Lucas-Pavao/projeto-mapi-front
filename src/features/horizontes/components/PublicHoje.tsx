import React, { useState } from 'react';
import { useOfficialForecast, usePublicWarnings } from '../hooks/useHorizontes';
import { HojeBlock, InmetLine } from './HojeBlock';

/**
 * Minha rua: só a linha do INMET (rotas públicas). O estado do alerta fica no resultado da página; o "dia de risco" fica
 * para quem está logado (e hoje está ausente: não validado).
 */
export const PublicHoje: React.FC<{ municipio: string | null | undefined; className?: string }> = ({ municipio, className }) => {
  const m = municipio ?? 'Recife';
  const f = useOfficialForecast(m, true);
  const w = usePublicWarnings(m);
  const [now] = useState(() => Date.now());
  return (
    <HojeBlock
      className={className}
      official={<InmetLine forecast={f.data} warnings={w.data?.warnings} loading={f.isLoading} error={f.isError} nowMs={now} />}
      nextHour={null}
    />
  );
};
