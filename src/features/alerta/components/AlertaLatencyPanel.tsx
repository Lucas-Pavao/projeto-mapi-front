import React from 'react';
import { QueryState } from '@/components/ui/query-state';
import { useAlertaLatencia, useAlertaRelatorios } from '../hooks/useAlertaOperacao';
import type { Latency } from '../schemas/operacao.schema';

const LABEL: Record<string, string> = {
  estacao_coleta: 'Estação → coleta',
  coleta_banco: 'Coleta → banco',
  banco_ciclo: 'Banco → ciclo',
  ciclo_ia: 'Ciclo → IA',
  ia_estado: 'IA → estado',
  estado_sse: 'Estado → SSE',
  total: 'Total (estação → SSE)',
};
const ORDER = Object.keys(LABEL);
const fmt = (s: number | null) => (s == null ? '—' : s >= 120 ? `${(s / 60).toFixed(1)} min` : `${s.toFixed(1)} s`);

const Table: React.FC<{ data: Latency; wet: boolean }> = ({ data, wet }) => {
  const rows = ORDER.map((k) => data.segments.find((s) => s.segment === k && s.wetHour === wet)).filter(Boolean);
  if (rows.length === 0) return <p className="m-0 text-xs text-muted-foreground">Sem medida {wet ? 'em hora com chuva' : 'em hora seca'} no período.</p>;
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-left text-muted-foreground"><th className="py-1">Trecho</th><th>n</th><th>Mediana</th><th>p90</th><th>Máximo</th></tr></thead>
      <tbody>
        {rows.map((s) => s && (
          <tr key={s.segment} className={s.segment === 'total' ? 'font-bold' : ''}>
            <td className="py-0.5">{LABEL[s.segment]}</td><td className="font-mono">{s.n}</td>
            <td className="font-mono">{fmt(s.medianS)}</td><td className="font-mono">{fmt(s.p90S)}</td><td className="font-mono">{fmt(s.maxS)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Atraso do caminho do alerta por trecho (item 2.1), na tela Dados. Orçamento: p90 do total < 5 min em hora com chuva. */
export const AlertaLatencyPanel: React.FC = () => {
  const q = useAlertaLatencia(7);
  const rep = useAlertaRelatorios();
  return (
    <section aria-label="Atraso do alerta" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4" data-testid="alerta-latencia">
      <h2 className="m-0 text-sm font-bold">Atraso do alerta, da estação ao envio (7 dias)</h2>
      <QueryState query={q} what="atraso do alerta" isEmpty={(d) => d.segments.length === 0} emptyTitle="Ainda sem ciclo medido.">
        {(d) => (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="m-0 mb-1 text-xs font-bold">Hora com chuva (≥ 0,2 mm) · orçamento p90 &lt; {d.budgetP90Minutes} min{' '}
                {d.withinBudgetWet == null ? '' : d.withinBudgetWet ? '· dentro' : '· FORA'}</p>
              <Table data={d} wet />
              {d.note && <p className="m-0 mt-1 text-[11px] text-warning" data-testid="latencia-nota">{d.note}</p>}
            </div>
            <div>
              <p className="m-0 mb-1 text-xs font-bold">Hora seca</p>
              <Table data={d} wet={false} />
            </div>
          </div>
        )}
      </QueryState>
      <div className="text-xs text-muted-foreground">
        Relatório do primeiro dia com chuva acima de 10 mm: {rep.data && rep.data.length > 0
          ? rep.data.map((r) => `${r.day} (${r.maxPointRainMm.toFixed(1)} mm, ${r.withinBudgetWet == null ? 'sem hora com chuva medida' : r.withinBudgetWet ? 'dentro do orçamento' : 'fora do orçamento'})`).join('; ')
          : 'ainda não houve dia assim; o job está armado.'}
      </div>
    </section>
  );
};
