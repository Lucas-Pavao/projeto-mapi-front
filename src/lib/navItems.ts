import { Activity, Bell, ChartLine, Database, FileText, Map, MapPin, MessageSquareWarning, Radio, SlidersHorizontal, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/lib/apiSchemas';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Perfil mínimo (ADR 0010). */
  minRole: Role;
}

/** Itens da barra principal, na ordem de Nav.dc.html (+ Sensores). Usuários fica no avatar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Mapa', to: '/map', icon: Map, minRole: 'USER' },
  { label: 'Sensores', to: '/sensores', icon: Radio, minRole: 'USER' },
  { label: 'Alertas', to: '/alertas', icon: Bell, minRole: 'OPERADOR' },
  { label: 'Eventos', to: '/eventos', icon: Activity, minRole: 'USER' },
  { label: 'Simulador', to: '/modelo/simulador', icon: SlidersHorizontal, minRole: 'USER' },
  { label: 'Modelo', to: '/modelo', icon: ChartLine, minRole: 'USER' },
  { label: 'Maré', to: '/mare', icon: Waves, minRole: 'USER' },
  { label: 'Dados', to: '/admin/dados', icon: Database, minRole: 'ADMIN' },
  { label: 'Pontos', to: '/admin/pontos', icon: MapPin, minRole: 'ADMIN' },
  { label: 'Relatos', to: '/relatos', icon: MessageSquareWarning, minRole: 'OPERADOR' },
  { label: 'Relatório', to: '/relatorio', icon: FileText, minRole: 'USER' },
];

export const USERS_PATH = '/admin/usuarios';
export const USERS_MIN_ROLE: Role = 'ADMIN';
