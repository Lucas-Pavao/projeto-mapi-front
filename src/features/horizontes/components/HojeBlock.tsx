import React from 'react';
import { InfoTip } from '@/components/InfoTip';
import { OnlyInDetail } from '@/lib/detailMode';
import { cn } from '@/lib/utils';
import type { FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';
import { CHIP_CLASS, DOT_CLASS, toneOf } from '@/features/alagamento/utils/alagamentoText';
import type { OfficialWarning } from '@/features/warnings/schemas/officialWarning.schema';
import type { Horizons, OfficialForecast } from '../schemas/horizontes.schema';
import { currentAndNext, entryLabel, seenAtText, tempText, type Entry } from '../utils/turnos';

export const HOJE_INFO = 'Três leituras separadas, que não se somam: a do INMET é a previsão oficial; as do MAPi são experimentais.';
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Selo de origem neutro: o INMET nunca leva as cores de risco do MAPi. */
const OriginTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-border px-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
    {children}
  </span>
);

const EntryRow: React.FC<{ e: Entry }> = ({ e }) => {
  const t = tempText(e);
  return (
    <p className="m-0 text-xs leading-4">
      <span className="font-semibold">{entryLabel(e)}</span>
      {e.summary ? ` · ${e.summary}` : ' · sem texto'}
      {t && <span className="text-muted-foreground"> · {t}</span>}
    </p>
  );
};

interface InmetProps {
  forecast?: OfficialForecast | null;
  warnings?: OfficialWarning[];
  warningsReasonText?: string | null;
  loading?: boolean;
  error?: boolean;
  nowMs: number;
}

/** Linha oficial: aviso vigente (cor e texto do INMET) e a previsão do turno atual e do próximo, com "visto às". */
export const InmetLine: React.FC<InmetProps> = ({ forecast, warnings = [], warningsReasonText, loading = false, error = false, nowMs }) => {
  const { current, next } = forecast ? currentAndNext(forecast, nowMs) : { current: null, next: null };
  const seen = seenAtText(current?.lastSeenAt ?? null);
  const w = warnings[0];
  const empty = !loading && (error || !forecast || !current);
  const emptyText = error ? 'Não foi possível ler a previsão do INMET agora.'
    : forecast?.reasonText ?? 'Sem previsão do INMET para hoje.';
  return (
    <div data-testid="hoje-inmet" className="flex gap-2">
      <OriginTag>INMET</OriginTag>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {w && (
          <p data-testid="hoje-inmet-aviso" className="m-0 flex items-center gap-1.5 text-xs font-semibold leading-4">
            <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full border border-border"
              style={w.colorHex && HEX.test(w.colorHex.trim()) ? { backgroundColor: w.colorHex.trim() } : undefined} />
            <span className="truncate">Aviso: {w.severity}{w.description ? ` · ${w.description}` : ''}</span>
          </p>
        )}
        {loading && <p className="m-0 text-xs text-muted-foreground">Lendo a previsão do INMET…</p>}
        {empty && <p data-testid="hoje-inmet-sem-dado" className="m-0 text-xs text-muted-foreground">Previsão: sem dado · {emptyText}</p>}
        {current && <EntryRow e={current} />}
        {next && <EntryRow e={next} />}
        {current && (
          <p className="m-0 flex items-center gap-1 text-[11px] leading-[14px] text-muted-foreground">
            <span>previsão oficial do INMET{seen ? ` · ${seen}` : ''}{forecast?.stale ? ' · desatualizada' : ''}</span>
            <InfoTip text={forecast?.note ?? 'Previsão oficial do INMET.'} side="top" />
          </p>
        )}
        {warningsReasonText && (
          <OnlyInDetail><p className="m-0 text-[11px] text-muted-foreground">{warningsReasonText}</p></OnlyInDetail>
        )}
      </div>
    </div>
  );
};

const LEVEL_TEXT: Record<FloodLevel, (h: number) => string> = {
  ALERTA: (h) => `Alerta em ${h} h`,
  ATENCAO: (h) => `Atenção em ${h} h`,
  SEM_ALERTA: (h) => `Sem alerta em ${h} h`,
  SEM_DADO: () => 'Sem dado',
};

/** Próxima hora (MAPi): o alerta por ponto, como já está. Em teste não mostra nível; sem dado nunca vira "sem alerta". */
export const NextHourLine: React.FC<{ next: Horizons['nextHour'] | null | undefined; loading?: boolean }> = ({ next, loading = false }) => {
  let body: React.ReactNode;
  if (loading) body = <span className="text-xs text-muted-foreground">Lendo o alerta…</span>;
  else if (!next) body = <span className="text-xs text-muted-foreground">Sem leitura do alerta agora.</span>;
  else if (next.inTest) {
    body = (
      <span data-testid="hoje-mapi-em-teste" className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
        Alerta em teste<InfoTip text="O alerta de alagamento do MAPi é experimental: enquanto a validação não for aprovada, só o administrador vê o nível." />
      </span>
    );
  } else {
    const level = next.level ?? 'SEM_DADO';
    const tone = toneOf(level);
    body = (
      <span data-testid="hoje-mapi-nivel" data-level={level}
        className={cn('inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-bold', CHIP_CLASS[tone], level === 'SEM_DADO' && 'border-dashed')}>
        <span aria-hidden="true" className={cn('size-1.5 rounded-full', DOT_CLASS[tone])} />
        {LEVEL_TEXT[level](next.worstHorizonHours ?? 6)}
        {level === 'SEM_DADO' && <InfoTip text={`Sem dado não é sem alerta${next.reasonText ? `: ${next.reasonText}` : '.'}`} />}
      </span>
    );
  }
  return (
    <div data-testid="hoje-mapi" className="flex items-center gap-2">
      <OriginTag>MAPi</OriginTag>
      <span className="text-xs text-muted-foreground">Próxima hora</span>
      {body}
    </div>
  );
};

/** Dia de risco (MAPi): só aparece se existir. Ausente, só o modo Detalhes diz por quê. */
export const DayRiskLine: React.FC<{ dayRisk: Horizons['dayRisk'] | null | undefined }> = ({ dayRisk }) => {
  if (!dayRisk) return null;
  if (!dayRisk.available) {
    return (
      <OnlyInDetail>
        <div data-testid="hoje-dia-de-risco-ausente" className="flex items-center gap-2">
          <OriginTag>MAPi</OriginTag>
          <span className="text-xs text-muted-foreground">Dia de risco: não validado</span>
          <InfoTip text={dayRisk.reasonText ?? 'O dia de risco do MAPi não foi validado.'} />
        </div>
      </OnlyInDetail>
    );
  }
  return null; // o serviço do dia de risco só existe se o bloco C passar; até lá nunca chega aqui
};

interface BlockProps {
  official: React.ReactNode;
  dayRisk?: React.ReactNode;
  nextHour: React.ReactNode;
  className?: string;
}

/** Bloco "Hoje": INMET, dia de risco (se existir) e próxima hora, nessa ordem e sem combinar. */
export const HojeBlock: React.FC<BlockProps> = ({ official, dayRisk, nextHour, className }) => (
  <section data-testid="hoje" aria-label="Hoje" className={cn('flex flex-col gap-2 rounded-[10px] bg-muted px-2.5 py-2', className)}>
    <h3 className="m-0 flex items-center gap-1 text-xs font-bold leading-4">Hoje<InfoTip text={HOJE_INFO} /></h3>
    {official}
    {dayRisk}
    {nextHour}
  </section>
);
