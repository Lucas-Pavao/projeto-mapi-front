import React from 'react';
import { CloudRain } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SourceTag } from '@/components/risk/SourceTag';
import { sourceKindsOf } from '@/components/risk/sourceKinds';
import { Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { MONTH_STATUS_TEXT } from '@/features/points/utils/rainCandidates';
import { cn } from '@/lib/utils';
import { CEMADEN_ATTRIBUTION, type CanonicalStation, type StationHourly } from '../schemas/station.schema';
import { REASON_LONG, divergentHours, hourlyCsv, quarantineTotal, sourceLabel } from '../utils/stationView';
import { StationHourlyChart } from './StationHourlyChart';

const MONTH_TONE = { OK: 'border-success', UNCHECKED: 'border-warning', FAIL: 'border-destructive', OFFLINE: 'border-border' } as const;

/** Detalhe de uma estação canônica do Cemaden: série horária por fonte usada, divergências ao vivo × PED, apelidos e quarentena. */
export const StationDetail: React.FC<{ station: CanonicalStation; hourly: UseQueryResult<StationHourly> }> = ({ station: st, hourly }) => {
  const hours = hourly.data?.hours ?? [];
  const last = hours[hours.length - 1];
  const kinds = sourceKindsOf(st.sources);
  const month = st.monthCheck;
  const divs = divergentHours(hours);
  const tol = hourly.data?.toleranceMm ?? 0.5;
  const valueText = !last ? '—' : last.valueMm == null ? 'sem dado' : `${num(last.valueMm)} mm/h`;
  const dim = month?.status === 'FAIL' || month?.status === 'OFFLINE';
  const exportar = () => {
    const url = URL.createObjectURL(new Blob([hourlyCsv(hours)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapi-${st.canonicalId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <section aria-label="Sensor selecionado" className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card px-5 py-[18px] lg:col-span-12">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-secondary text-primary"><CloudRain className="size-6" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[24px] font-extrabold leading-[30px]">Pluviômetro {st.name || st.canonicalId}</h2>
          <p className="m-0 mt-0.5 text-[14px] leading-5 text-muted-foreground">Estação canônica <span className="font-mono">{st.canonicalId}</span> · Cemaden{st.municipality ? ` · ${st.municipality}` : ''}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5" data-testid="station-badges">
            {kinds.map((k) => <SourceTag key={k} kind={k} className="h-6 px-2.5 text-[11px]" />)}
            {kinds.includes('PED_ONLY') && <span className="inline-flex h-6 items-center text-[12px] text-muted-foreground">sem apelido ao vivo próximo</span>}
            {month && (
              <span className={cn('inline-flex h-6 items-center rounded-full border-[1.5px] px-2.5 text-[12px] font-bold', MONTH_TONE[month.status])}>
                {MONTH_STATUS_TEXT[month.status]}{month.reasons.length > 0 ? ` · ${month.reasons.join(', ')}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={cn('font-mono text-[34px] font-extrabold leading-10', last?.valueMm == null && 'text-muted-foreground')}>{valueText}</div>
          <div className={cn('text-[12px] leading-4', last?.valueMm == null ? 'text-warning' : 'text-muted-foreground')}>
            {!last ? '—' : last.valueMm == null ? 'lacuna: hora sem valor não vira zero' : `valor usado agora: ${sourceLabel(last.usedSource)}${last.usedSource === 'CEMADEN' ? ' (a PED chega cerca de 20 min depois)' : ''}`}
          </div>
        </div>
      </section>
      <Panel aria-label="Série do dia" className="min-h-[320px] gap-2 lg:col-span-7 lg:min-h-0">
        <div className="flex items-baseline justify-between gap-2">
          <PanelTitle>Chuva por hora (mm/h) · fonte usada em cada barra</PanelTitle>
          <span className="text-[12px] text-muted-foreground">{dim ? 'barras apagadas: estação fora da chuva do ponto neste mês' : 'faixa cinza: lacuna'}</span>
        </div>
        {hourly.isError ? <p role="alert" className="m-0 text-[13px] text-warning">Não foi possível carregar a série horária desta estação.</p>
          : hourly.isPending ? <p className="m-0 text-[13px] text-muted-foreground">Carregando série…</p>
          : hours.length === 0 ? <p className="m-0 text-[13px] text-muted-foreground">Sem horas na janela.</p>
          : <StationHourlyChart hours={hours} dim={dim} />}
        <div className="flex flex-wrap gap-3.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-3.5 rounded-sm bg-primary" />PED (vale na mesma hora)</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-3.5 rounded-sm bg-chart-3" />ao vivo (enquanto a PED não chega)</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-3.5 rounded-sm bg-risk-unknown/30" />sem dado</span>
          <span>25,2 = forte · 50,3 = IDF · círculo cortado = pico isolado removido</span>
        </div>
      </Panel>
      <Panel aria-label="Resumo" className="lg:col-span-5 lg:min-h-0 lg:overflow-y-auto">
        <PanelTitle>Duas fontes, uma estação</PanelTitle>
        {month && <p className="m-0 rounded-[10px] border border-border px-3 py-2 text-[12px] leading-4">{month.reasons.length > 0 ? month.reasons.map((r) => REASON_LONG[r] ?? r).join('. ') : month.status === 'OK' ? 'Aprovada na checagem espacial do mês' : month.status === 'OFFLINE' ? 'Sem nenhuma hora com valor no mês' : 'Sem checagem neste mês'}{month.ruleVersion ? ` (${month.ruleVersion})` : ''}</p>}
        <div className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2.5"><span className="text-[13px] font-semibold">Divergências</span><span className="font-mono text-[15px] font-bold">{st.divergenceCount ?? '—'}</span></div>
        <div className="rounded-[10px] border border-border px-3 py-2.5" data-testid="quarantine">
          <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Quarentena</span><span className="font-mono text-[15px] font-bold">{quarantineTotal(st)}</span></div>
          {Object.entries(st.quarantine).map(([k, v]) => <div key={k} className="flex justify-between text-[11px] text-muted-foreground"><span className="font-mono">{k}</span><span className="font-mono">{v}</span></div>)}
        </div>
        {divs.length > 0 && (
          <>
            <PanelTitle className="mt-1.5">Diferença por hora (ao vivo × PED)</PanelTitle>
            <table className="w-full border-collapse text-[12px]" data-testid="divergences">
              <thead><tr className="text-muted-foreground"><th className="text-left font-bold">Hora</th><th className="text-right font-bold">Ao vivo</th><th className="text-right font-bold">PED</th><th className="text-right font-bold">Diferença</th></tr></thead>
              <tbody>
                {divs.map((h) => (
                  <tr key={h.hourEndUtc} className="font-mono">
                    <td>{formatHoraCurta(h.hourEndUtc)}</td><td className="text-right">{num(h.liveMm)} mm</td><td className="text-right">{num(h.pedMm)} mm</td>
                    <td className="text-right font-bold text-warning">{num(Math.abs((h.pedMm ?? 0) - (h.liveMm ?? 0)), 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="m-0 text-[11px] leading-[15px] text-muted-foreground">Na mesma hora vale a PED. Diferença acima de {num(tol, 1)} mm vai para station_hour_divergence.</p>
          </>
        )}
      </Panel>
      <section aria-label="Proveniência" className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-[18px] py-3 text-[12px] leading-4 text-muted-foreground lg:col-span-12">
        <span>Fonte <strong className="text-foreground">{st.primarySource ?? 'Cemaden'}</strong></span>
        <span data-testid="aliases">Apelidos <span className="font-mono text-foreground">{st.aliases.length > 0 ? st.aliases.join(', ') : '—'}</span></span>
        <span>UTC no banco, America/Recife na tela</span>
        <span>{st.attribution ?? hourly.data?.attribution ?? CEMADEN_ATTRIBUTION}</span>
        <span className="ml-auto"><Button type="button" variant="outline" size="sm" className="text-foreground" disabled={hours.length === 0} onClick={exportar}>Exportar 24 h (CSV)</Button></span>
      </section>
    </>
  );
};
