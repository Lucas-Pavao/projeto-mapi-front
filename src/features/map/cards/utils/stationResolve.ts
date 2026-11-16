import type { CanonicalStation } from '@/features/sensors/schemas/station.schema';
import type { StationAccumulation } from '../../schemas/measuredRain.schema';
import type { SensorResponseDTO } from '../../types';

/** Estação com coordenada, o mínimo para ancorar o card no mapa. */
export interface StationAnchor { canonicalId: string; name: string | null; lat: number | null; lon: number | null; aliases: readonly string[] }

/** Junta as canônicas (B1) e as da chuva medida: a mesma canônica não repete e a coordenada que existir vale. */
export function stationAnchors(canonical: readonly CanonicalStation[] | undefined, measured: readonly StationAccumulation[]): StationAnchor[] {
  const out = new Map<string, StationAnchor>();
  for (const c of canonical ?? []) out.set(c.canonicalId, { canonicalId: c.canonicalId, name: c.name ?? null, lat: c.lat ?? null, lon: c.lon ?? null, aliases: c.aliases });
  for (const m of measured) {
    if (!m.canonicalId) continue;
    const prev = out.get(m.canonicalId);
    out.set(m.canonicalId, { canonicalId: m.canonicalId, name: prev?.name ?? m.name, lat: prev?.lat ?? m.lat, lon: prev?.lon ?? m.lon, aliases: prev?.aliases.length ? prev.aliases : m.aliases });
  }
  return [...out.values()];
}

/**
 * Pluviômetro ao vivo do Cemaden que é apelido de uma canônica → a canônica (por `CEMADEN:<code>`, `CEMADEN:<sensorId>` ou o
 * próprio código). Sensor de outra fonte ou de rio não resolve.
 */
export function resolveCanonical(sensor: Pick<SensorResponseDTO, 'sensorId' | 'code' | 'source' | 'type'>, anchors: readonly StationAnchor[]): StationAnchor | undefined {
  if ((sensor.type ?? '').toUpperCase().includes('RIVER')) return undefined;
  const keys = new Set([sensor.sensorId, sensor.code, sensor.code ? `CEMADEN:${sensor.code}` : null, `CEMADEN:${sensor.sensorId}`].filter((k): k is string => !!k));
  return anchors.find((a) => keys.has(a.canonicalId) || a.aliases.some((al) => keys.has(al)));
}
