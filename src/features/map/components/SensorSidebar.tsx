import React from 'react';
import { getRiskVisual } from '../utils/risk';
import { RiskIcon } from './RiskIcon';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';
import { getSensorConfig, getDataFreshness, getSafeFormattedDate } from '../utils/sensor';
import { Signal, Search, Filter, AlertTriangle, Waves, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SensorSidebarProps {
  sensors: SensorResponseDTO[];
  floodPoints?: FloodPointResponseDTO[];
  onSensorClick: (sensor: SensorResponseDTO) => void;
  onFloodPointClick?: (point: FloodPointResponseDTO) => void;
  selectedSensorId?: number;
  selectedFloodPointId?: number;
  /** Se informado, mostra um botão Fechar visível só em telas pequenas (sheet inferior). */
  onClose?: () => void;
}

export const SensorSidebar: React.FC<SensorSidebarProps> = ({ 
  sensors, 
  floodPoints = [],
  onSensorClick,
  onFloodPointClick,
  selectedSensorId,
  selectedFloodPointId,
  onClose
}) => {
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'sensors' | 'floodPoints'>('sensors');

  const filteredSensors = React.useMemo(() => {
    const typePriority: Record<string, number> = {
      'Mista / Meteo': 1,
      'Geotécnica': 2,
      'Rio / Hidro': 3,
      'Chuva': 4,
      'Sensor': 5
    };

    return (sensors || [])
      .filter(s => {
        if (!s || !s.stationName) return false;
        const searchTerm = (search || '').toLowerCase();
        return s.stationName.toLowerCase().includes(searchTerm) ||
          (s.type && s.type.toLowerCase().includes(searchTerm)) ||
          (s.source && s.source.toLowerCase().includes(searchTerm)) ||
          (s.municipality && s.municipality.toLowerCase().includes(searchTerm));
      })
      .sort((a, b) => {
        const hasCoordsA = a.latitude != null && a.longitude != null && a.latitude !== 0 && a.longitude !== 0;
        const hasCoordsB = b.latitude != null && b.longitude != null && b.latitude !== 0 && b.longitude !== 0;

        // 1. Prioritize items without coordinates
        if (!hasCoordsA && hasCoordsB) return -1;
        if (hasCoordsA && !hasCoordsB) return 1;

        // 2. Then follow type priority
        const configA = getSensorConfig(a);
        const configB = getSensorConfig(b);
        
        const priorityA = typePriority[configA.label] || 99;
        const priorityB = typePriority[configB.label] || 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // 3. Alphabetical fallback
        const nameA = a.stationName || '';
        const nameB = b.stationName || '';
        return nameA.localeCompare(nameB);
      });
  }, [sensors, search]);

  const filteredFloodPoints = React.useMemo(() => {
    return (floodPoints || [])
      .filter(p => {
        if (!p || !p.name) return false;
        const searchTerm = (search || '').toLowerCase();
        return p.name.toLowerCase().includes(searchTerm) ||
          (p.municipality && p.municipality.toLowerCase().includes(searchTerm)) ||
          (p.slug && p.slug.toLowerCase().includes(searchTerm));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [floodPoints, search]);

  return (
    <div className="w-full md:w-[21.25rem] h-full bg-black/40 backdrop-blur-xl flex flex-col z-20">
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
              <Signal className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-base tracking-tight text-white">
              Monitoramento
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar lista de sensores e pontos"
              className="md:hidden h-10 w-10 rounded-xl flex items-center justify-center text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        
        <div role="tablist" aria-label="Tipo de lista" className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'sensors'}
            onClick={() => setActiveTab('sensors')}
            className={cn(
              "flex-1 py-2 text-2xs font-bold uppercase tracking-widest rounded-lg transition-all",
              activeTab === 'sensors' ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-zinc-400 hover:text-zinc-300"
            )}
          >
            Sensores
          </button>
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'floodPoints'}
            onClick={() => setActiveTab('floodPoints')}
            className={cn(
              "flex-1 py-2 text-2xs font-bold uppercase tracking-widest rounded-lg transition-all",
              activeTab === 'floodPoints' ? "bg-red-600/20 text-red-500 shadow-sm ring-1 ring-red-500/20" : "text-zinc-400 hover:text-zinc-300"
            )}
          >
            Riscos
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" aria-hidden="true" />
          <Input 
            aria-label={activeTab === 'sensors' ? 'Buscar estação' : 'Buscar ponto de risco'}
            placeholder={activeTab === 'sensors' ? "Buscar estação..." : "Buscar ponto de risco..."}
            className="pl-9 bg-white/5 border-white/5 text-sm text-white placeholder:text-zinc-400 focus:bg-white/10 transition-all rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {/* Indica visualmente que a lista continua além do que está visível — sem isso, com o
            scrollbar fino, não fica claro que dá pra rolar mais até o usuário tentar. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/50 to-transparent z-10" />
        <div className="h-full overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {activeTab === 'sensors' ? (
          (filteredSensors || []).length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Filter className="h-10 w-10 mx-auto opacity-10 text-white" />
              <p className="text-xs text-zinc-400">Nenhum sensor encontrado.</p>
            </div>
          ) : (
            filteredSensors.map((sensor) => {
              const config = getSensorConfig(sensor);
              const freshness = getDataFreshness(sensor.timestamp);
              const hasCoords = sensor.latitude != null && sensor.longitude != null && sensor.latitude !== 0 && sensor.longitude !== 0;
              
              return (
                <button
                  type="button"
                  key={sensor.id}
                  onClick={() => onSensorClick(sensor)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all hover:bg-white/5 group relative border border-transparent",
                    selectedSensorId === sensor.id ? "bg-white/10 border-white/10 shadow-xl" : ""
                  )}
                >
                  {selectedSensorId === sensor.id && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-white group-hover:text-primary transition-colors pr-2">
                        {sensor.stationName || 'Estação sem nome'}
                      </span>
                      {!hasCoords && (
                        <span className="text-2xs text-zinc-400 font-bold uppercase tracking-tighter mt-0.5">Sem coordenadas</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-2xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap border border-white/5",
                      config.sidebarColor
                    )}>
                      {config.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                      {React.createElement(config.icon, { className: "h-3.5 w-3.5 text-zinc-400" })}
                      <span>{sensor.value !== null ? `${sensor.value} ${sensor.unit || ''}` : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400" title={freshness.label}>
                      <div className={cn("h-2 w-2 rounded-full", freshness.dot, freshness.status === 'fresh' && "animate-pulse")} />
                      <span className={cn("text-2xs uppercase font-bold", freshness.text)}>
                        {freshness.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-2xs text-zinc-400 uppercase tracking-widest font-bold">
                    Lido às {sensor.timestamp ? getSafeFormattedDate(sensor.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--' : '--:--'}
                  </div>
                </button>
              );
            })
          )
        ) : (
          (filteredFloodPoints || []).length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertTriangle className="h-10 w-10 mx-auto opacity-10 text-white" />
              <p className="text-xs text-zinc-400">Nenhum ponto de risco encontrado.</p>
            </div>
          ) : (
            filteredFloodPoints.map((point) => {
              // Mesma cor, ícone e rótulo do marcador no mapa (getRiskVisual / RiskIcon).
              const riskLevel = point.floodPrediction?.riskLevel;
              const risk = getRiskVisual(riskLevel);
              return (
              <button
                type="button"
                key={point.id}
                onClick={() => onFloodPointClick?.(point)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all hover:bg-white/5 group relative border border-transparent",
                  selectedFloodPointId === point.id ? cn(risk.softBg, risk.border, "shadow-xl") : ""
                )}
              >
                {selectedFloodPointId === point.id && (
                  <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", risk.bg)} />
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-white transition-colors pr-2">
                      {point.name}
                    </span>
                    <span className="text-2xs text-zinc-400 font-bold uppercase tracking-tighter mt-0.5">{point.municipality || 'Localidade não informada'}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5" aria-label={`Risco: ${risk.label}`}>
                    <span className={cn("text-2xs font-black uppercase tracking-widest", risk.text)}>{risk.label}</span>
                    <span className={cn("h-7 w-7 rounded border-2 flex items-center justify-center", risk.bg, riskLevel == null || riskLevel === 'UNKNOWN' ? "border-dashed" : "")}>
                      <RiskIcon level={riskLevel} className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                    <Waves className="h-3.5 w-3.5 text-blue-500" />
                    <span>{point.tideHeight !== null ? `${point.tideHeight} ${point.tideUnit || 'm'}` : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-2xs uppercase font-bold">{point.slug}</span>
                  </div>
                </div>

                {point.basinName && (
                  <div className="mt-3 text-2xs text-zinc-400 uppercase tracking-widest font-bold truncate">
                    Bacia: {point.basinName}
                  </div>
                )}
              </button>
              );
            })
          )
        )}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex justify-between items-center text-2xs uppercase tracking-widest font-bold">
          <span className="text-zinc-400">Itens listados</span>
          <span className={cn(
            "flex items-center gap-1.5",
            activeTab === 'sensors' ? "text-primary" : "text-red-500"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              activeTab === 'sensors' ? "bg-primary" : "bg-red-500"
            )} />
            {activeTab === 'sensors' ? `${(sensors || []).length} Estações` : `${(floodPoints || []).length} Pontos de Risco`}
          </span>
        </div>
      </div>
    </div>
  );
};
