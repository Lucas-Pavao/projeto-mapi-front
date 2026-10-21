import type { Alert, AlertKind } from '../schemas/alert.schema';

export type AlertGroup = 'all' | 'risk' | 'river' | 'tide' | 'rain' | 'sensor';

export const GROUPS: ReadonlyArray<{ value: AlertGroup; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'risk', label: 'Risco' },
  { value: 'river', label: 'Rio' },
  { value: 'tide', label: 'Maré' },
  { value: 'rain', label: 'Chuva' },
  { value: 'sensor', label: 'Sensores' },
];

const GROUP_OF: Record<AlertKind, Exclude<AlertGroup, 'all'>> = {
  RISK_LEVEL: 'risk',
  PREDICTION_UNAVAILABLE: 'risk',
  RIVER_STAGE: 'river',
  TIDE_ABOVE: 'tide',
  RAIN_RATE: 'rain',
  SENSOR_STALE: 'sensor',
};

export const groupOf = (kind: AlertKind) => GROUP_OF[kind];

export const inGroup = (a: Pick<Alert, 'kind'>, g: AlertGroup) => g === 'all' || GROUP_OF[a.kind] === g;

export const countByGroup = (alerts: readonly Alert[], g: AlertGroup) => alerts.filter((a) => inGroup(a, g)).length;
