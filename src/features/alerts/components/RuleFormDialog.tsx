import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { Field, Select } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TideDatumNotice } from '@/components/TideDatumNotice';
import type { AlertKind, AlertRule, AlertRuleInput } from '../schemas/alert.schema';
import { RULE_KINDS, validateRule } from '../utils/ruleKinds';

interface PointOption { slug: string; name: string }

interface Props {
  /** Regra em edição; ausente = criar. */
  rule?: AlertRule;
  points: PointOption[];
  saving: boolean;
  error?: string | null;
  onSave: (input: AlertRuleInput) => void;
  onClose: () => void;
}

const num = (s: string): number | null => (s.trim() === '' ? null : Number(s.replace(',', '.')));

export const RuleFormDialog: React.FC<Props> = ({ rule, points, saving, error, onSave, onClose }) => {
  const [kind, setKind] = useState<AlertKind>(rule?.kind ?? 'RISK_LEVEL');
  const [slug, setSlug] = useState(rule?.floodPointSlug ?? '');
  const [station, setStation] = useState(rule?.stationId ?? '');
  const [threshold, setThreshold] = useState(rule?.threshold != null ? String(rule.threshold) : '');
  const [source, setSource] = useState(rule?.thresholdSource ?? '');
  const [minRisk, setMinRisk] = useState<'MEDIUM' | 'HIGH' | ''>(rule?.minRisk ?? (rule ? '' : 'HIGH'));
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const info = RULE_KINDS[kind];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: AlertRuleInput = {
      kind,
      floodPointSlug: info.target !== 'station' && slug ? slug : null,
      stationId: info.target !== 'point' && station.trim() ? station.trim() : null,
      threshold: info.unit ? num(threshold) : null,
      thresholdSource: info.needsSource || source.trim() ? source.trim() || null : null,
      minRisk: info.usesMinRisk && minRisk ? minRisk : null,
      enabled,
      channels: ['BROWSER'],
    };
    const errs = validateRule({ ...input, kind });
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(input);
  };

  return (
    <DialogPanel title={rule ? 'Editar regra de alerta' : 'Nova regra de alerta'} description="Alerta aparece no navegador (canal BROWSER). Alertas já disparados não mudam." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Tipo de regra" hint={info.help}>
          {(p) => (
            <Select {...p} value={kind} onChange={(e) => setKind(e.target.value as AlertKind)}>
              {(Object.keys(RULE_KINDS) as AlertKind[]).map((k) => <option key={k} value={k}>{RULE_KINDS[k].label}</option>)}
            </Select>
          )}
        </Field>
        {info.target !== 'station' && (
          <Field label="Ponto" hint="Em branco = todos os pontos.">
            {(p) => (
              <Select {...p} value={slug} onChange={(e) => setSlug(e.target.value)}>
                <option value="">Todos os pontos</option>
                {points.map((pt) => <option key={pt.slug} value={pt.slug}>{pt.name}</option>)}
              </Select>
            )}
          </Field>
        )}
        {info.target !== 'point' && (
          <Field label="Estação" hint="Em branco = todas as estações.">
            {(p) => <Input {...p} value={station} onChange={(e) => setStation(e.target.value)} className="h-11 md:h-8" />}
          </Field>
        )}
        {info.unit && (
          <Field label={`Limiar (${info.unit})`} error={errors.threshold}>
            {(p) => <Input {...p} inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="h-11 md:h-8" />}
          </Field>
        )}
        {(info.needsSource || info.unit) && (
          <Field label={info.needsSource ? 'Fonte do limiar (obrigatória)' : 'Fonte do limiar (opcional)'} hint="Ex.: IDF TR 2 anos, norma, decisão da Defesa Civil." error={errors.thresholdSource}>
            {(p) => <Input {...p} value={source} onChange={(e) => setSource(e.target.value)} className="h-11 md:h-8" />}
          </Field>
        )}
        {info.usesMinRisk && (
          <Field label="Risco mínimo" error={errors.minRisk}>
            {(p) => (
              <Select {...p} value={minRisk} onChange={(e) => setMinRisk(e.target.value as 'MEDIUM' | 'HIGH' | '')}>
                <option value="">Escolha…</option>
                <option value="MEDIUM">Moderado ou acima</option>
                <option value="HIGH">Alto</option>
              </Select>
            )}
          </Field>
        )}
        {kind === 'TIDE_ABOVE' && <TideDatumNotice compact />}
        <label className="flex min-h-11 items-center gap-2 text-body text-foreground">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4" /> Regra ativa
        </label>
        {error && <p role="alert" className="text-body text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="h-11 px-4 md:h-8" disabled={saving}>{saving ? 'Salvando…' : 'Salvar regra'}</Button>
        </div>
      </form>
    </DialogPanel>
  );
};
