import React from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { useTerrainAttributes } from '@/features/map/hooks/useTerrainAttributes';
import { fmtPt } from '@/features/map/utils/provenance';
import type { FloodPointResponseDTO } from '@/features/map/types';
import { contributorShares, type Contributor } from '../utils/contributors';
import { waterWeatherTiles } from '../utils/waterWeather';

/** "O que mais pesou agora": fatores do campo `contributors` da previsão, em barras de participação. */
export const ContributorsPanel: React.FC<{ contributors: Contributor[] | undefined; unknown: boolean }> = ({ contributors, unknown }) => {
  const shares = contributorShares(contributors);
  return (
    <Panel aria-label="Por que este risco" className="min-h-0">
      <PanelTitle>O que mais pesou agora</PanelTitle>
      {shares.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {shares.map((c) => (
            <li key={c.id} className="flex flex-col gap-1">
              <div className="flex justify-between text-[13px] leading-[18px]">
                <span>{c.label}</span>
                <span className="font-mono font-bold">{Math.round(c.share * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="presentation">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c.share * 100).toFixed(1)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">
          {unknown ? 'Sem previsão, não há contribuições.' : 'Nenhum fator relevante agora.'}
        </p>
      )}
      <p className="m-0 mt-auto border-t border-border pt-2 text-[12px] leading-4 text-muted-foreground">
        Contribuições vêm do campo <span className="font-mono">contributors</span> da previsão (nomes do catálogo de features).
      </p>
    </Panel>
  );
};

export const WaterWeatherPanel: React.FC<{ point: FloodPointResponseDTO | undefined }> = ({ point }) => (
  <Panel aria-label="Água e tempo agora">
    <PanelTitle>Água e tempo agora</PanelTitle>
    <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {waterWeatherTiles(point).map((t) => (
        <div key={t.label} className="flex flex-col gap-0.5 rounded-xl bg-muted p-2.5" data-testid="water-tile">
          <dt className="text-[11px] leading-[14px] text-muted-foreground">{t.label}</dt>
          <dd className={`m-0 font-mono text-[17px] font-bold leading-[22px] ${t.tone ?? 'text-foreground'}`}>{t.value}</dd>
          <dd className="m-0 text-[11px] leading-[14px] text-muted-foreground">{t.sub}</dd>
        </div>
      ))}
    </dl>
  </Panel>
);

/** Terreno do ponto (PE3D, MDT) e o aviso do ADR 0009: a cota não é comparável ao nível da maré. */
export const TerrainPanel: React.FC<{ slug: string; distanceToChannelM: number | null | undefined }> = ({ slug, distanceToChannelM }) => {
  const state = useTerrainAttributes(slug);
  const elev = state.status === 'ready' ? state.data.streetElevationM : null;
  return (
    <Panel aria-label="Terreno do ponto" data-testid="terrain-facts">
      <div className="flex items-baseline justify-between">
        <PanelTitle>Terreno (PE3D · MDT 1 m)</PanelTitle>
        <Link to="/modelo/simulador" className="text-[12px] text-primary hover:text-foreground">Simular este ponto</Link>
      </div>
      {state.status === 'error' ? (
        <p className="m-0 text-[12px] leading-4 text-warning">Terreno indisponível (falha ao consultar a API).</p>
      ) : state.status === 'loading' ? (
        <p className="m-0 text-[12px] leading-4 text-muted-foreground">Carregando terreno…</p>
      ) : state.data.status === 'NO_DATA' ? (
        <p className="m-0 text-[12px] leading-4 text-foreground">Sem dado de terreno para este ponto (fora das folhas do MDT ou sem carga).</p>
      ) : null}
      <div className="flex gap-5">
        <div>
          <div className="font-mono text-[22px] font-bold leading-[26px]">{elev != null ? `${fmtPt(elev, 2)} m` : '—'}</div>
          <div className="text-[11px] leading-[14px] text-muted-foreground">cota da rua</div>
        </div>
        <div>
          <div className="font-mono text-[22px] font-bold leading-[26px]">{distanceToChannelM != null ? `${fmtPt(distanceToChannelM, 0)} m` : '—'}</div>
          <div className="text-[11px] leading-[14px] text-muted-foreground">até o canal</div>
        </div>
      </div>
      <div role="note" data-testid="tide-datum-notice" className="flex gap-2 rounded-[10px] border border-warning p-2.5 text-[12px] leading-4">
        <TriangleAlert className="mt-px size-4 shrink-0 text-warning" aria-hidden="true" />
        <span>A cota está no datum vertical do MDT (não confirmado) e não é comparável ao nível da maré (NR/DHN) até haver referência vertical decidida (ADR 0009).</span>
      </div>
    </Panel>
  );
};
