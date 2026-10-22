import { 
  Sun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudRainWind,
  type LucideIcon
} from 'lucide-react';

export interface WeatherCondition {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const getWeatherCondition = (code: number): WeatherCondition => {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return { label: 'Céu limpo', icon: Sun, color: 'text-warning' };
  if (code >= 1 && code <= 3) return { label: 'Parcialmente nublado', icon: Cloud, color: 'text-muted-foreground' };
  if (code === 45 || code === 48) return { label: 'Neblina', icon: CloudFog, color: 'text-muted-foreground' };
  if (code >= 51 && code <= 55) return { label: 'Garoa', icon: CloudDrizzle, color: 'text-chart-1' };
  if (code >= 61 && code <= 65) return { label: 'Chuva', icon: CloudRain, color: 'text-chart-1' };
  if (code >= 66 && code <= 67) return { label: 'Chuva congelante', icon: CloudSnow, color: 'text-chart-1' };
  if (code >= 71 && code <= 77) return { label: 'Neve', icon: CloudSnow, color: 'text-foreground' };
  if (code >= 80 && code <= 82) return { label: 'Pancadas de chuva', icon: CloudRainWind, color: 'text-chart-1' };
  if (code >= 85 && code <= 86) return { label: 'Pancadas de neve', icon: CloudSnow, color: 'text-foreground' };
  if (code >= 95) return { label: 'Tempestade', icon: CloudLightning, color: 'text-warning' };
  
  return { label: 'Desconhecido', icon: Cloud, color: 'text-muted-foreground' };
};
