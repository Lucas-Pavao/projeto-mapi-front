import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { hasRole, parseRole } from '@/lib/roles';
import { useAlertaPontos } from '../hooks/useAlertaPontos';
import { PointAlertPanel } from './PointAlertPanel';

interface Props {
  slug: string;
  pointName: string;
  /** Conteúdo da aba Experimental: o risco do logreg_v3 (rótulo sintético). */
  experimental: React.ReactNode;
  /** Mostrado no lugar do alerta para quem não é ADMIN enquanto o modo sombra estiver ligado. */
  fallback?: React.ReactNode;
}

/**
 * Cartão do ponto com uma coisa só em destaque (ADR 0026): aba "Alerta" (rain_alert e point_flood) e aba
 * "Experimental" (risco do logreg_v3, rótulo sintético). Em modo sombra o alerta aparece só para ADMIN, "em teste".
 */
export const PointAlertTabs: React.FC<Props> = ({ slug, pointName, experimental, fallback }) => {
  const { user } = useAuth();
  const isAdmin = hasRole(parseRole(user?.role), 'ADMIN');
  const q = useAlertaPontos(isAdmin);
  const [tab, setTab] = useState<'alerta' | 'experimental'>('alerta');
  const id = useId();
  const alerta = q.data?.find((a) => a.slug === slug);
  const tabCls = (on: boolean) => cn('h-7 rounded-md px-2.5 text-xs font-bold', on ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted');
  return (
    <div className="flex flex-col gap-2">
      <div role="tablist" aria-label="Alerta ou experimental" className="flex gap-1 self-start rounded-lg border border-border p-0.5">
        <button type="button" role="tab" id={`${id}-a`} aria-selected={tab === 'alerta'} aria-controls={`${id}-pa`} className={tabCls(tab === 'alerta')} onClick={() => setTab('alerta')}>Alerta</button>
        <button type="button" role="tab" id={`${id}-e`} aria-selected={tab === 'experimental'} aria-controls={`${id}-pe`} className={tabCls(tab === 'experimental')} onClick={() => setTab('experimental')}>Experimental</button>
      </div>
      {tab === 'alerta' ? (
        <div role="tabpanel" id={`${id}-pa`} aria-labelledby={`${id}-a`}>
          {isAdmin ? (
            <PointAlertPanel alerta={alerta} pointName={pointName} isLoading={q.isLoading} isError={q.isError} />
          ) : (
            <div data-testid="alerta-oculto" className="flex flex-col gap-2">
              <p className="m-0 rounded-lg border border-dashed border-border bg-muted p-2.5 text-xs text-muted-foreground">
                O alerta de chuva por ponto está em teste e ainda não é oficial.
              </p>
              {fallback}
            </div>
          )}
        </div>
      ) : (
        <div role="tabpanel" id={`${id}-pe`} aria-labelledby={`${id}-e`} className="flex flex-col gap-2" data-testid="aba-experimental">
          <p data-testid="rotulo-sintetico" className="m-0 rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-[11px] font-bold text-warning">
            Risco de alagamento em 6 h do logreg_v3, treinado com rótulo SINTÉTICO: não validado contra alagamento real.
          </p>
          {experimental}
        </div>
      )}
    </div>
  );
};
