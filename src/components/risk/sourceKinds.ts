export type SourceKind = 'LIVE' | 'PED' | 'PED_ONLY';

/** Tag a partir da lista `sources` da estação canônica (B1): só PED, ao vivo, ou as duas. */
export function sourceKindsOf(sources: readonly string[]): SourceKind[] {
  const live = sources.includes('CEMADEN');
  const ped = sources.includes('CEMADEN_PED');
  if (ped && !live) return ['PED_ONLY'];
  return [...(live ? (['LIVE'] as const) : []), ...(ped ? (['PED'] as const) : [])];
}
