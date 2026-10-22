import React from 'react';
import { ShieldCheck, TriangleAlert, OctagonAlert, CircleHelp } from 'lucide-react';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';

const ICONS: Record<RiskLevel, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  LOW: ShieldCheck,
  MEDIUM: TriangleAlert,
  HIGH: OctagonAlert,
  UNKNOWN: CircleHelp,
};

/**
 * Ícone por nível. Forma distinta por classe (escudo, triângulo, octógono, interrogação) para
 * que o risco não dependa só de cor (WCAG 1.4.1). Decorativo: o nome acessível vem do pai.
 */
export const RiskIcon: React.FC<{ level: RiskLevel | null | undefined; className?: string }> = ({ level, className }) => {
  const Icon = ICONS[level ?? 'UNKNOWN'] ?? CircleHelp;
  return <Icon className={className} aria-hidden={true} />;
};
