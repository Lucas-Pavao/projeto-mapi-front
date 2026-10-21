import { Activity, Bell, ChartLine, Database, FileText, Map, MapPin, MessageSquareWarning, Radio, SlidersHorizontal, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/lib/apiSchemas';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Perfil mínimo (ADR 0010). */
  minRole: Role;
  /** Aparece inline entre 641 e 1440 px; os demais vão para o menu 'Mais'. Acima de 1440 px tudo é inline. */
  priority: boolean;
}

/** Itens da barra principal, na ordem de Nav.dc.html (+ Sensores). Usuários fica no avatar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Mapa', to: '/map', icon: Map, minRole: 'USER', priority: true },
  { label: 'Sensores', to: '/sensores', icon: Radio, minRole: 'USER', priority: true },
  { label: 'Alertas', to: '/alertas', icon: Bell, minRole: 'OPERADOR', priority: true },
  { label: 'Eventos', to: '/eventos', icon: Activity, minRole: 'USER', priority: true },
  { label: 'Simulador', to: '/modelo/simulador', icon: SlidersHorizontal, minRole: 'USER', priority: false },
  { label: 'Modelo', to: '/modelo', icon: ChartLine, minRole: 'USER', priority: false },
  { label: 'Maré', to: '/mare', icon: Waves, minRole: 'USER', priority: false },
  { label: 'Dados', to: '/admin/dados', icon: Database, minRole: 'ADMIN', priority: false },
  { label: 'Pontos', to: '/admin/pontos', icon: MapPin, minRole: 'ADMIN', priority: false },
  { label: 'Relatos', to: '/relatos', icon: MessageSquareWarning, minRole: 'OPERADOR', priority: true },
  { label: 'Relatório', to: '/relatorio', icon: FileText, minRole: 'USER', priority: false },
];

export const USERS_PATH = '/admin/usuarios';
export const USERS_MIN_ROLE: Role = 'ADMIN';
