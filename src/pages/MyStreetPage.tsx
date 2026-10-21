import React, { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { Button } from '@/components/ui/button';
import { usePublicRisk, type Coord } from '@/features/public-risk/hooks/usePublicRisk';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { showsExperimentalLabel } from '@/components/risk/risk';

export const MyStreetPage: React.FC = () => {
  const [coord, setCoord] = useState<Coord | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const query = usePublicRisk(coord);

  const locate = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Este aparelho não informa a localização.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoord({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setGeoError('Não foi possível obter sua localização. Permita o acesso e tente de novo.'),
    );
  };

  return (
    <PageShell title="Minha rua" description="Veja o risco de alagamento perto de você. Não precisa de login.">
      <Button type="button" className="h-11 w-fit px-4" onClick={locate}>Usar minha localização</Button>
      {geoError && <p role="alert" className="text-body text-destructive">{geoError}</p>}
      {coord === null ? (
        <EmptyState title="Informe onde você está." hint="Usamos sua posição só para buscar o ponto crítico mais próximo." />
      ) : (
        <QueryState query={query} what="o risco perto de você" isEmpty={(d) => d.nearestPoint === null} emptyTitle="Nenhum ponto monitorado a menos de 1 km." emptyHint="Isto não significa risco baixo: sem ponto por perto, o MAPi não tem previsão para este local.">
          {(r) => (
            <section className="space-y-3 rounded-xl border border-border bg-card p-4" aria-label="Risco perto de você">
              <p className="text-title text-foreground">{r.nearestPoint?.name} · a cerca de {r.nearestPoint?.distanceM} m</p>
              <RiskBadge level={r.nearestPoint?.riskLevel} />
              {showsExperimentalLabel({ riskLevel: r.nearestPoint?.riskLevel, modelValidationStatus: r.modelValidationStatus }) && <ExperimentalBadge />}
              <p className="text-body text-muted-foreground">{r.meaning}</p>
            </section>
          )}
        </QueryState>
      )}
    </PageShell>
  );
};
export default MyStreetPage;
