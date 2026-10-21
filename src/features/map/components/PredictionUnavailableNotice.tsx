import React from 'react';
import type { FloodPredictionResponseDTO } from '../types';
import { degradationText } from '@/components/risk/risk';
import { formatRecife } from '../utils/datetime';

/** Estado neutro de UNKNOWN (ADR 0007 §6): sem cor de risco e sem porcentagem. */
export const PredictionUnavailableNotice: React.FC<{
  prediction: FloodPredictionResponseDTO | null | undefined;
  className?: string;
}> = ({ prediction, className }) => {
  const lastValid = formatRecife(prediction?.lastValidIssuedAt);
  return (
    <div className={className} role="status">
      <p className="font-black uppercase tracking-tight text-zinc-300">Previsão indisponível</p>
      <p className="text-xs text-zinc-400">Motivo: {degradationText(prediction?.degradationReason)}</p>
      {lastValid && <p className="text-xs text-zinc-400">Última previsão válida: {lastValid}</p>}
    </div>
  );
};
