import React from 'react';
import { getRiskVisual } from '@/components/risk/risk';
import { RiskBadge } from '@/components/risk/RiskBadge';
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
    <div className="w-full md:w-[21.25rem] h-full bg-card flex flex-col z-20">
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
              <Signal className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-base text-foreground">
              Monitoramento
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar lista de sensores e pontos"
              className="md:hidden h-10 w-10 rounded-xl flex items-center justify-center text-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        
        <div role="tablist" aria-label="Tipo de lista" className="flex p-1 bg-muted rounded-xl border border-border">
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'sensors'}
            onClick={() => setActiveTab('sensors')}
            className={cn(
              "flex-1 py-2 text-2xs font-bold rounded-lg transition-all",
              activeTab === 'sensors' ? "bg-secondary text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
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
              "flex-1 py-2 text-2xs font-bold rounded-lg transition-all",
              activeTab === 'floodPoints' ? "bg-destructive/10 text-destructive shadow-sm ring-1 ring-destructive/20" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Riscos
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input 
            aria-label={activeTab === 'sensors' ? 'Buscar estação' : 'Buscar ponto de risco'}
            placeholder={activeTab === 'sensors' ? "Buscar estação..." : "Buscar ponto de risco..."}
            className="pl-9 bg-muted border-border text-sm text-foreground placeholder:text-muted-foreground focus:bg-secondary transition-all rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {/* Indica visualmente que a lista continua além do que está visível — sem isso, com o
            scrollbar fino, não fica claro que dá pra rolar mais até o usuário tentar. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 z-10" />
        <div className="h-full overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {activeTab === 'sensors' ? (
          (filteredSensors || []).length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Filter className="h-10 w-10 mx-auto opacity-10 text-foreground" />
              <p className="text-xs text-muted-foreground">Nenhum sensor encontrado.</p>
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
                    "w-full text-left p-4 rounded-xl transition-all hover:bg-muted group relative border border-transparent",
                    selectedSensorId === sensor.id ? "bg-secondary border-border shadow-elevation-overlay" : ""
                  )}
                >
                  {selectedSensorId === sensor.id && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full" />
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors pr-2">
                        {sensor.stationName || 'Estação sem nome'}
                      </span>
                      {!hasCoords && (
                        <span className="text-2xs text-muted-foreground font-bold mt-0.5">Sem coordenadas</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-2xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-border",
                      config.sidebarColor
                    )}>
                      {config.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      {React.createElement(config.icon, { className: "h-3.5 w-3.5 text-muted-foreground" })}
                      <span>{sensor.value !== null ? `${sensor.value} ${sensor.unit || ''}` : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground" title={freshness.label}>
                      <div className={cn("h-2 w-2 rounded-full", freshness.dot, freshness.status === 'fresh' && "animate-pulse")} />
                      <span className={cn("text-2xs font-bold", freshness.text)}>
                        {freshness.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-2xs text-muted-foreground font-bold">
                    Lido às {sensor.timestamp ? getSafeFormattedDate(sensor.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--' : '--:--'}
                  </div>
                </button>
              );
            })
          )
        ) : (
          (filteredFloodPoints || []).length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertTriangle className="h-10 w-10 mx-auto opacity-10 text-foreground" />
              <p className="text-xs text-muted-foreground">Nenhum ponto de risco encontrado.</p>
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
                  "w-full text-left p-4 rounded-xl transition-all hover:bg-muted group relative border border-transparent",
                  selectedFloodPointId === point.id ? cn(risk.softBg, risk.border, "shadow-elevation-overlay") : ""
                )}
              >
                {selectedFloodPointId === point.id && (
                  <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", risk.bg)} />
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground transition-colors pr-2">
                      {point.name}
                    </span>
                    <span className="text-2xs text-muted-foreground font-bold mt-0.5">{point.municipality || 'Localidade não informada'}</span>
                  </div>
                  <RiskBadge level={riskLevel} className="shrink-0" />
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Waves className="h-3.5 w-3.5 text-chart-1" />
                    <span>{point.tideHeight !== null ? `${point.tideHeight} ${point.tideUnit || 'm'}` : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-2xs font-bold">{point.slug}</span>
                  </div>
                </div>

                {point.basinName && (
                  <div className="mt-3 text-2xs text-muted-foreground font-bold truncate">
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

      <div className="p-4 border-t border-border bg-muted">
        <div className="flex justify-between items-center text-2xs font-bold">
          <span className="text-muted-foreground">Itens listados</span>
          <span className={cn(
            "flex items-center gap-1.5",
            activeTab === 'sensors' ? "text-primary" : "text-destructive"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              activeTab === 'sensors' ? "bg-primary" : "bg-destructive"
            )} />
            {activeTab === 'sensors' ? `${(sensors || []).length} estações` : `${(floodPoints || []).length} Pontos de risco`}
          </span>
        </div>
      </div>
    </div>
  );
};
