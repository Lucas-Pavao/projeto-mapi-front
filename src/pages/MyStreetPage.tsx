import React, { useEffect, useState } from 'react';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import type { MapMouseEvent } from 'maplibre-gl';
import { Map, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import { useTheme } from '@/hooks/useTheme';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/query-state';
import { Button } from '@/components/ui/button';
import { usePublicRisk, type Coord } from '@/features/public-risk/hooks/usePublicRisk';
import { PUBLIC_WARNING, PublicRiskResult } from '@/features/public-risk/components/PublicRiskResult';
import { retryAfterSeconds } from '@/features/public-risk/services/public-risk.service';
import { geoFailureText, insideRmr, roundCoord, type GeoFailure } from '@/features/public-risk/utils/coords';
import { httpStatus } from '@/lib/apiError';

const OUTSIDE_TEXT = 'Este local fica fora da Região Metropolitana do Recife. O MAPi só consulta endereços da região.';

function errorText(error: unknown): string {
  switch (httpStatus(error)) {
    case 422: return OUTSIDE_TEXT;
    case 429: {
      const s = retryAfterSeconds(error);
      return `Muitas consultas seguidas. Espere${s != null ? ` ${s} segundo${s === 1 ? '' : 's'}` : ' um pouco'} e tente de novo.`;
    }
    case null: return 'Sem conexão. Confira a internet e tente de novo.';
    default: return 'Não foi possível consultar agora. Tente de novo em instantes.';
  }
}

/** Leva o mapa ao ponto escolhido quando a escolha vem da localização do aparelho. */
const FlyToChoice: React.FC<{ target: Coord | null }> = ({ target }) => {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (isLoaded && map && target) map.flyTo({ center: [target.lon, target.lat], zoom: Math.max(map.getZoom(), 14), duration: 800 });
  }, [isLoaded, map, target]);
  return null;
};

export const MyStreetPage: React.FC = () => {
  const { theme } = useTheme();
  const [flyTo, setFlyTo] = useState<Coord | null>(null);
  const [outside, setOutside] = useState(false);
  const [coord, setCoord] = useState<Coord | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<GeoFailure | null>(null);
  const query = usePublicRisk(coord);

  /** Escolha de local (localização do aparelho ou toque no mapa). Fora da RMR não consulta: a API só atende a região. */
  const choose = (c: Coord, fly: boolean) => {
    setGeoError(null);
    if (!insideRmr(c.lat, c.lon)) {
      setOutside(true);
      setCoord(null);
      return;
    }
    setOutside(false);
    setCoord(c);
    if (fly) setFlyTo(c);
  };

  const onMapClick = (e: MapMouseEvent) => choose({ lat: e.lngLat.lat, lon: e.lngLat.lng }, false);

  const locate = () => {
    setGeoError(null);
    if (!('geolocation' in navigator) || !navigator.geolocation) return setGeoError('unsupported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        // Mesma posição aproximada: a chave de cache não muda, então "Atualizar" refaz a consulta de propósito.
        if (coord && roundCoord(coord.lat) === roundCoord(next.lat) && roundCoord(coord.lon) === roundCoord(next.lon)) void query.refetch();
        choose(next, true);
      },
      (err) => {
        setLocating(false);
        setGeoError(err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable');
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 },
    );
  };

  const busy = locating || (coord !== null && query.isFetching && !query.data);

  return (
    <PageShell title="Minha rua" description="Veja o risco de alagamento perto de você. Não precisa de login e não guardamos a sua posição.">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" className="h-11 gap-2 px-4" onClick={locate} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="size-4" aria-hidden="true" />}
          {locating ? 'Buscando sua posição…' : coord ? 'Atualizar minha localização' : 'Usar minha localização'}
        </Button>
        <p className="text-caption text-muted-foreground">Enviamos só uma posição aproximada (cerca de 100 m).</p>
      </div>
      <section aria-label="Mapa para escolher o local" className="flex flex-col gap-1">
        <div className="relative h-72 overflow-hidden rounded-xl border border-border sm:h-96">
          <Map theme={theme} center={[-34.877, -8.057]} zoom={11} onClick={onMapClick}>
            <FlyToChoice target={flyTo} />
            {coord && (
              <MapMarker longitude={coord.lon} latitude={coord.lat} offset={[0, -12]}>
                <MarkerContent>
                  <span role="img" aria-label="Local escolhido" className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-elevation-overlay">
                    <MapPin className="size-4" aria-hidden="true" />
                  </span>
                </MarkerContent>
              </MapMarker>
            )}
          </Map>
        </div>
        <p className="text-caption text-muted-foreground">Toque no mapa para escolher o local, ou use a sua localização. Sem busca por endereço.</p>
      </section>
      {outside && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-body text-destructive">{OUTSIDE_TEXT}</p>}
      {geoError && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-body text-destructive">{geoFailureText(geoError)}</p>}

      {coord === null ? (
        <>
          <EmptyState title="Informe onde você está." hint="Usamos sua posição só para buscar o ponto crítico mais próximo." />
          <p role="note" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-body text-warning">{PUBLIC_WARNING}</p>
        </>
      ) : query.isPending ? (
        <div role="status" className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-border bg-card text-body text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Consultando o risco perto de você…
        </div>
      ) : query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4">
          <p className="text-body-strong text-foreground">{errorText(query.error)}</p>
          {![422, 429].includes(httpStatus(query.error) ?? 0) && <Button type="button" variant="outline" className="h-11 px-4" onClick={() => void query.refetch()}>Tentar de novo</Button>}
        </div>
      ) : (
        <PublicRiskResult risk={query.data} />
      )}
    </PageShell>
  );
};
export default MyStreetPage;
