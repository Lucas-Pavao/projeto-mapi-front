import React, { useEffect, useState } from 'react';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MapMouseEvent } from 'maplibre-gl';
import { Map, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from '@/components/ui/query-state';
import { Button } from '@/components/ui/button';
import { usePublicRisk, type Coord } from '@/features/public-risk/hooks/usePublicRisk';
import { PublicRiskResult } from '@/features/public-risk/components/PublicRiskResult';
import { PublicHoje } from '@/features/horizontes/components/PublicHoje';
import { PUBLIC_WARNING } from '@/features/public-risk/utils/headlines';
import { retryAfterSeconds } from '@/features/public-risk/services/public-risk.service';
import { geoFailureText, insideRmr, roundCoord, type GeoFailure } from '@/features/public-risk/utils/coords';
import { httpStatus } from '@/lib/apiError';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { cn } from '@/lib/utils';

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
  const places = (useFloodPoints().data ?? []).filter((p) => p.active).slice(0, 5);

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
    <div className="grid min-h-[calc(100dvh-60px)] w-full grid-cols-1 lg:grid-cols-[640px_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-[22px] border-border bg-background px-4 py-6 sm:px-8 lg:border-r lg:px-12 lg:py-10">
        <div>
          <h1 className="m-0 text-balance text-[32px] leading-9 font-extrabold tracking-[-0.02em] text-foreground lg:text-[40px] lg:leading-[44px]">Minha rua pode alagar?</h1>
          <p className="mt-2.5 mb-0 text-pretty text-base leading-6 text-muted-foreground">Escolha um local no mapa, num ponto monitorado ou use a sua localização. Mostramos a chuva e a previsão do ponto monitorado mais perto. Não precisa de login e não guardamos a sua posição.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" className="h-12 w-full gap-2 rounded-[10px] text-sm font-bold shadow-elevation-raised" onClick={locate} disabled={busy}>
            {busy ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <LocateFixed className="size-[18px]" aria-hidden="true" />}
            {locating ? 'Buscando sua posição…' : coord ? 'Atualizar onde estou' : 'Onde estou'}
          </Button>
          <p className="m-0 text-caption text-muted-foreground">Enviamos só uma posição aproximada (cerca de 100 m). Sem busca por endereço: toque no mapa ou escolha um ponto monitorado.</p>
          {places.length > 0 && (
            <ul aria-label="Pontos monitorados" className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0">
              {places.map((p) => {
                const active = coord?.lat === p.latitude && coord?.lon === p.longitude;
                return (
                  <li key={p.slug}>
                    <button type="button" aria-pressed={active} onClick={() => choose({ lat: p.latitude, lon: p.longitude }, true)}
                      className={cn('mapi-press h-9 rounded-full border px-3.5 text-[13px] font-bold', active ? 'border-primary bg-primary/10 text-primary shadow-elevation-raised' : 'border-input text-foreground hover:bg-muted')}>{p.name}</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {outside && <p role="alert" className="m-0 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-body text-destructive">{OUTSIDE_TEXT}</p>}
        {geoError && <p role="alert" className="m-0 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-body text-destructive">{geoFailureText(geoError)}</p>}

        {coord === null ? (
          <>
            <EmptyState title="Informe onde você está." hint="Usamos sua posição só para buscar o ponto crítico mais próximo." />
            <p role="note" className="m-0 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] leading-[18px] text-warning">{PUBLIC_WARNING}</p>
          </>
        ) : query.isPending ? (
          <div role="status" className="flex min-h-40 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-body text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Consultando o risco perto de você…
          </div>
        ) : query.isError ? (
          <div role="alert" className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4">
            <p className="m-0 text-body-strong text-foreground">{errorText(query.error)}</p>
            {![422, 429].includes(httpStatus(query.error) ?? 0) && <Button type="button" variant="outline" className="h-11 px-4" onClick={() => void query.refetch()}>Tentar de novo</Button>}
          </div>
        ) : (
          <>
            <PublicRiskResult risk={query.data} />
            <PublicHoje municipio={query.data.nearestPoint?.municipality} className="bg-card shadow-elevation-raised" />
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <Link to="/map" className="mapi-press flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-[10px] bg-foreground px-4 text-[15px] font-bold text-background shadow-elevation-raised hover:opacity-90">Está alagado aqui? Avise</Link>
          <a href="tel:199" className="mapi-press flex h-[52px] items-center justify-center rounded-[10px] border border-destructive px-5 text-[15px] font-bold text-destructive hover:bg-destructive/10">Emergência: 199</a>
        </div>
        <p className="mt-auto mb-0 text-xs leading-[18px] text-muted-foreground">Dados: APAC, Cemaden, ANA, Open-Meteo e Marinha. O MAPi é um projeto de pesquisa do CIn/UFPE e não substitui os avisos oficiais da Defesa Civil.</p>
      </div>

      <section aria-label="Mapa para escolher o local" className="relative min-h-[360px]">
        <div className="absolute inset-0">
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
        <p className="pointer-events-none absolute bottom-3 left-3 m-0 rounded-md bg-popover px-2.5 py-1 text-xs text-foreground shadow-elevation-raised">Toque no mapa para escolher o local.</p>
      </section>
    </div>
  );
};
export default MyStreetPage;
