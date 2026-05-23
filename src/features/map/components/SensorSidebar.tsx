import React from 'react';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';
import { getSensorConfig, getBatteryStatus } from '../utils/sensor';
import { Signal, Search, Filter, Battery, BatteryCharging, AlertTriangle, Waves, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SensorSidebarProps {
  sensors: SensorResponseDTO[];
  floodPoints?: FloodPointResponseDTO[];
  onSensorClick: (sensor: SensorResponseDTO) => void;
  onFloodPointClick?: (point: FloodPointResponseDTO) => void;
  selectedSensorId?: number;
  selectedFloodPointId?: number;
}

export const SensorSidebar: React.FC<SensorSidebarProps> = ({ 
  sensors, 
  floodPoints = [],
  onSensorClick,
  onFloodPointClick,
  selectedSensorId,
  selectedFloodPointId
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
        const configA = getSensorConfig(a);
        const configB = getSensorConfig(b);
        
        const priorityA = typePriority[configA.label] || 99;
        const priorityB = typePriority[configB.label] || 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        const nameA = a.stationName || '';
        const nameB = b.stationName || '';
        return nameA.localeCompare(nameB);
      });
  }, [sensors, search]);

  const filteredFloodPoints = React.useMemo(() => {
    return (floodPoints || [])
      .filter(p => {
        if (!p || !p.nome) return false;
        const searchTerm = (search || '').toLowerCase();
        return p.nome.toLowerCase().includes(searchTerm) ||
          (p.municipio && p.municipio.toLowerCase().includes(searchTerm)) ||
          (p.id_ponto && p.id_ponto.toLowerCase().includes(searchTerm));
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [floodPoints, search]);

  return (
    <div className="w-80 h-full border-r border-zinc-800 bg-zinc-900/95 backdrop-blur-md flex flex-col hidden md:flex z-20">
      <div className="p-6 border-b border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Signal className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-base tracking-tight text-white">
              Monitoramento
            </h2>
          </div>
        </div>
        
        <div className="flex p-1 bg-zinc-800/50 rounded-lg">
          <button 
            onClick={() => setActiveTab('sensors')}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
              activeTab === 'sensors' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Sensores
          </button>
          <button 
            onClick={() => setActiveTab('floodPoints')}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
              activeTab === 'floodPoints' ? "bg-red-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Riscos
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder={activeTab === 'sensors' ? "Buscar estação..." : "Buscar ponto de risco..."}
            className="pl-9 bg-zinc-800/50 border-zinc-700 text-sm text-white placeholder:text-zinc-600" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {activeTab === 'sensors' ? (
          (filteredSensors || []).length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Filter className="h-10 w-10 mx-auto opacity-10 text-white" />
              <p className="text-xs text-zinc-500">Nenhum sensor encontrado.</p>
            </div>
          ) : (
            filteredSensors.map((sensor) => {
              const config = getSensorConfig(sensor);
              const { isCharging, isLow, percentage } = getBatteryStatus(sensor.batteryStatus);
              const hasCoords = sensor.latitude != null && sensor.longitude != null && sensor.latitude !== 0 && sensor.longitude !== 0;
              
              return (
                <button
                  key={sensor.id}
                  onClick={() => onSensorClick(sensor)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all hover:bg-zinc-800/50 group relative border border-transparent",
                    selectedSensorId === sensor.id ? "bg-zinc-800 border-zinc-700 shadow-sm" : ""
                  )}
                >
                  {selectedSensorId === sensor.id && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-white group-hover:text-primary transition-colors pr-2">
                        {sensor.stationName || 'Estação sem nome'}
                      </span>
                      {!hasCoords && (
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">Sem coordenadas</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap",
                      config.sidebarColor
                    )}>
                      {config.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                      {React.createElement(config.icon, { className: "h-3.5 w-3.5 text-zinc-500" })}
                      <span>{sensor.value !== null ? `${sensor.value} ${sensor.unit || ''}` : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      {isCharging ? (
                        <BatteryCharging className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Battery className={cn(
                          "h-3.5 w-3.5",
                          isLow ? 'text-red-500' : 'text-emerald-500'
                        )} />
                      )}
                      <span className="text-[10px] uppercase font-bold">
                        {percentage !== null ? `${percentage}%` : (sensor.batteryStatus || 'N/A')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-[10px] text-zinc-500 uppercase tracking-widest font-medium opacity-60">
                    Lido às {sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                </button>
              );
            })
          )
        ) : (
          (filteredFloodPoints || []).length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertTriangle className="h-10 w-10 mx-auto opacity-10 text-white" />
              <p className="text-xs text-zinc-500">Nenhum ponto de risco encontrado.</p>
            </div>
          ) : (
            filteredFloodPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => onFloodPointClick?.(point)}
                className={cn(
                  "w-full text-left p-4 rounded-lg transition-all hover:bg-zinc-800/50 group relative border border-transparent",
                  selectedFloodPointId === point.id ? "bg-red-900/20 border-red-900/30 shadow-sm" : ""
                )}
              >
                {selectedFloodPointId === point.id && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-red-600 rounded-r-full" />
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white group-hover:text-red-400 transition-colors pr-2">
                      {point.nome}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">{point.municipio || 'Localidade não informada'}</span>
                  </div>
                  <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <Waves className="h-3.5 w-3.5 text-blue-400" />
                    <span>{point.tideHeight !== null ? `${point.tideHeight} ${point.tideUnit || 'm'}` : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] uppercase font-bold">{point.id_ponto}</span>
                  </div>
                </div>
                
                {point.bacia_hidrografica && (
                  <div className="mt-3 text-[10px] text-zinc-500 uppercase tracking-widest font-medium opacity-60 truncate">
                    Bacia: {point.bacia_hidrografica}
                  </div>
                )}
              </button>
            ))
          )
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 backdrop-blur-sm">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
          <span className="text-zinc-500">Status do Sistema</span>
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
