import type { FloodPointResponseDTO } from '@/features/map/types';
import type { FloodPointPatch } from '../schemas/point-admin.schema';

export interface PointForm {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  active: boolean;
  alertThresholdMm: string;
  pluviometerStationIds: string[];
  riverLevelStationIds: string[];
}

const toNum = (s: string): number | null => (s.trim() === '' ? null : Number(s.replace(',', '.')));

/** Valores extras que a API pode devolver no ponto (o tipo local não os declara). */
export const alertThresholdOf = (p: FloodPointResponseDTO): number | null => {
  const v = (p as unknown as { alertThresholdMm?: unknown }).alertThresholdMm;
  return typeof v === 'number' ? v : null;
};

export function formFromPoint(p: FloodPointResponseDTO): PointForm {
  return {
    name: p.name,
    description: p.description ?? '',
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    active: p.active,
    alertThresholdMm: alertThresholdOf(p) != null ? String(alertThresholdOf(p)) : '',
    pluviometerStationIds: p.sensorConfig?.pluviometerStationIds ?? [],
    riverLevelStationIds: p.sensorConfig?.riverLevelStationIds ?? [],
  };
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Só os campos que mudaram (PATCH parcial). Erros por campo para o formulário. */
export function buildPatch(original: FloodPointResponseDTO, f: PointForm): { patch: FloodPointPatch; errors: Record<string, string> } {
  const o = formFromPoint(original);
  const patch: FloodPointPatch = {};
  const errors: Record<string, string> = {};
  if (f.name.trim() !== o.name) {
    if (!f.name.trim()) errors.name = 'O nome não pode ficar vazio.';
    else patch.name = f.name.trim();
  }
  if (f.description.trim() !== o.description) patch.description = f.description.trim() === '' ? null : f.description.trim();
  const lat = toNum(f.latitude);
  const lon = toNum(f.longitude);
  if (lat == null || !Number.isFinite(lat) || lat < -90 || lat > 90) errors.latitude = 'Latitude entre -90 e 90.';
  else if (lat !== original.latitude) patch.latitude = lat;
  if (lon == null || !Number.isFinite(lon) || lon < -180 || lon > 180) errors.longitude = 'Longitude entre -180 e 180.';
  else if (lon !== original.longitude) patch.longitude = lon;
  if (f.active !== original.active) patch.active = f.active;
  if (f.alertThresholdMm.trim() !== o.alertThresholdMm) {
    const t = toNum(f.alertThresholdMm);
    if (t != null && (!Number.isFinite(t) || t < 0)) errors.alertThresholdMm = 'Limiar em mm, zero ou mais.';
    else patch.alertThresholdMm = t;
  }
  if (!sameList(f.pluviometerStationIds, o.pluviometerStationIds)) patch.pluviometerStationIds = f.pluviometerStationIds;
  if (!sameList(f.riverLevelStationIds, o.riverLevelStationIds)) patch.riverLevelStationIds = f.riverLevelStationIds;
  return { patch, errors };
}
