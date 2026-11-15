import React, { useMemo, useState } from 'react';
import { QueryState } from '@/components/ui/query-state';
import { useSensorsLatest } from '@/features/sensors/hooks/useSensorsLatest';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { SensorList } from '@/features/sensors/components/SensorList';
import { SensorDetail } from '@/features/sensors/components/SensorDetail';
import { PageFrame } from '@/features/operacao/components/Panel';
import { TIDE_KEY, buildItems } from '@/features/sensors/utils/sensorView';
import type { Filter } from '@/features/sensors/components/SensorList';
import { StationDetail } from '@/features/sensors/components/StationDetail';
import { useCanonicalStations, useStationHourly } from '@/features/sensors/hooks/useStations';
import { useMeasuredRain } from '@/features/map/hooks/useMeasuredRain';
import { aliasedSensorIds, isAliased, stationListItem } from '@/features/sensors/utils/stationView';

const HOUR = 3_600_000;

export const SensorsPage: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [chosen, setChosen] = useState<string | null>(null);
  const query = useSensorsLatest();
  // 18 h atrás e 6 h à frente: a maré prevista aparece inteira; "agora" fica a 75 % da janela.
  const tl = useTimeline(18, 6);

  return (
    <PageFrame className="lg:flex-row">
      <QueryState query={query} what="sensores" emptyTitle="Nenhum sensor com leitura." emptyHint="Quando a coleta trouxer leituras, elas aparecem aqui.">
        {(sensors) => <Content sensors={sensors} tl={tl} filter={filter} setFilter={setFilter} chosen={chosen} setChosen={setChosen} />}
      </QueryState>
    </PageFrame>
  );
};

type Sensors = NonNullable<ReturnType<typeof useSensorsLatest>['data']>;
interface CP { sensors: Sensors; tl: ReturnType<typeof useTimeline>; filter: Filter; setFilter: (f: Filter) => void; chosen: string | null; setChosen: (k: string) => void }

const Content: React.FC<CP> = ({ sensors, tl, filter, setFilter, chosen, setChosen }) => {
  // B1: estações canônicas do Cemaden. Se a API não responder, a lista cai nos sensores ao vivo, sem tela quebrada.
  const canonical = useCanonicalStations();
  const rainAcc = useMeasuredRain(true);
  const stations = useMemo(() => canonical.data ?? [], [canonical.data]);
  const all = useMemo(() => {
    const aliased = aliasedSensorIds(stations);
    const live = buildItems(sensors.filter((s) => !isAliased(s, aliased)), tl.data, tl.now);
    const accById = new Map((rainAcc.data?.stations ?? []).map((a) => [a.canonicalId, a]));
    const st = stations.map((x) => stationListItem(x, accById.get(x.canonicalId)));
    const liveRain = live.filter((r) => r.kind === 'chuva');
    const others = live.filter((r) => r.kind !== 'chuva');
    // Rio e maré, depois as estações do Cemaden e os pluviômetros ao vivo sem canônica; quem não responde vai para o fim.
    const ordered = [...others, ...st, ...liveRain];
    return [...ordered.filter((r) => !r.off), ...ordered.filter((r) => r.off)];
  }, [sensors, stations, rainAcc.data, tl.data, tl.now]);
  const list = all.filter((r) => filter === 'all' || (filter === 'problem' ? r.problem || r.off : r.kind === filter));
  const current = list.find((r) => r.key === chosen) ?? list[0] ?? null;
  const online = `${all.filter((r) => !r.off).length} de ${all.length} respondendo`;
  const station = current ? stations.find((x) => x.canonicalId === current.key) : undefined;
  const hourly = useStationHourly(station?.canonicalId ?? null);
  const sensor = current && !station && current.key !== TIDE_KEY ? sensors.find((s) => s.sensorId === current.key) : undefined;
  const sel = current?.key === TIDE_KEY ? ({ kind: 'mare' } as const) : sensor ? ({ kind: current!.kind as 'chuva' | 'rio', sensor } as const) : null;
  const t0 = tl.now - 18 * HOUR;
  const t1 = tl.now + 6 * HOUR;
  return (
    <>
      <SensorList items={list} selected={current?.key ?? ''} filter={filter} onFilter={setFilter} onSelect={setChosen} online={online} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto]">
        {station ? <StationDetail station={station} hourly={hourly} /> : sel ? <SensorDetail sel={sel} timeline={tl.data} now={tl.now} t0={t0} t1={t1} /> : <p className="text-body text-muted-foreground lg:col-span-12">Nenhum sensor neste filtro.</p>}
      </div>
    </>
  );
};
export default SensorsPage;
