import { Activity, Bell, ChartLine, Database, FileText, Map, MapPin, MessageSquareWarning, Radio, SlidersHorizontal, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

/** Itens da barra principal, na ordem de Nav.dc.html (+ Sensores). Usuários fica no avatar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Mapa', to: '/map', icon: Map },
  { label: 'Sensores', to: '/sensores', icon: Radio },
  { label: 'Alertas', to: '/alertas', icon: Bell },
  { label: 'Eventos', to: '/eventos', icon: Activity },
  { label: 'Simulador', to: '/modelo/simulador', icon: SlidersHorizontal },
  { label: 'Modelo', to: '/modelo', icon: ChartLine },
  { label: 'Maré', to: '/mare', icon: Waves },
  { label: 'Dados', to: '/admin/dados', icon: Database },
  { label: 'Pontos', to: '/admin/pontos', icon: MapPin },
  { label: 'Relatos', to: '/relatos', icon: MessageSquareWarning },
  { label: 'Relatório', to: '/relatorio', icon: FileText },
];

export const USERS_PATH = '/admin/usuarios';
