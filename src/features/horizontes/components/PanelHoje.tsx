import React, { useState } from 'react';
import { InfoTip } from '@/components/InfoTip';
import type { FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';
import type { OfficialWarning } from '@/features/warnings/schemas/officialWarning.schema';
import { useOfficialForecast } from '../hooks/useHorizontes';
import { HojeBlock, InmetLine } from './HojeBlock';

/** Município da previsão do painel "Agora na RMR": a capital (a previsão do INMET é por município). */
export const PANEL_MUNICIPIO = 'Recife';

interface Props {
  warnings?: OfficialWarning[];
  /** Contagem por nível do alerta por regressão; null = leitura falhou ou visitante. */
  counts: Record<FloodLevel, number> | null;
  isAdmin: boolean;
  className?: string;
}

/** Resumo da próxima hora para a RMR, a partir da mesma contagem do painel. Sem leitura nunca vira "sem alerta". */
export const nextHourSummary = (counts: Record<FloodLevel, number> | null): string => {
  if (!counts) return 'sem leitura do alerta';
  const parts: string[] = [];
  if (counts.ALERTA) parts.push(`${counts.ALERTA} em alerta`);
  if (counts.ATENCAO) parts.push(`${counts.ATENCAO} em atenção`);
  if (counts.SEM_DADO) parts.push(`${counts.SEM_DADO} sem dado`);
  if (parts.length === 0) return counts.SEM_ALERTA ? 'nenhum ponto em alerta' : 'sem pontos avaliados';
  return parts.join(' · ');
};

/** Bloco "Hoje" do painel "Agora na RMR": INMET de Recife, dia de risco (ausente) e a próxima hora dos pontos. */
export const PanelHoje: React.FC<Props> = ({ warnings = [], counts, isAdmin, className }) => {
  const q = useOfficialForecast(PANEL_MUNICIPIO);
  const [now] = useState(() => Date.now());
  return (
    <HojeBlock
      className={className}
      official={<InmetLine forecast={q.data} warnings={warnings} loading={q.isLoading} error={q.isError} nowMs={now} />}
      nextHour={(
        <div data-testid="hoje-mapi" className="flex items-center gap-2">
          <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-border px-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">MAPi</span>
          <span className="text-xs text-muted-foreground">Próxima hora</span>
          {isAdmin ? (
            <span data-testid="hoje-mapi-resumo" className="text-xs font-semibold">{nextHourSummary(counts)}</span>
          ) : (
            <span data-testid="hoje-mapi-em-teste" className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
              Alerta em teste<InfoTip text="O alerta de alagamento do MAPi é experimental: enquanto a validação não for aprovada, só o administrador vê o nível." />
            </span>
          )}
        </div>
      )}
    />
  );
};
