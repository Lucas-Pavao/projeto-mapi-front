import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { degradationText, showsExperimentalLabel } from '@/components/risk/risk';
import { Button } from '@/components/ui/button';
import { exportService } from '@/features/map/services/export.service';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import { formatRecife } from '@/features/map/utils/datetime';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { PredictionSummary } from '../schemas/prediction.schema';

const Mono: React.FC<{ children: React.ReactNode }> = ({ children }) => <dd className="m-0 font-mono text-[16px] font-bold leading-[22px]">{children}</dd>;

/** Cabeçalho do ponto: classe de risco com ícone e rótulo, aviso experimental, nome, metadados da previsão e ações. */
export const PointHeader: React.FC<{ point: FloodPointResponseDTO; prediction: PredictionSummary | null }> = ({ point, prediction }) => {
  const [csv, setCsv] = useState<'idle' | 'busy' | 'ok' | 'erro'>('idle');
  const exportar = async () => {
    setCsv('busy');
    try {
      const text = await exportService.getUnifiedIADataCsv(point.slug);
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapi-${point.slug}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setCsv('ok');
      setTimeout(() => setCsv('idle'), 2000);
    } catch {
      setCsv('erro');
    }
  };
  const unknown = prediction?.riskLevel === 'UNKNOWN';
  const sub = [point.municipality, point.description].filter(Boolean).join(' · ');
  return (
    <section aria-label="Risco atual" className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card px-5 py-[18px]">
      <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {prediction ? <RiskBadge level={prediction.riskLevel} probability={prediction.probability} className="text-[13px]" /> : <RiskBadge level="UNKNOWN" />}
          {prediction && showsExperimentalLabel(prediction) && <ExperimentalBadge />}
        </div>
        <h1 className="m-0 text-[28px] font-extrabold leading-[34px] tracking-[-0.015em]">{point.name}</h1>
        <p className="m-0 text-[14px] leading-5 text-muted-foreground">
          {sub && <>{sub} · </>}
          <span className="font-mono">{point.slug}</span>
        </p>
        {unknown && (
          <p data-testid="unknown-detail" className="m-0 w-fit rounded-lg border border-dashed border-border px-2.5 py-1 text-[13px] leading-[18px]">
            <span className="font-semibold">Motivo:</span> <span className="text-muted-foreground">{degradationText(prediction.degradationReason)}</span>
            {' · '}
            <span className="font-semibold">Última previsão válida:</span>{' '}
            <span className="text-muted-foreground">{prediction.lastValidIssuedAt ? formatRecife(prediction.lastValidIssuedAt) : 'nenhuma registrada'}</span>
          </p>
        )}
      </div>
      <dl className="m-0 grid grid-cols-[repeat(4,auto)] gap-x-6 gap-y-1 text-[12px] leading-4">
        <dt className="text-muted-foreground">Emitida</dt>
        <dt className="text-muted-foreground">Válida até</dt>
        <dt className="text-muted-foreground">Horizonte</dt>
        <dt className="text-muted-foreground">Modelo</dt>
        <Mono>{formatHoraCurta(prediction?.issuedAt) ?? '—'}</Mono>
        <Mono>{formatHoraCurta(prediction?.validUntil) ?? '—'}</Mono>
        <Mono>{prediction?.horizonHours != null ? `${prediction.horizonHours} h` : '—'}</Mono>
        <Mono>{prediction?.modelVersion ?? '—'}</Mono>
      </dl>
      <div className="flex min-w-[220px] flex-col gap-2">
        <Link to="/relatos" className="flex h-[38px] items-center justify-center rounded-lg bg-primary px-4 text-[13px] font-bold leading-4 text-primary-foreground no-underline hover:text-primary-foreground hover:opacity-90">
          Reportar cenário no local
        </Link>
        <Button type="button" variant="outline" disabled={csv === 'busy'} onClick={() => void exportar()} className="h-8 text-[14px]">
          {csv === 'ok' ? 'CSV gerado ✓' : csv === 'busy' ? 'Gerando CSV…' : 'Exportar dataset (CSV)'}
        </Button>
        {csv === 'erro' && <span role="alert" className="text-[12px] text-destructive">Não foi possível gerar o CSV.</span>}
      </div>
    </section>
  );
};
