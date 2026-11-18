import React from 'react';
import { Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { useTerrainAttributes } from '@/features/map/hooks/useTerrainAttributes';
import type { FloodPointResponseDTO } from '@/features/map/types';
import { contributorRows, type Contributor } from '../utils/contributors';
import type { RainCandidates } from '../schemas/rain-candidates.schema';
import { waterWeatherTiles, type TerrainInput } from '../utils/waterWeather';

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

export const WaterWeatherPanel: React.FC<{ point: FloodPointResponseDTO | undefined; rain?: RainCandidates }> = ({ point, rain }) => {
  const state = useTerrainAttributes(point?.slug ?? '');
  const terrain: TerrainInput = state.status !== 'ready' ? { status: state.status } : { status: state.data.status === 'NO_DATA' ? 'no_data' : 'ready', streetElevationM: state.data.streetElevationM };
  return (
    <Panel aria-label="Água e tempo agora" data-testid="terrain-facts">
      <PanelTitle>Água e tempo agora</PanelTitle>
      <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {waterWeatherTiles(point, rain, terrain).map((t) => (
          <div key={t.label} className="flex flex-col gap-0.5 rounded-xl bg-muted p-2.5" data-testid="water-tile">
            <dt className="text-[11px] leading-[14px] text-muted-foreground">{t.label}</dt>
            <dd className={`m-0 font-mono text-[17px] font-bold leading-[22px] ${t.tone ?? 'text-foreground'}`}>{t.value}</dd>
            <dd className="m-0 text-[11px] leading-[14px] text-muted-foreground">{t.sub}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
};
