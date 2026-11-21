/** As 12 etiquetas de origem do canvas (Cenarios1Selos). `sourceKindsOf` só devolve LIVE, PED e PED_ONLY. */
export type SourceKind =
  | 'MEASURED' | 'LIVE' | 'PED' | 'PED_ONLY' | 'ESTIMATED' | 'NO_DATA' | 'FORECAST'
  | 'TIDE_HARMONIC' | 'OFFICIAL_INMET' | 'PHYSICAL_MODEL' | 'TESTING';

/** Tag a partir da lista `sources` da estação canônica (B1): só PED, ao vivo, ou as duas. */
export function sourceKindsOf(sources: readonly string[]): SourceKind[] {
  const live = sources.includes('CEMADEN');
  const ped = sources.includes('CEMADEN_PED');
  if (ped && !live) return ['PED_ONLY'];
  return [...(live ? (['LIVE'] as const) : []), ...(ped ? (['PED'] as const) : [])];
}
