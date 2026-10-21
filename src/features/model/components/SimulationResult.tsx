import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { IndexChart } from '@/components/charts/IndexChart';
import type { BucketSimulation } from '../schemas/model.schema';

const fmt = (v: number, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d });

/** Resultado da simulação: lâmina por hora, máximo, primeira hora acima do crítico e parâmetros usados. */
export const SimulationResult: React.FC<{ sim: BucketSimulation; rain: number[] }> = ({ sim, rain }) => {
  const hcrit = sim.paramsUsed.hcrit_mm;
  return (
    <section aria-label="Resultado da simulação" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-title text-foreground">Resultado (simulação, não é previsão)</h2>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-3"><dt className="text-caption text-muted-foreground">Lâmina máxima</dt><dd className="text-reading-lg text-foreground">{fmt(sim.hmaxMm)} <span className="text-body text-muted-foreground">mm</span></dd></div>
        <div className="rounded-lg border border-border bg-background p-3">
          <dt className="text-caption text-muted-foreground">Passa de {fmt(hcrit)} mm (h crítico)?</dt>
          <dd data-testid="cross" className="text-body-strong text-foreground">
            {sim.tCrossH == null ? 'Não passa nesta chuva' : `Sim, na hora ${sim.tCrossH + 1} (índice ${sim.tCrossH})`}
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-3"><dt className="text-caption text-muted-foreground">Horas simuladas</dt><dd className="text-reading-lg text-foreground">{sim.hMm.length}</dd></div>
      </dl>
      {sim.nOutsideCurve > 0 && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-body text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {sim.nOutsideCurve} {sim.nOutsideCurve === 1 ? 'hora caiu' : 'horas caíram'} fora da curva cota-volume do terreno: nestas horas o valor é extrapolado e vale menos.
        </p>
      )}
      <IndexChart title="Chuva informada" unit="mm/h" values={rain} kind="bars" colorClass="text-chart-3" />
      <IndexChart
        title="Lâmina simulada no ponto"
        unit="mm"
        values={sim.hMm}
        kind="line"
        colorClass="text-chart-1"
        hline={{ value: hcrit, label: `h crítico ${fmt(hcrit)} mm` }}
        vlineHour={sim.tCrossH != null ? { hour: sim.tCrossH + 1, label: 'cruza h crítico' } : undefined}
      />
      <details className="text-body">
        <summary className="min-h-11 cursor-pointer text-body-strong text-foreground md:min-h-0">Parâmetros usados pelo modelo</summary>
        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(sim.paramsUsed).map(([k, v]) => (
            <div key={k}><dt className="text-code text-muted-foreground">{k}</dt><dd className="text-reading text-foreground">{fmt(v, 3)}</dd></div>
          ))}
        </dl>
        <p className="mt-2 text-caption text-muted-foreground">Modelo {sim.model}. Sem controle de maré: a variante com maré só entra quando o desnível entre as referências for aprovado (ADR 0009).</p>
      </details>
    </section>
  );
};
