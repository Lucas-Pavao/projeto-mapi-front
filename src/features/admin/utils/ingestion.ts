import { CircleAlert, CircleCheck, CirclePause, Clock, ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import type { IngestionStatus } from '../schemas/admin.schema';

export const INGESTION_STATUS = {
  OK: { label: 'Em dia', Icon: CircleCheck, tone: 'text-success border-success/40 bg-success/10' },
  DELAYED: { label: 'Atrasada', Icon: Clock, tone: 'text-warning border-warning/40 bg-warning/10' },
  FAILING: { label: 'Com falha', Icon: CircleAlert, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  QUARANTINED: { label: 'Em quarentena', Icon: ShieldAlert, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
  IDLE: { label: 'Parada', Icon: CirclePause, tone: 'text-muted-foreground border-border bg-muted' },
} satisfies Record<IngestionStatus, { label: string; Icon: ComponentType<{ className?: string }>; tone: string }>;

export const isProblem = (s: IngestionStatus) => s === 'FAILING' || s === 'QUARANTINED' || s === 'DELAYED';

