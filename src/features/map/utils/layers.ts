import { Activity, AlertTriangle, CloudRain, Shield, Thermometer, Waves, Wind, type LucideIcon } from 'lucide-react';
import { getSensorConfig } from './sensor';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';

export interface LayerOption {
  id: string;
  icon: LucideIcon;
  color: string;
}

/** Camadas do painel do mapa, na ordem exibida. */
export const LAYER_OPTIONS: readonly LayerOption[] = [
  { id: 'Mista / Meteo', icon: Activity, color: 'text-success' },
  { id: 'Geotécnica', icon: Shield, color: 'text-warning' },
  { id: 'Rio / Hidro', icon: Waves, color: 'text-chart-1' },
  { id: 'Chuva', icon: CloudRain, color: 'text-chart-1' },
  { id: 'Meteo', icon: Thermometer, color: 'text-warning' },
  { id: 'Vento', icon: Wind, color: 'text-muted-foreground' },
  { id: 'Sensor', icon: Activity, color: 'text-muted-foreground' },
  { id: 'Pontos críticos', icon: AlertTriangle, color: 'text-destructive' },
];

export const DEFAULT_ACTIVE_LAYERS: readonly string[] = ['Mista / Meteo', 'Geotécnica', 'Rio / Hidro', 'Chuva', 'Pontos críticos', 'Meteo', 'Vento', 'Sensor'];

/** Sensores com coordenada válida cuja camada está ativa. */
export function filterSensorsForMap(sensors: SensorResponseDTO[], activeLayers: readonly string[]): SensorResponseDTO[] {
  if (!Array.isArray(sensors)) return [];
  return sensors.filter((sensor) => {
    if (!sensor || sensor.latitude == null || sensor.longitude == null || (sensor.latitude === 0 && sensor.longitude === 0)) return false;
    const config = getSensorConfig(sensor);
    return activeLayers.includes(config.label);
  });
}

/** Pontos críticos com coordenada válida; vazio se a camada "Pontos críticos" está desligada. */
export function filterFloodPointsForMap(floodPoints: FloodPointResponseDTO[], activeLayers: readonly string[]): FloodPointResponseDTO[] {
  if (!Array.isArray(floodPoints) || !activeLayers.includes('Pontos críticos')) return [];
  return floodPoints.filter((point) => point.latitude != null && point.longitude != null && point.latitude !== 0 && point.longitude !== 0);
}
