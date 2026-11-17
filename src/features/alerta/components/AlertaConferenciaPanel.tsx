import React from 'react';
import { QueryState } from '@/components/ui/query-state';
import { useAlertaConferencia } from '../hooks/useAlertaOperacao';

/** Conferência diária do alerta, últimos 30 dias (item 4.2), na tela Modelo. */
export const AlertaConferenciaPanel: React.FC = () => {
  const q = useAlertaConferencia(30);
  return (
    <section aria-label="Conferência do alerta" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4" data-testid="alerta-conferencia">
      <h2 className="m-0 text-sm font-bold">Alerta por ponto · conferência diária (30 dias, modo sombra)</h2>
      <QueryState query={q} what="conferência do alerta" isEmpty={(d) => d.rows.length === 0} emptyTitle="Nenhum dia conferido ainda." emptyHint="A conferência roda às 03:35 UTC sobre a véspera.">
        {(d) => (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
              <div className="rounded-lg bg-muted p-2"><div className="text-muted-foreground">Eventos FORTE medidos</div><div className="font-mono text-lg font-bold">{d.forteEvents}</div></div>
              <div className="rounded-lg bg-muted p-2"><div className="text-muted-foreground">Com alerta antes</div><div className="font-mono text-lg font-bold">{d.forteWarned}</div></div>
              <div className="rounded-lg bg-muted p-2"><div className="text-muted-foreground">Antecedência mediana</div><div className="font-mono text-lg font-bold">{d.medianLeadMinutes == null ? '—' : `${Math.round(d.medianLeadMinutes)} min`}</div></div>
              <div className="rounded-lg bg-muted p-2"><div className="text-muted-foreground">Falsos por evento</div><div className="font-mono text-lg font-bold">{d.forteEvents === 0 ? '—' : d.falsePerEvent.toFixed(1)}</div></div>
              <div className="rounded-lg bg-muted p-2"><div className="text-muted-foreground">Tempo em SEM_DADO</div><div className="font-mono text-lg font-bold">{(100 * d.semDadoFraction).toFixed(0)}%</div></div>
            </div>
            {d.note && <p className="m-0 text-[11px] text-warning">{d.note}</p>}
            <p className="m-0 text-[11px] text-muted-foreground">
              Episódios de ALAGAMENTO_PROVAVEL no período: {d.floodEpisodes}. Sem verdade de campo: guardados para cruzar com as ocorrências do Cemaden e da Defesa Civil.
            </p>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Dia</th><th>Ponto</th><th>FORTE</th><th>Avisados</th><th>Episódios</th><th>Falsos</th><th>SEM_DADO</th></tr></thead>
              <tbody>
                {d.rows.slice(0, 50).map((r) => (
                  <tr key={`${r.day}-${r.slug}`}>
                    <td className="py-0.5 font-mono">{r.day}</td><td>{r.slug}</td><td className="font-mono">{r.forteEvents}</td><td className="font-mono">{r.forteWarned}</td>
                    <td className="font-mono">{r.alertEpisodes}</td><td className="font-mono">{r.falseEpisodes}</td>
                    <td className="font-mono">{r.evaluatedMinutes > 0 ? `${Math.round((100 * r.semDadoMinutes) / r.evaluatedMinutes)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </QueryState>
    </section>
  );
};
