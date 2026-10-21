import React, { useState } from 'react';
import { useAlertRules, useSaveRule } from '../hooks/useAlertRules';
import type { Alert, AlertKind, AlertRule, AlertRuleInput } from '../schemas/alert.schema';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { actionErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

type NoticeFn = (kind: 'success' | 'error' | 'info', message: string) => unknown;

const globalRule = (rules: readonly AlertRule[] | undefined, kind: AlertKind) => rules?.find((r) => r.kind === kind && !r.floodPointSlug && !r.stationId);
const toInput = ({ id, createdBy, createdAt, updatedAt, ...rest }: AlertRule): AlertRuleInput => {
  void id; void createdBy; void createdAt; void updatedAt;
  return rest;
};
const ADJUST = 'Ajuste do operador na Central de alertas';
const adjustedSource = (prev?: string | null) => (!prev ? ADJUST : prev.startsWith(ADJUST) ? prev : `${ADJUST}; antes: ${prev}`);

/** Controle deslizante que só grava ao soltar (ponteiro, teclado ou saída de foco). */
const RuleSlider: React.FC<{ label: string; unit: string; min: number; max: number; step: number; digits: number; value: number; disabled: boolean; onCommit: (v: number) => void }> = ({ label, unit, min, max, step, digits, value, disabled, onCommit }) => {
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;
  const commit = () => { if (draft != null && draft !== value) onCommit(draft); setDraft(null); };
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between text-[13px] font-bold leading-[18px]">{label} <span className="font-mono">{num(shown, digits)} {unit}</span></span>
      <input
        type="range" min={min} max={max} step={step} value={shown} disabled={disabled}
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerUp={commit} onKeyUp={commit} onBlur={commit}
        className="m-0 w-full accent-primary"
      />
    </label>
  );
};

const CHANNELS: ReadonlyArray<{ key: 'BROWSER' | 'email' | 'whats' | 'tg'; label: string; ready: boolean }> = [
  { key: 'BROWSER', label: 'Navegador', ready: true },
  { key: 'email', label: 'E-mail', ready: false },
  { key: 'whats', label: 'WhatsApp', ready: false },
  { key: 'tg', label: 'Telegram', ready: false },
];

/** Regras da Central: nível mínimo, chuva, maré e canais, ligados às regras globais da API. */
export const QuickRules: React.FC<{ notify: NoticeFn; latest: Alert | undefined; onAll: () => void }> = ({ notify, latest, onAll }) => {
  const rules = useAlertRules();
  const save = useSaveRule();
  const risk = globalRule(rules.data, 'RISK_LEVEL');
  const rain = globalRule(rules.data, 'RAIN_RATE');
  const tide = globalRule(rules.data, 'TIDE_ABOVE');

  const put = (kind: AlertKind, current: AlertRule | undefined, patch: Partial<AlertRuleInput>, ok: string) => {
    const base: AlertRuleInput = current ? toInput(current) : { kind, enabled: true, channels: ['BROWSER'] };
    save.mutate({ id: current?.id, input: { ...base, ...patch } }, {
      onSuccess: () => notify('success', ok),
      onError: (e) => notify('error', actionErrorMessage(e, 'salvar a regra')),
    });
  };
  const minRisk = risk?.minRisk ?? 'MEDIUM';
  const browserOn = [risk, rain, tide].filter((r): r is AlertRule => !!r).some((r) => (r.channels ?? ['BROWSER']).includes('BROWSER'));
  const setBrowser = (on: boolean) => {
    for (const [kind, r] of [['RISK_LEVEL', risk], ['RAIN_RATE', rain], ['TIDE_ABOVE', tide]] as const) {
      if (r) put(kind, r, { channels: on ? ['BROWSER'] : [] }, on ? 'Aviso no navegador ligado.' : 'Aviso no navegador desligado.');
    }
  };

  return (
    <section aria-label="Regras de alerta" className="flex min-h-0 min-w-0 flex-col gap-3.5 rounded-2xl border border-border bg-card p-[18px] lg:col-span-5 lg:overflow-y-auto">
      <div>
        <h2 className="m-0 text-[18px] font-extrabold leading-6">Regras</h2>
        <p className="m-0 mt-0.5 text-[12px] leading-4 text-muted-foreground">Mudar uma regra refaz a lista ao lado na hora.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold leading-[18px]">Avisar quando um ponto passar para</span>
        <div role="radiogroup" aria-label="Nível mínimo" className="grid grid-cols-2 gap-1 rounded-[10px] bg-muted p-1">
          {([['MEDIUM', 'Moderado ou alto'], ['HIGH', 'Só alto']] as const).map(([v, label]) => (
            <button
              key={v} type="button" role="radio" aria-checked={minRisk === v} disabled={save.isPending}
              onClick={() => minRisk !== v && put('RISK_LEVEL', risk, { minRisk: v }, 'Nível mínimo atualizado.')}
              className={cn('h-11 cursor-pointer rounded-lg border-0 text-[13px] font-bold leading-4 text-foreground md:h-8', minRisk === v ? 'bg-card' : 'bg-transparent')}
            >{label}</button>
          ))}
        </div>
      </div>
      <RuleSlider
        label="Chuva forte a partir de" unit="mm/h" min={10} max={60} step={5} digits={0} value={rain?.threshold ?? 30} disabled={save.isPending}
        onCommit={(v) => put('RAIN_RATE', rain, { threshold: v, thresholdSource: adjustedSource(rain?.thresholdSource) }, 'Limiar de chuva atualizado.')}
      />
      <RuleSlider
        label="Maré acima de" unit="m" min={1.6} max={2.4} step={0.1} digits={1} value={tide?.threshold ?? 2.0} disabled={save.isPending}
        onCommit={(v) => put('TIDE_ABOVE', tide, { threshold: v, thresholdSource: adjustedSource(tide?.thresholdSource) }, 'Limiar de maré atualizado.')}
      />
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="p-0 text-[13px] font-bold leading-[18px]">Canais</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CHANNELS.map((c) => {
            const on = c.key === 'BROWSER' ? browserOn : false;
            return (
              <label key={c.key} className={cn('flex h-10 items-center gap-2 rounded-[10px] border px-3 text-[13px] font-semibold', on ? 'cursor-pointer border-primary' : 'border-border', !c.ready && 'cursor-not-allowed text-muted-foreground')}>
                <input
                  type="checkbox" className="m-0 size-4 accent-primary" checked={on} disabled={!c.ready || save.isPending || (c.key === 'BROWSER' && !risk && !rain && !tide)}
                  onChange={c.key === 'BROWSER' ? (e) => setBrowser(e.target.checked) : undefined}
                />
                {c.label}
                {!c.ready && <span className="ml-auto text-[11px] font-normal">em breve</span>}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold leading-[18px]">Pré-visualização da mensagem</span>
        <div className="rounded-xl bg-muted p-3 text-[13px] leading-[19px]">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>MAPi · Defesa Civil</span><span className="font-mono">{latest ? formatHoraCurta(latest.triggeredAt) : ''}</span></div>
          <strong>{latest ? latest.title : 'Sem alertas ainda'}</strong><br />
          {latest ? latest.detail : 'Quando uma regra disparar, a mensagem aparece aqui.'}{latest?.detail && <br />}
          <span className="text-muted-foreground">Previsão experimental, modelo não validado. Confira no mapa antes de mobilizar equipe.</span>
        </div>
      </div>
      <p className="m-0 mt-auto flex flex-wrap items-center justify-between gap-2 text-[12px] leading-4 text-muted-foreground">
        <span>Estas regras valem para todos os pontos e estações. Regras por ponto ou estação ficam em Todas as regras.</span>
        <button type="button" onClick={onAll} className="h-11 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-[12px] font-semibold text-foreground hover:bg-muted md:h-7">Todas as regras</button>
      </p>
    </section>
  );
};
