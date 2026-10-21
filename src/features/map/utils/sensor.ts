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
      color: 'bg-chart-1',
      sidebarColor: "bg-chart-1/10 text-chart-1",
      ping: 'bg-chart-1',
      text: 'text-chart-1',
      label: 'Alerta de rio'
    };
  }

  // ANA - Usually Hydrological (Rivers)
  if (source.includes('ANA')) {
    return { 
      icon: Waves, 
      color: 'bg-chart-1', 
      sidebarColor: "bg-chart-1/10 text-chart-1",
      ping: 'bg-chart-1', 
      text: 'text-chart-1',
      label: 'Rio / Hidro'
    };
  }

  // APAC / CEMADEN - Rain or Geotechnical
  if (source.includes('APAC') || source.includes('CEMADEN')) {
    if (type.includes('geotécnica') || type.includes('geotecnica')) {
      return { 
        icon: Activity, 
        color: 'bg-chart-5', 
        sidebarColor: "bg-chart-5/10 text-chart-5",
        ping: 'bg-chart-5', 
        text: 'text-chart-5',
        label: 'Geotécnica'
      };
    }
    if (type.includes('mista')) {
      return { 
        icon: Gauge, 
        color: 'bg-chart-4', 
        sidebarColor: "bg-chart-4/10 text-chart-4",
        ping: 'bg-chart-4', 
        text: 'text-chart-4',
        label: 'Mista / Meteo'
      };
    }
    return { 
      icon: CloudRain, 
      color: 'bg-chart-3', 
      sidebarColor: "bg-chart-3/10 text-chart-3",
      ping: 'bg-chart-3', 
      text: 'text-chart-3',
      label: 'Chuva'
    };
  }

  // Default / Other
  if (sensor.temperature !== null) return { 
    icon: Thermometer, color: 'bg-chart-2', sidebarColor: "bg-chart-2/10 text-chart-2", ping: 'bg-chart-2', text: 'text-chart-2', label: 'Meteo'
  };
  
  if (sensor.windSpeed !== null) return { 
    icon: Wind, color: 'bg-muted-foreground', sidebarColor: "bg-muted text-muted-foreground", ping: 'bg-muted-foreground', text: 'text-muted-foreground', label: 'Vento'
  };

  return { 
    icon: Activity, 
    color: 'bg-muted-foreground', 
    sidebarColor: "bg-muted text-muted-foreground",
    ping: 'bg-muted-foreground', 
    text: 'text-muted-foreground',
    label: sensor.type || 'Sensor'
  };
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

export type DataFreshnessStatus = 'fresh' | 'aging' | 'stale';

export interface DataFreshness {
  status: DataFreshnessStatus;
  minutesAgo: number | null;
  label: string;
  color: string;
  text: string;
  dot: string;
}

// Sensores agora vêm de coleta agendada direto da ANA/APAC (sem o antigo "sensor virtual" MQTT
// que simulava bateria/carregamento) — não existe mais um sinal de "saúde do dispositivo" pra
// mostrar. O que substitui esse papel é a frescor do último dado: se um coletor externo começar
// a falhar (ex.: ANA fora do ar), a leitura mais recente do sensor vai ficando velha, e é isso
// que o usuário do painel precisa perceber rápido — não uma bateria que nunca existiu de verdade.
export const getDataFreshness = (timestamp: unknown): DataFreshness => {
  const date = getSafeFormattedDate(timestamp);
  if (!date) {
    return { status: 'stale', minutesAgo: null, label: 'Sem dados', color: 'bg-muted-foreground', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  }

  const minutesAgo = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

  if (minutesAgo <= 20) {
    return { status: 'fresh', minutesAgo, label: 'Atualizado', color: 'bg-success', text: 'text-success', dot: 'bg-success' };
  }
  if (minutesAgo <= 120) {
    return { status: 'aging', minutesAgo, label: 'Atrasando', color: 'bg-warning', text: 'text-warning', dot: 'bg-warning' };
  }
  return { status: 'stale', minutesAgo, label: 'Sem resposta', color: 'bg-destructive', text: 'text-destructive', dot: 'bg-destructive' };
};

