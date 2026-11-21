import { Activity, Bell, ChartLine, CloudRain, Database, FileText, Map, MapPin, MessageSquareWarning, Radio, SlidersHorizontal, Users, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/lib/apiSchemas';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Perfil mínimo (ADR 0010). */
  minRole: Role;
  /** Aparece inline entre 641 e 1439 px; os demais vão para o menu 'Mais'. De 1440 px em diante tudo é inline. */
  priority: boolean;
  /** false: não existe na barra do protótipo; fica só no menu 'Mais' (641-1439 px) e na folha do celular. */
  inBar?: boolean;
  /** Contador no selo vermelho do item (Nav.dc.html): alertas abertos, relatos pendentes. */
  badge?: 'alerts' | 'reports';
  /** Grupo da barra (seção 5.11): Mapa · Análise · Operação · Gestão. */
  group: NavGroupId;
}

export type NavGroupId = 'mapa' | 'analise' | 'operacao' | 'gestao';

/** Os 4 grupos da barra, na ordem. O contador de alertas vai no grupo Operação. */
export const NAV_GROUPS: ReadonlyArray<{ id: NavGroupId; label: string }> = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'analise', label: 'Análise' },
  { id: 'operacao', label: 'Operação' },
  { id: 'gestao', label: 'Gestão' },
];

/** Itens da barra principal, na ordem de Nav.dc.html. Sensores não está no protótipo (só no Mais e no celular). Usuários fica no avatar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Mapa', to: '/map', icon: Map, minRole: 'USER', priority: true, group: 'mapa' },
  { label: 'Evento', to: '/eventos', icon: Activity, minRole: 'USER', priority: true, group: 'analise' },
  { label: 'Chuva', to: '/chuva', icon: CloudRain, minRole: 'USER', priority: false, group: 'analise' },
  { label: 'Maré', to: '/mare', icon: Waves, minRole: 'USER', priority: false, group: 'analise' },
  { label: 'Modelo', to: '/modelo', icon: ChartLine, minRole: 'USER', priority: false, group: 'analise' },
  { label: 'Simulador', to: '/modelo/simulador', icon: SlidersHorizontal, minRole: 'USER', priority: false, group: 'analise' },
  // Sensores não está na lista da seção 5.11; fica em Análise para não perder a tela (decisão do orquestrador).
  { label: 'Sensores', to: '/sensores', icon: Radio, minRole: 'USER', priority: false, inBar: false, group: 'analise' },
  { label: 'Alertas', to: '/alertas', icon: Bell, minRole: 'OPERADOR', priority: true, badge: 'alerts', group: 'operacao' },
  { label: 'Relatos', to: '/relatos', icon: MessageSquareWarning, minRole: 'OPERADOR', priority: true, badge: 'reports', group: 'operacao' },
  { label: 'Relatório', to: '/relatorio', icon: FileText, minRole: 'USER', priority: false, group: 'operacao' },
  { label: 'Dados', to: '/admin/dados', icon: Database, minRole: 'ADMIN', priority: false, group: 'gestao' },
  { label: 'Pontos', to: '/admin/pontos', icon: MapPin, minRole: 'ADMIN', priority: false, group: 'gestao' },
  { label: 'Usuários', to: '/admin/usuarios', icon: Users, minRole: 'ADMIN', priority: false, group: 'gestao' },
];

export const USERS_PATH = '/admin/usuarios';
export const USERS_MIN_ROLE: Role = 'ADMIN';
