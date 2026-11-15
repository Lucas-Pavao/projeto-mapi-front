export interface Contributor { featureId: string; label: string; contribution: number; value?: number | null; unit?: string | null }
export interface ContributorShare { id: string; label: string; share: number }

/** Parte de cada fator no total (|contribuição| / soma), do maior para o menor, no máximo `max`. */
export function contributorShares(list: readonly Contributor[] | null | undefined, max = 5): ContributorShare[] {
  const items = (list ?? []).filter((c) => Number.isFinite(c.contribution) && c.contribution !== 0);
  const total = items.reduce((s, c) => s + Math.abs(c.contribution), 0);
  if (total === 0) return [];
  // Frações já na escala 0–1 (soma <= 1) são mostradas como vieram; fora dela, a parte no total.
  const asIs = items.every((c) => Math.abs(c.contribution) <= 1) && total <= 1.0001;
  return items
    .map((c) => ({ id: c.featureId, label: c.label, share: asIs ? Math.abs(c.contribution) : Math.abs(c.contribution) / total }))
    .sort((a, b) => b.share - a.share)
    .slice(0, max);
}

export interface ContributorRow { id: string; label: string; valueText: string | null; ppText: string; width: number }

const f1 = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** As maiores contribuições em pontos percentuais (+/−) com o valor físico da feature; barra relativa à maior. */
export function contributorRows(list: readonly Contributor[] | null | undefined, max = 3): ContributorRow[] {
  const items = (list ?? []).filter((c) => Number.isFinite(c.contribution) && c.contribution !== 0)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, max);
  const top = Math.abs(items[0]?.contribution ?? 0);
  return items.map((c) => ({
    id: c.featureId,
    label: c.label,
    valueText: c.value != null ? `${f1(c.value)}${c.unit ? ` ${c.unit}` : ''}` : null,
    ppText: `${c.contribution >= 0 ? '+' : '−'}${f1(Math.abs(c.contribution) * 100)} p.p.`,
    width: top > 0 ? (Math.abs(c.contribution) / top) * 100 : 0,
  }));
}
