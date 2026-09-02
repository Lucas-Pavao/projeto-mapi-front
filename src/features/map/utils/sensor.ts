import {
  Waves,
  CloudRain,
  Thermometer,
  Wind,
  Gauge,
  Activity,
  ShieldAlert
} from 'lucide-react';
import type { SensorResponseDTO } from '../types';

export const getSensorConfig = (sensor: SensorResponseDTO) => {
  const source = sensor.source?.toUpperCase() || '';
  const type = sensor.type?.toLowerCase() || '';

  // Estação fluviométrica com alerta oficial (APAC) — identidade própria, tem prioridade sobre
  // a checagem por fonte/tipo genérica abaixo: não é chuva nem meteo, é o dado central de alerta
  // de alagamento (pré-alerta/alerta/inundação de um rio específico).
  const hasRiverAlert = sensor.riverPreAlertLevel != null || sensor.riverAlertLevel != null || sensor.riverFloodLevel != null;
  if (hasRiverAlert || type.includes('fluviom')) {
    return {
      icon: ShieldAlert,
      color: 'bg-rose-600',
      sidebarColor: "bg-rose-500/10 text-rose-400",
      ping: 'bg-rose-400',
      text: 'text-rose-400',
      label: 'Alerta de Rio'
    };
  }

  // ANA - Usually Hydrological (Rivers)
  if (source.includes('ANA')) {
    return { 
      icon: Waves, 
      color: 'bg-blue-600', 
      sidebarColor: "bg-blue-500/10 text-blue-400",
      ping: 'bg-blue-400', 
      text: 'text-blue-400',
      label: 'Rio / Hidro'
    };
  }

  // APAC / CEMADEN - Rain or Geotechnical
  if (source.includes('APAC') || source.includes('CEMADEN')) {
    if (type.includes('geotécnica') || type.includes('geotecnica')) {
      return { 
        icon: Activity, 
        color: 'bg-amber-600', 
        sidebarColor: "bg-amber-500/10 text-amber-400",
        ping: 'bg-amber-400', 
        text: 'text-amber-400',
        label: 'Geotécnica'
      };
    }
    if (type.includes('mista')) {
      return { 
        icon: Gauge, 
        color: 'bg-emerald-600', 
        sidebarColor: "bg-emerald-500/10 text-emerald-400",
        ping: 'bg-emerald-400', 
        text: 'text-emerald-400',
        label: 'Mista / Meteo'
      };
    }
    return { 
      icon: CloudRain, 
      color: 'bg-sky-600', 
      sidebarColor: "bg-sky-500/10 text-sky-400",
      ping: 'bg-sky-400', 
      text: 'text-sky-400',
      label: 'Chuva'
    };
  }

  // Default / Other
  if (sensor.temperature !== null) return { 
    icon: Thermometer, color: 'bg-orange-600', sidebarColor: "bg-orange-500/10 text-orange-400", ping: 'bg-orange-400', text: 'text-orange-400', label: 'Meteo'
  };
  
  if (sensor.windSpeed !== null) return { 
    icon: Wind, color: 'bg-slate-600', sidebarColor: "bg-slate-500/10 text-slate-400", ping: 'bg-slate-400', text: 'text-slate-400', label: 'Vento'
  };

  return { 
    icon: Activity, 
    color: 'bg-zinc-600', 
    sidebarColor: "bg-zinc-500/10 text-zinc-400",
    ping: 'bg-zinc-400', 
    text: 'text-zinc-400',
    label: sensor.type || 'Sensor'
  };
};

export const getBatteryStatus = (status?: string | null) => {
  if (!status) return { isCharging: false, isLow: false, percentage: null };
  
  const normalized = status.toLowerCase();
  const isCharging = normalized.includes('charging') || normalized.includes('carregando');
  
  // Try to parse percentage
  const match = normalized.match(/(\d+(\.\d+)?)/);
  const percentage = match ? parseFloat(match[1]) : null;
  
  const isLow = percentage !== null ? percentage < 20 : (normalized.includes('low') || normalized.includes('baixo') || normalized.includes('crítico') || normalized.includes('critical'));
  
  return { isCharging, isLow, percentage };
};

export const formatApiTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return '';
  try {
    if (Array.isArray(timestamp)) {
      // [Year, Month, Day, Hour, Minute, Second, Nanoseconds]
      const date = new Date(
        timestamp[0],
        timestamp[1] - 1,
        timestamp[2],
        timestamp[3] || 0,
        timestamp[4] || 0,
        timestamp[5] || 0
      );
      if (isNaN(date.getTime())) return '';
      return date.toISOString();
    }
    const d = new Date(String(timestamp));
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
  } catch {
    return '';
  }
};

export const getSafeFormattedDate = (timestamp: unknown): Date | null => {
  const tsStr = formatApiTimestamp(timestamp);
  if (!tsStr) return null;
  const d = new Date(tsStr);
  if (isNaN(d.getTime())) return null;
  return d;
};

