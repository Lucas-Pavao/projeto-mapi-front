import React from 'react';
import { Printer } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { hasRole, parseRole } from '@/lib/roles';
import { useRiskSummary } from '@/features/points/hooks/useRiskSummary';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useSensorsLatest } from '@/features/sensors/hooks/useSensorsLatest';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { SituationReport } from '@/features/reports/components/SituationReport';

const WINDOW_HOURS = 24;

/**
 * Relatório de situação para impressão. A folha é sempre no tema claro (data-theme="light" no cartão),
 * mesmo com o app no escuro; o CSS de impressão (styles/print.css) tira a navegação e deixa o conteúdo fluir em A4.
 */
export const ReportPage: React.FC = () => {
  const { user } = useAuth();
  const canSeeAlerts = hasRole(parseRole(user?.role), 'OPERADOR');
  const summary = useRiskSummary();
  const points = useFloodPoints();
  const sensors = useSensorsLatest();
  const timeline = useTimeline(WINDOW_HOURS);
  const alerts = useAlerts('OPEN', { size: 50, enabled: canSeeAlerts });
  const generatedAt = React.useMemo(() => new Date(timeline.now).toISOString(), [timeline.now]);

  return (
    <PageShell
      title="Relatório"
      description="Situação atual em uma folha, pronta para imprimir ou salvar em PDF (tema claro, A4)."
      className="print:max-w-none print:p-0"
      actions={
        <Button type="button" className="no-print h-11 gap-1.5 px-4 md:h-8" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" /> Imprimir ou salvar PDF
        </Button>
      }
    >
      <div data-theme="light" data-accent="capibaribe" className="rounded-xl bg-background text-foreground print:rounded-none">
        <SituationReport
          generatedAt={generatedAt}
          author={user?.username}
          windowHours={WINDOW_HOURS}
          summary={summary}
          points={points}
          sensors={sensors}
          timeline={timeline}
          alerts={canSeeAlerts ? alerts : undefined}
        />
      </div>
    </PageShell>
  );
};
export default ReportPage;
