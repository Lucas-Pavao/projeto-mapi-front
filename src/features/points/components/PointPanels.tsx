import React from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { useTerrainAttributes } from '@/features/map/hooks/useTerrainAttributes';
import { fmtPt } from '@/features/map/utils/provenance';
import type { FloodPointResponseDTO } from '@/features/map/types';
import { contributorRows, type Contributor } from '../utils/contributors';
import type { RainCandidates } from '../schemas/rain-candidates.schema';
import { waterWeatherTiles } from '../utils/waterWeather';

/** "O que mais pesou agora": as 3 maiores contribuições em pontos percentuais, com o valor e a unidade da feature, e o que foi imputado. */
export const ContributorsPanel: React.FC<{ contributors: Contributor[] | undefined; imputed?: ReadonlyArray<{ featureId: string; label: string }>; unknown: boolean }> = ({ contributors, imputed, unknown }) => {
  const rows = contributorRows(contributors, 3, imputed);
  return (
    <Panel aria-label="Por que este risco" className="min-h-0">
      <PanelTitle>O que mais pesou agora</PanelTitle>
      {rows.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" data-testid="contributors">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-col gap-1">
              <div className="flex justify-between gap-2 text-[13px] leading-[18px]">
                <span>{c.label}{c.valueText && <>: <strong className="font-mono">{c.valueText}</strong></>}</span>
                <span className="font-mono font-bold">{c.ppText}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="presentation">
                <div className="h-full rounded-full bg-primary" style={{ width: `${c.width.toFixed(1)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">
          {unknown ? 'Sem previsão, não há contribuições.' : 'Nenhum fator relevante agora.'}
        </p>
      )}
      {(imputed ?? []).map((im) => (
        <p key={im.featureId} role="note" data-testid="imputed" className="m-0 rounded-lg border border-dashed border-warning px-2.5 py-2 text-[12px] leading-4">
          <strong>Imputado e declarado:</strong> {im.label} (janela com hora sem valor).
        </p>
      ))}
      <p className="m-0 mt-auto border-t border-border pt-2 text-[12px] leading-4 text-muted-foreground">
        As 3 maiores contribuições SHAP em pontos percentuais de probabilidade, com o valor físico da feature (<span className="font-mono">contributors</span>: value, unit).
      </p>
    </Panel>
  );
};

export const WaterWeatherPanel: React.FC<{ point: FloodPointResponseDTO | undefined; rain?: RainCandidates }> = ({ point, rain }) => (
  <Panel aria-label="Água e tempo agora">
    <PanelTitle>Água e tempo agora</PanelTitle>
    <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {waterWeatherTiles(point, rain).map((t) => (
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
