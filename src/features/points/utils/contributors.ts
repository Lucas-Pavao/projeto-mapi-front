export interface Contributor { featureId: string; label: string; contribution: number }
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
