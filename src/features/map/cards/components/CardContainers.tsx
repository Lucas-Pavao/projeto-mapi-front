import React from 'react';
import { X } from 'lucide-react';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { useRainCandidates } from '@/features/points/hooks/useRainCandidates';
import { seriesKeys, seriesOf } from '@/features/sensors/utils/sensorView';
import { httpStatus } from '@/lib/apiError';
import type { FloodPointResponseDTO, SensorResponseDTO } from '../../types';
import { useLocationAnalysis } from '../hooks/useLocationAnalysis';
import { useStationCard } from '../hooks/useStationCard';
import type { AnalysisTab } from '../utils/analysis';
import { cmToM, riverTrendCmH } from '../utils/river';
import { AnalysisPanel } from './AnalysisPanel';
import { LocationCard } from './LocationCard';
import { PointCard } from './PointCard';
import { useAuth } from '@/hooks/useAuth';
import { hasRole, parseRole } from '@/lib/roles';
import { useAlagamentoPontos } from '@/features/alagamento/hooks/useAlagamentoPontos';
import { RiverCard } from './RiverCard';
import { StationCard } from './StationCard';

const Shell: React.FC<{ label: string; onClose?: () => void; children: React.ReactNode; className?: string }> = ({ label, onClose, children, className }) => (
  <div role="dialog" aria-label={label} className={`flex w-[320px] max-w-full flex-col gap-2 rounded-[14px] border border-border bg-popover p-3.5 text-[13px] text-foreground shadow-elevation-overlay ${className ?? ''}`}>
    <div className="flex items-start justify-between gap-2"><span>{children}</span>{onClose && <button type="button" onClick={onClose} aria-label="Fechar" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" aria-hidden="true" /></button>}</div>
  </div>
);

interface StationProps { id: string; onClose: () => void; onOpenPoint?: (slug: string) => void }

/** Busca o card do pluviômetro (B6) e mostra carregando, erro ou o card. */
export const StationCardContainer: React.FC<StationProps> = ({ id, onClose, onOpenPoint }) => {
  const q = useStationCard(id);
  if (q.data) return <StationCard card={q.data} onClose={onClose} onOpenPoint={onOpenPoint} />;
  const notFound = q.isError && httpStatus(q.error) === 404;
  return <Shell label="Pluviômetro" onClose={onClose}>{q.isError ? (notFound ? 'Estação não encontrada.' : 'Não foi possível carregar o card da estação.') : 'Carregando estação…'}</Shell>;
};

interface PointProps { point: FloodPointResponseDTO; onClose: () => void; onOpenAnalysis: () => void }

/** Resumo do ponto: alerta por regressão (GET /api/alagamento/pontos, só ADMIN em modo sombra) e a chuva do ponto (B3). */
export const PointCardContainer: React.FC<PointProps> = ({ point, onClose, onOpenAnalysis }) => {
  const rain = useRainCandidates(point.slug);
  const { user } = useAuth();
  const isAdmin = hasRole(parseRole(user?.role), 'ADMIN');
  const al = useAlagamentoPontos(isAdmin);
  return (
    <PointCard point={point} rain={rain.data} onClose={onClose} onOpenAnalysis={onOpenAnalysis} isAdmin={isAdmin}
      alagamento={al.data?.find((a) => a.slug === point.slug)} alagamentoLoading={al.isLoading} alagamentoError={al.isError} />
  );
};

interface PanelProps { point: FloodPointResponseDTO; tab: AnalysisTab; onTab: (t: AnalysisTab) => void; onClose: () => void; onOpenStation: (id: string) => void }

export const AnalysisPanelContainer: React.FC<PanelProps> = ({ point, tab, onTab, onClose, onOpenStation }) => {
  const rain = useRainCandidates(point.slug);
  const { user } = useAuth();
  const isAdmin = hasRole(parseRole(user?.role), 'ADMIN');
  const al = useAlagamentoPontos(isAdmin);
  return (
    <AnalysisPanel point={point} rain={rain.data} isAdmin={isAdmin} alagamento={al.data?.find((a) => a.slug === point.slug)}
      alagamentoLoading={al.isLoading} alagamentoError={al.isError} tab={tab} onTab={onTab} onClose={onClose} onOpenStation={onOpenStation} />
  );
};

interface LocationProps { lat: number; lon: number; onClose: () => void; onOpenPoint: (slug: string) => void; onOpenStation: (id: string) => void; onReport?: () => void }

export const LocationCardContainer: React.FC<LocationProps> = ({ lat, lon, onClose, onOpenPoint, onOpenStation, onReport }) => {
  const q = useLocationAnalysis({ lat, lon });
  if (q.data) return <LocationCard analysis={q.data} onClose={onClose} onOpenPoint={onOpenPoint} onOpenStation={onOpenStation} onReport={onReport} />;
  return <Shell label="Análise do local" onClose={onClose} className="w-[400px]">{q.isError ? 'Não foi possível analisar este local. Tente de novo em instantes.' : 'Analisando o local…'}</Shell>;
};

/** Régua do rio a partir do sensor selecionado; a tendência vem da série de 3 h da linha do tempo. */
export const RiverCardContainer: React.FC<{ sensor: SensorResponseDTO; onClose: () => void }> = ({ sensor, onClose }) => {
  const tl = useTimeline(3, 0);
  // A série da linha do tempo vem em cm (média de water_level); a tendência espera metros.
  const series = seriesOf(tl.data, 'rio', seriesKeys(sensor)).map((p) => ({ ...p, v: cmToM(p.v) }));
  const trend = riverTrendCmH(series, tl.now);
  const levelM = sensor.waterLevel != null ? cmToM(sensor.waterLevel) : sensor.value ?? null;
  return (
    <RiverCard name={sensor.stationName ?? sensor.sensorId} riverName={sensor.riverName} stationId={sensor.sensorId} levelM={levelM}
      trendCmH={trend} levels={{ pre: cmToM(sensor.riverPreAlertLevel), alert: cmToM(sensor.riverAlertLevel), flood: cmToM(sensor.riverFloodLevel) }} onClose={onClose} />
  );
};
