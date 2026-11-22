import React, { useState } from 'react';
import { useHorizontes } from '../hooks/useHorizontes';
import { DayRiskLine, HojeBlock, InmetLine, NextHourLine } from './HojeBlock';

/** Bloco "Hoje" do card do ponto: lê GET /api/horizontes/{slug} (as três camadas, sem combinar). */
export const PointHoje: React.FC<{ slug: string; className?: string }> = ({ slug, className }) => {
  const q = useHorizontes(slug);
  const [now] = useState(() => Date.now());
  const h = q.data;
  return (
    <HojeBlock
      className={className}
      official={<InmetLine forecast={h?.official.forecast} warnings={h?.official.warnings} warningsReasonText={h?.official.warningsReasonText}
        loading={q.isLoading} error={q.isError} nowMs={now} />}
      dayRisk={<DayRiskLine dayRisk={h?.dayRisk} />}
      nextHour={<NextHourLine next={h?.nextHour} loading={q.isLoading} />}
    />
  );
};
