import type { Timeline } from '../schemas/timeline.schema';
import type { SensorFreshness } from '@/features/sensors/schemas/sensor.schema';

type Series = Timeline['river'][number];

/**
 * Rio das faixas e do relatório: o que tem cotas oficiais (APAC) e, depois, o de série mais longa. A ordem da API é
 * alfabética e punha um açude (cota = altitude do espelho d'água, uma leitura por dia) no lugar do rio.
 */
export function pickRiver(series: readonly Series[] | undefined, sensors: readonly SensorFreshness[] | undefined): Series | undefined {
  if (!series?.length) return undefined;
  const hasLevels = (id: string) => {
    const s = sensors?.find((x) => x.sensorId === id) as Record<string, unknown> | undefined;
    return typeof s?.riverFloodLevel === 'number' || typeof s?.riverAlertLevel === 'number';
  };
  const filled = (x: Series) => x.points.filter((p) => p.v != null).length;
  return [...series].sort((a, b) => Number(hasLevels(b.stationId)) - Number(hasLevels(a.stationId)) || filled(b) - filled(a))[0];
}
