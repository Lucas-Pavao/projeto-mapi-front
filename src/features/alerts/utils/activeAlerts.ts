import type { Alert } from '../schemas/alert.schema';

/** Alerta ativo = ainda sem reconhecimento (ADR 0011). */
export const isActiveAlert = (a: Pick<Alert, 'acknowledgedAt'>): boolean => !a.acknowledgedAt;

/** Slugs dos pontos com ao menos um alerta ativo. O marcador do mapa pulsa só para estes. */
export function activeAlertSlugs(alerts: readonly Alert[] | undefined): Set<string> {
  const slugs = new Set<string>();
  for (const a of alerts ?? []) if (isActiveAlert(a) && a.floodPointSlug) slugs.add(a.floodPointSlug);
  return slugs;
}
