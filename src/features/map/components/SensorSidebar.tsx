import React from 'react';
import type { SensorResponseDTO } from '../types';
import { Thermometer, Battery, Signal, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SensorSidebarProps {
  sensors: SensorResponseDTO[];
  onSensorClick: (sensor: SensorResponseDTO) => void;
  selectedSensorId?: number;
}

export const SensorSidebar: React.FC<SensorSidebarProps> = ({ 
  sensors, 
  onSensorClick,
  selectedSensorId 
}) => {
  const [search, setSearch] = React.useState('');

  const filteredSensors = sensors.filter(s => 
    s.stationName.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 h-full border-r border-border bg-card/95 backdrop-blur-md flex flex-col hidden md:flex z-20">
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Signal className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-bold text-base tracking-tight text-foreground">
            Sensores Ativos
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <Input 
            placeholder="Buscar estação..." 
            className="pl-9 bg-background/50 border-border text-sm placeholder:text-muted-foreground/40" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredSensors.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Filter className="h-10 w-10 mx-auto opacity-10 text-foreground" />
            <p className="text-xs text-muted-foreground">Nenhum sensor encontrado.</p>
          </div>
        ) : (
          filteredSensors.map((sensor) => (
            <button
              key={sensor.id}
              onClick={() => onSensorClick(sensor)}
              className={cn(
                "w-full text-left p-4 rounded-lg transition-all hover:bg-zinc-800/50 group relative border border-transparent",
                selectedSensorId === sensor.id ? "bg-zinc-800/80 border-border shadow-sm" : ""
              )}
            >
              {selectedSensorId === sensor.id && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {sensor.stationName}
                </span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                  sensor.type === 'Tide' ? "bg-indigo-500/10 text-indigo-400" : "bg-orange-500/10 text-orange-400"
                )}>
                  {sensor.type === 'Tide' ? 'Maré' : 'Temp'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{sensor.value} {sensor.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Battery className={cn(
                    "h-3.5 w-3.5",
                    sensor.batteryStatus === 'Low' ? "text-red-500" : "text-emerald-500"
                  )} />
                  <span className="text-[10px] uppercase font-bold">{sensor.batteryStatus}</span>
                </div>
              </div>
              
              <div className="mt-3 text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-60">
                Lido às {new Date(sensor.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-background/30 backdrop-blur-sm">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
          <span className="text-muted-foreground">Monitoramento Online</span>
          <span className="text-primary flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {sensors.length} Estações
          </span>
        </div>
      </div>
    </div>
  );
};
