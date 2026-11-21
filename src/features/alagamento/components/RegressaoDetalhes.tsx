import React from 'react';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import type { AlagamentoPonto } from '../schemas/alagamento.schema';
import { fmt1 } from '../utils/alagamentoText';

/**
 * Bloco técnico do card (só no modo Detalhes, seção 5.2): o que mais pesou (1º do SHAP local), quanto falta para 15 cm,
 * chuva prevista q50–q95 por prazo com validade, emissão e versões.
 */
export const RegressaoDetalhes: React.FC<{ ponto: AlagamentoPonto }> = ({ ponto }) => {
  const e = ponto.explanation;
  const top = e?.shapTop3[0];
  const versions = Object.entries(ponto.modelVersions).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ');
  return (
    <div data-testid="regressao-detalhes" className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 text-xs leading-4">
      {top && <p className="m-0"><span className="text-muted-foreground">O que mais pesou: </span>{top.text}</p>}
      {e?.counterfactualText && <p className="m-0"><span className="text-muted-foreground">Para chegar a 15 cm: </span>{e.counterfactualText}</p>}
      {ponto.horizons.length > 0 && (
        <table className="w-full text-left">
          <caption className="sr-only">Chuva prevista por prazo</caption>
          <thead className="text-muted-foreground">
            <tr><th scope="col" className="font-normal">Prazo</th><th scope="col" className="font-normal">Chuva prevista (q50–q95)</th><th scope="col" className="font-normal">Até</th></tr>
          </thead>
          <tbody className="font-mono">
            {ponto.horizons.map((h) => (
              <tr key={h.hours}>
                <td>{h.hours} h</td>
                <td>{fmt1(h.rainQ50Mm) ?? '—'}–{fmt1(h.rainQ95Mm) ?? '—'} mm</td>
                <td>{formatHoraCurta(h.validUntil) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="m-0 text-muted-foreground">
        {ponto.issuedAt ? `Emitido ${formatHoraCurta(ponto.issuedAt)}` : `Avaliado ${formatHoraCurta(ponto.evaluatedAt) ?? '—'}`}
        {versions ? ` · ${versions}` : ''}
        {ponto.codeVersion ? ` · commit ${ponto.codeVersion.slice(0, 7)}` : ''}
      </p>
    </div>
  );
};
