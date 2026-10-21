import React from 'react';
import type { TimePt } from '@/components/charts/chartMath';

export const CW = 864;

interface Win { t0: number; t1: number; sel: number }
const xf = (t: number, w: Win) => ((t - w.t0) / (w.t1 - w.t0)) * CW;
const yf = (v: number, h: number, min: number, max: number) => h - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * h;
const num = (n: number) => n.toFixed(1);

function linePts(pts: readonly TimePt[], w: Win, h: number, min: number, max: number, upTo = Infinity) {
  return pts.filter((p) => p.v != null && p.t <= upTo && p.t >= w.t0).map((p) => `${num(xf(p.t, w))},${num(yf(p.v as number, h, min, max))}`).join(' ');
}
function areaPts(pts: readonly TimePt[], w: Win, h: number, min: number, max: number, upTo = Infinity) {
  const v = pts.filter((p) => p.v != null && p.t <= upTo && p.t >= w.t0);
  if (v.length === 0) return '';
  const first = xf(v[0].t, w), last = xf(v[v.length - 1].t, w);
  return `${num(first)},${h} ${v.map((p) => `${num(xf(p.t, w))},${num(yf(p.v as number, h, min, max))}`).join(' ')} ${num(last)},${h}`;
}

const Label: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div className="text-[12px] font-bold leading-4 text-muted-foreground">{title}<br /><span className="font-normal">{sub}</span></div>
);

export interface ChartsProps extends Win {
  rain: TimePt[];
  tide: TimePt[];
  river: TimePt[];
  harbor: string;
  riverName: string;
  riverFlood: number | null;
  riverAlert: number | null;
}

/** Faixas de chuva (média dos pluviômetros), maré e rio na mesma escala de tempo, com marca no momento escolhido. */
export const EventCharts: React.FC<ChartsProps> = ({ rain, tide, river, harbor, riverName, riverFlood, riverAlert, ...w }) => {
  const rainMax = Math.max(10, Math.ceil(Math.max(0, ...rain.map((p) => p.v ?? 0)) / 10) * 10);
  const tideMax = Math.max(2.6, Math.ceil(Math.max(0, ...tide.map((p) => p.v ?? 0)) * 2) / 2);
  const rv = river.map((p) => p.v).filter((v): v is number => v != null);
  const rLo = Math.min(...rv, riverAlert ?? Infinity, riverFlood ?? Infinity);
  const rHi = Math.max(...rv, riverFlood ?? -Infinity, riverAlert ?? -Infinity);
  const rMin = Number.isFinite(rLo) ? Math.floor((rLo - 0.2) * 10) / 10 : 0;
  const rMax = Number.isFinite(rHi) && rHi > rMin ? Math.ceil((rHi + 0.2) * 10) / 10 : rMin + 1;
  const nowX = xf(w.sel, w);
  const Now = ({ h }: { h: number }) => <line x1={nowX} x2={nowX} y1="0" y2={h} stroke="var(--foreground)" strokeWidth="1.5" />;
  const svg = 'block w-full';
  return (
    <>
      <Label title="CHUVA" sub="mm/h · média" />
      <svg viewBox={`0 0 ${CW} 90`} preserveAspectRatio="none" role="img" aria-label="Chuva média ao longo do evento" className={`${svg} h-[90px]`}>
        <polygon points={areaPts(rain, w, 90, 0, rainMax)} fill="var(--chart-3)" opacity="0.15" />
        <polygon points={areaPts(rain, w, 90, 0, rainMax, w.sel)} fill="var(--chart-3)" opacity="0.55" />
        <Now h={90} />
      </svg>
      <Label title="MARÉ" sub={`m · Porto ${harbor}`} />
      <svg viewBox={`0 0 ${CW} 70`} preserveAspectRatio="none" role="img" aria-label="Maré ao longo do evento" className={`${svg} h-[70px]`}>
        <line x1="0" x2={CW} y1={yf(2.0, 70, 0, tideMax)} y2={yf(2.0, 70, 0, tideMax)} stroke="var(--warning)" strokeDasharray="4 4" strokeWidth="1" />
        <polyline points={linePts(tide, w, 70, 0, tideMax)} fill="none" stroke="var(--sand)" strokeWidth="2" opacity="0.3" />
        <polyline points={linePts(tide, w, 70, 0, tideMax, w.sel)} fill="none" stroke="var(--sand)" strokeWidth="3" />
        <Now h={70} />
      </svg>
      <Label title={riverName.toUpperCase()} sub="m · cotas APAC" />
      <svg viewBox={`0 0 ${CW} 70`} preserveAspectRatio="none" role="img" aria-label="Nível do rio ao longo do evento" className={`${svg} h-[70px]`}>
        {riverFlood != null && <line x1="0" x2={CW} y1={yf(riverFlood, 70, rMin, rMax)} y2={yf(riverFlood, 70, rMin, rMax)} stroke="var(--risk-high-edge)" strokeDasharray="4 4" strokeWidth="1" />}
        {riverAlert != null && <line x1="0" x2={CW} y1={yf(riverAlert, 70, rMin, rMax)} y2={yf(riverAlert, 70, rMin, rMax)} stroke="var(--risk-moderate)" strokeDasharray="4 4" strokeWidth="1" />}
        <polyline points={linePts(river, w, 70, rMin, rMax)} fill="none" stroke="var(--primary)" strokeWidth="2" opacity="0.3" />
        <polyline points={linePts(river, w, 70, rMin, rMax, w.sel)} fill="none" stroke="var(--primary)" strokeWidth="3" />
        <Now h={70} />
      </svg>
    </>
  );
};
