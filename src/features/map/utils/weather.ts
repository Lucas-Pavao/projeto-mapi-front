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
  if (code === 0) return { label: 'Céu Limpo', icon: Sun, color: 'text-yellow-400' };
  if (code >= 1 && code <= 3) return { label: 'Parcialmente Nublado', icon: Cloud, color: 'text-zinc-400' };
  if (code === 45 || code === 48) return { label: 'Neblina', icon: CloudFog, color: 'text-zinc-300' };
  if (code >= 51 && code <= 55) return { label: 'Garoa', icon: CloudDrizzle, color: 'text-sky-300' };
  if (code >= 61 && code <= 65) return { label: 'Chuva', icon: CloudRain, color: 'text-sky-500' };
  if (code >= 66 && code <= 67) return { label: 'Chuva Congelante', icon: CloudSnow, color: 'text-blue-300' };
  if (code >= 71 && code <= 77) return { label: 'Neve', icon: CloudSnow, color: 'text-white' };
  if (code >= 80 && code <= 82) return { label: 'Pancadas de Chuva', icon: CloudRainWind, color: 'text-sky-600' };
  if (code >= 85 && code <= 86) return { label: 'Pancadas de Neve', icon: CloudSnow, color: 'text-zinc-100' };
  if (code >= 95) return { label: 'Tempestade', icon: CloudLightning, color: 'text-amber-500' };
  
  return { label: 'Desconhecido', icon: Cloud, color: 'text-zinc-500' };
};
