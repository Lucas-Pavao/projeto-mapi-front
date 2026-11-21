import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InfoTip } from '@/components/InfoTip';
import { Button } from '@/components/ui/button';
import { exportService } from '@/features/map/services/export.service';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { FloodChip } from '@/features/alagamento/components/AlertaRegressao';
import { ExperimentalTag } from '@/features/alagamento/components/RegressaoCard';
import { VisitorChip } from '@/features/alagamento/components/PointRegressaoBlock';
import { titleCasePlace } from '@/features/map/utils/overview';
import { OnlyInDetail } from '@/lib/detailMode';

const Mono: React.FC<{ children: React.ReactNode }> = ({ children }) => <dd className="m-0 font-mono text-[16px] font-bold leading-[22px]">{children}</dd>;

interface Props {
  point: FloodPointResponseDTO;
  /** Alerta por regressão do ponto (só ADMIN em modo sombra). */
  alagamento?: AlagamentoPonto | null;
  isAdmin?: boolean;
  /** Leitura do alerta em andamento ou com falha (só ADMIN). */
  status?: 'loading' | 'error' | 'ok';
}

/** Cabeçalho do ponto (5.5): selo do nível do alerta por regressão, Experimental, nome, emissão, horizonte e modelo; ações. */
export const PointHeader: React.FC<Props> = ({ point, alagamento, isAdmin = false, status = 'ok' }) => {
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
  const sub = [point.municipality ? titleCasePlace(point.municipality) : null, point.description].filter(Boolean).join(' · ');
  const validUntil = alagamento?.horizons.map((h) => h.validUntil).filter(Boolean).sort().pop() ?? null;
  const chip = !isAdmin ? <VisitorChip />
    : alagamento ? <FloodChip ponto={alagamento} />
      : (
        <span data-testid="flood-chip" data-level="SEM_DADO" className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/50 bg-muted px-2.5 text-sm font-bold text-muted-foreground">
          {status === 'loading' ? 'Lendo…' : 'Alerta sem leitura'}
          <InfoTip text="Sem leitura não é sem alerta: o nível deste ponto é desconhecido até o próximo ciclo." side="bottom" />
        </span>
      );
  return (
    <section aria-label="Alerta de alagamento do ponto" className="flex flex-wrap items-start gap-5 rounded-2xl border border-border bg-card px-5 py-[18px]">
      <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">{chip}<ExperimentalTag /></div>
        <h1 className="m-0 text-[28px] font-extrabold leading-[34px] tracking-[-0.015em]">{point.name}</h1>
        <p className="m-0 text-[14px] leading-5 text-muted-foreground">
          {sub}
          <OnlyInDetail><> · <span className="font-mono">{point.slug}</span></></OnlyInDetail>
        </p>
      </div>
      <dl className="m-0 grid self-center grid-cols-[repeat(4,auto)] gap-x-6 gap-y-1 text-[12px] leading-4">
        <dt className="text-muted-foreground">Emitido</dt>
        <dt className="text-muted-foreground">Válida até</dt>
        <dt className="text-muted-foreground">Horizonte</dt>
        <dt className="text-muted-foreground">Modelo · chuva</dt>
        <Mono>{formatHoraCurta(alagamento?.issuedAt) ?? '—'}</Mono>
        <Mono>{formatHoraCurta(validUntil) ?? '—'}</Mono>
        <Mono>1, 3 e 6 h</Mono>
        <Mono>rain_v1 + balde</Mono>
      </dl>
      <div className="flex min-w-[220px] self-center flex-col gap-2">
        <Link to="/relatos" className="flex h-[38px] items-center justify-center rounded-lg bg-primary px-4 text-[13px] font-bold leading-4 text-primary-foreground no-underline hover:text-primary-foreground hover:opacity-90">
          Reportar cenário no local
        </Link>
        <Button type="button" variant="outline" className="h-8 text-[14px] text-foreground" disabled={csv === 'busy'} onClick={() => void exportar()}>
          {csv === 'ok' ? 'CSV gerado ✓' : csv === 'busy' ? 'Gerando CSV…' : 'Exportar dataset (CSV)'}
        </Button>
        {csv === 'erro' && <span role="alert" className="text-[12px] text-destructive">Não foi possível gerar o CSV.</span>}
      </div>
    </section>
  );
};
